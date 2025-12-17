"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { apiClient } from '../../lib/api';
import { saveAuthTokens, loadAuthTokens, clearAuthTokens, AuthTokens } from '../../lib/auth';

export type UserRole = 'admin' | 'partner' | 'staff';
export type QuantityType = 'kg' | 'dozen' | 'pack' | 'unit' | 'custom';
export type ExpenseCategory = 'rent' | 'transport' | 'salary' | 'other';
export type AppPage = 'login' | 'dashboard' | 'add-entry' | 'history' | 'insights' | 'add-investor' | 'new-account';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  disabled?: boolean;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'expense';
  productName?: string; // For buy/sell
  expenseCategory?: ExpenseCategory; // For expense
  expenseDescription?: string; // For expense
  quantity?: number; // For buy/sell
  quantityType?: QuantityType; // For buy/sell
  pricePerUnit?: number; // For buy/sell
  totalAmount: number;
  personName: string;
  date: Date;
  notes?: string;
}

export interface Investor {
  id: string;
  name: string;
  totalInvested: number;
  totalWithdrawn: number;
  netInvestment: number;
  lastActivityDate: Date;
  investments: InvestmentActivity[];
}

export interface InvestmentActivity {
  id: string;
  type: 'investment' | 'withdrawal';
  amount: number;
  date: Date;
  notes?: string;
}

interface InvestorApiResponse {
  id: string;
  name: string;
  total_invested: number;
  total_withdrawn: number;
  net_investment: number;
  last_activity_at?: string | null;
}

interface InvestorActivityPayload {
  type: 'investment' | 'withdrawal';
  amount: number;
  notes?: string;
}

interface UserApiResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  disabled?: boolean;
}

interface TransactionApiResponse {
  id: string;
  type: Transaction['type'];
  product_name?: string | null;
  expense_category?: ExpenseCategory | null;
  expense_description?: string | null;
  quantity?: number | null;
  quantity_type?: QuantityType | null;
  price_per_unit?: number | null;
  total_amount: number;
  person_name: string;
  occurred_at: string;
  notes?: string | null;
}

export interface AppDataState {
  users: User[];
  transactions: Transaction[];
  investors: Investor[];
}

interface AppContextType {
  user: User | null;
  data: AppDataState;
  users: User[];
  transactions: Transaction[];
  investors: Investor[];
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  updateUserRole: (userId: string, role: UserRole) => Promise<boolean>;
  disableUser: (userId: string) => Promise<boolean>;
  toggleUserStatus: (userId: string, disabled: boolean) => Promise<boolean>;
  getAvailableProducts: () => string[];
  addInvestor: (name: string) => Promise<boolean>;
  addInvestment: (investorId: string, amount: number, notes?: string) => Promise<boolean>;
  addWithdrawal: (investorId: string, amount: number, notes?: string) => Promise<boolean>;
  currentPage: AppPage;
  setCurrentPage: (page: AppPage, options?: { role?: UserRole | null }) => void;
  isAuthorized: (page: AppPage, roleOverride?: UserRole | null) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PAGE: AppPage = 'login';
const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';

const mapInvestorResponse = (inv: InvestorApiResponse): Investor => ({
  id: inv.id,
  name: inv.name,
  totalInvested: Number(inv.total_invested),
  totalWithdrawn: Number(inv.total_withdrawn),
  netInvestment: Number(inv.net_investment),
  lastActivityDate: inv.last_activity_at ? new Date(inv.last_activity_at) : new Date(),
  investments: [],
});

const mapTransactionResponse = (tx: TransactionApiResponse): Transaction => ({
  id: tx.id,
  type: tx.type,
  productName: tx.product_name ?? undefined,
  expenseCategory: tx.expense_category ?? undefined,
  expenseDescription: tx.expense_description ?? undefined,
  quantity: tx.quantity ?? undefined,
  quantityType: tx.quantity_type ?? undefined,
  pricePerUnit: tx.price_per_unit ?? undefined,
  totalAmount: Number(tx.total_amount),
  personName: tx.person_name,
  date: new Date(tx.occurred_at),
  notes: tx.notes ?? undefined,
});

const PAGE_ACCESS: Partial<Record<AppPage, UserRole[]>> = {
  'add-entry': ['admin', 'partner'],
  'add-investor': ['admin'],
  'new-account': ['admin'],
};

const PUBLIC_PAGES: AppPage[] = ['login'];
const LOG_PREFIX = '[AppContext]';

const logInfo = (...args: unknown[]) => {
  console.log(LOG_PREFIX, ...args);
};

const logWarn = (...args: unknown[]) => {
  console.warn(LOG_PREFIX, ...args);
};

const logError = (...args: unknown[]) => {
  console.error(LOG_PREFIX, ...args);
};

// Mock initial investors
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(() => (USE_API ? loadAuthTokens() : null));
  const [data, setData] = useState<AppDataState>(() => ({
    users: [],
    transactions: [],
    investors: [],
  }));
  const [bootStatus, setBootStatus] = useState<{
    auth: boolean;
    users: boolean;
    investors: boolean;
    transactions: boolean;
  }>({
    auth: !USE_API,
    users: !USE_API,
    investors: !USE_API,
    transactions: !USE_API,
  });
  const [currentPage, setCurrentPageState] = useState<AppPage>(DEFAULT_PAGE);
  const isBootstrapping = Object.values(bootStatus).some(status => !status);

  const isAuthorized = useCallback(
    (page: AppPage, roleOverride?: UserRole | null) => {
      if (PUBLIC_PAGES.includes(page)) {
        return true;
      }
      const role = roleOverride ?? user?.role ?? null;
      if (!role) {
        return false;
      }
      const allowedRoles = PAGE_ACCESS[page];
      if (!allowedRoles) {
        return true;
      }
      return allowedRoles.includes(role);
    },
    [user?.role]
  );

  const setCurrentPage = useCallback(
    (nextPage: AppPage, options?: { role?: UserRole | null }) => {
      const roleOverride = options?.role ?? null;
      const roleToCheck = roleOverride ?? user?.role ?? null;
      if (isAuthorized(nextPage, roleToCheck)) {
        setCurrentPageState(nextPage);
        return;
      }
      const fallback = PUBLIC_PAGES.includes(nextPage) ? nextPage : roleToCheck ? 'dashboard' : 'login';
      setCurrentPageState(fallback);
    },
    [isAuthorized, user]
  );

  useEffect(() => {
    if (!user && currentPage !== 'login') {
      setCurrentPage('login');
      return;
    }
    if (user && !isAuthorized(currentPage, user.role)) {
      setCurrentPage('dashboard');
    }
  }, [user, currentPage, isAuthorized, setCurrentPage]);

  const setCurrentPageRef = useRef(setCurrentPage);
  useEffect(() => {
    setCurrentPageRef.current = setCurrentPage;
  }, [setCurrentPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSessionExpired = (event: Event) => {
      logWarn('Session expired; redirecting to login', event);
      clearAuthTokens();
      setTokens(null);
      setUser(null);
      setCurrentPageRef.current('login');
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (!USE_API) return;
    let cancelled = false;

    const hydrateUser = async () => {
      const stored = tokens ?? loadAuthTokens();
      logInfo('Bootstrapping start', { useApi: USE_API, hasStoredTokens: Boolean(tokens ?? loadAuthTokens()) });
      if (!stored) {
        logInfo('No stored tokens found; skipping /auth/me');
        setBootStatus(prev => ({ ...prev, auth: true }));
        return;
      }
      if (!tokens) {
        setTokens(stored);
      }
      setBootStatus(prev => ({ ...prev, auth: false }));
      try {
        logInfo('Fetching /api/v1/auth/me');
        const currentUser = await apiClient.get<User>('/api/v1/auth/me');
        if (cancelled) return;
        logInfo('Received /auth/me response', currentUser);
        setUser(currentUser);
        setCurrentPageRef.current('dashboard', { role: currentUser.role });
      } catch (error) {
        if (cancelled) return;
        logError('Failed to fetch /auth/me; clearing tokens', error);
        clearAuthTokens();
        setTokens(null);
        setUser(null);
      } finally {
        if (!cancelled) {
          setBootStatus(prev => ({ ...prev, auth: true }));
        }
      }
    };

    hydrateUser();

    return () => {
      cancelled = true;
    };
  }, [tokens]);

  useEffect(() => {
    if (!USE_API || !user) return;
    if (user.role !== 'admin') {
      setBootStatus(prev => ({ ...prev, investors: true }));
      return;
    }
    let cancelled = false;
    setBootStatus(prev => ({ ...prev, investors: false }));
    const loadInvestors = async () => {
      logInfo('Loading investors from API');
      try {
        const response = await apiClient.get<InvestorApiResponse[]>('/api/v1/investors');
        logInfo('Investors response received', response.length);
        if (cancelled) return;
        const normalized: Investor[] = response.map(mapInvestorResponse);
        setData(prev => ({ ...prev, investors: normalized }));
      } catch (error) {
        logWarn('Failed to load investors', error);
      } finally {
        if (!cancelled) {
          setBootStatus(prev => ({ ...prev, investors: true }));
        }
      }
    };
    loadInvestors();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!USE_API || !user) return;
    if (user.role !== 'admin') {
      setBootStatus(prev => ({ ...prev, users: true }));
      return;
    }
    let cancelled = false;
    setBootStatus(prev => ({ ...prev, users: false }));
    const loadUsers = async () => {
      logInfo('Loading users from API');
      try {
        const response = await apiClient.get<UserApiResponse[]>('/api/v1/users');
        logInfo('Users response received', response.length);
        if (cancelled) return;
        setData(prev => ({
          ...prev,
          users: response.map(u => ({ ...u })),
        }));
      } catch (error) {
        logWarn('Failed to load users', error);
      } finally {
        if (!cancelled) {
          setBootStatus(prev => ({ ...prev, users: true }));
        }
      }
    };
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!USE_API || !user) return;
    let cancelled = false;
    setBootStatus(prev => ({ ...prev, transactions: false }));
    const loadTransactions = async () => {
      logInfo('Loading transactions from API');
      try {
        const response = await apiClient.get<TransactionApiResponse[]>('/api/v1/transactions');
        if (cancelled) return;
        const normalized = response.map(mapTransactionResponse);
        setData(prev => ({ ...prev, transactions: normalized }));
      } catch (error) {
        logWarn('Failed to load transactions', error);
      } finally {
        if (!cancelled) {
          setBootStatus(prev => ({ ...prev, transactions: true }));
        }
      }
    };
    loadTransactions();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (USE_API) {
      try {
        logInfo('Attempting login via API', { email });
        const response = await apiClient.post<{ access_token: string; refresh_token: string; expires_in: number; user: User }>(
          '/api/v1/auth/login',
          { email, password }
        );
        logInfo('Login succeeded', { user: response.user });
        const nextTokens: AuthTokens = {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt: Date.now() + response.expires_in * 1000,
        };
        saveAuthTokens(nextTokens);
        setTokens(nextTokens);
        setUser(response.user);
        setCurrentPage('dashboard', { role: response.user.role });
        return true;
      } catch (err) {
        logError('Login failed', err);
        throw err;
      }
    }
    const foundUser = data.users.find(u => u.email === email && !u.disabled);
    if (!foundUser || password !== 'password') return false;

    setUser(foundUser);
    setCurrentPage('dashboard', { role: foundUser.role });
    return true;
  }, [data.users, setCurrentPage]);

  const logout = useCallback(async () => {
    if (USE_API) {
      logInfo('Logging out', { hasTokens: Boolean(tokens) });
      const refreshToken = tokens?.refreshToken;
      if (refreshToken) {
        try {
          await apiClient.post('/api/v1/auth/logout', { refresh_token: refreshToken });
          logInfo('Logout API call succeeded');
        } catch (err) {
          logWarn('Logout API call failed', err);
        }
      }
      clearAuthTokens();
      setTokens(null);
    }
    setUser(null);
    setCurrentPage('login');
  }, [tokens, setCurrentPage]);

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    if (USE_API) {
      logInfo('Creating user via API', { email: userData.email });
      try {
        const response = await apiClient.post<UserApiResponse>('/api/v1/users', {
          ...userData,
          password: 'password',
        });
        logInfo('User created', response);
        setData(prev => ({ ...prev, users: [...prev.users, response] }));
        return true;
      } catch (error) {
        logError('Failed to create user', error);
        return false;
      }
    }
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
    };
    setData(prev => ({ ...prev, users: [...prev.users, newUser] }));
    return true;
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
    if (USE_API) {
      logInfo('Updating user role via API', { userId, role });
      try {
        const response = await apiClient.patch<UserApiResponse>(`/api/v1/users/${userId}/role`, {
          role,
        });
        logInfo('User role updated', response);
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => (u.id === response.id ? { ...u, role: response.role, disabled: response.disabled } : u)),
        }));
        return true;
      } catch (error) {
        logError('Failed to update user role', error);
        return false;
      }
    }
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === userId ? { ...u, role } : u)),
    }));
    return true;
  }, []);

  const toggleUserStatus = useCallback(
    async (userId: string, disabled: boolean) => {
      if (USE_API) {
        const target = data.users.find(u => u.id === userId);
        const role = target?.role ?? 'staff';
        logInfo('Toggling user status via API', { userId, disabled, role });
        try {
          const response = await apiClient.patch<UserApiResponse>(`/api/v1/users/${userId}/role`, {
            role,
            disabled,
          });
          setData(prev => ({
            ...prev,
            users: prev.users.map(u =>
              u.id === response.id ? { ...u, role: response.role, disabled: response.disabled } : u
            ),
          }));
          return true;
        } catch (error) {
          logError('Failed to toggle user status', error);
          throw error;
        }
      }
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => (u.id === userId ? { ...u, disabled } : u)),
      }));
      return true;
    },
    [data.users]
  );

  const disableUser = useCallback(async (userId: string) => {
    try {
      await toggleUserStatus(userId, true);
      return true;
    } catch {
      return false;
    }
  }, [toggleUserStatus]);

  const getAvailableProducts = useCallback((): string[] => {
    const products = new Set<string>();
    data.transactions.forEach(t => {
      if (t.type === 'buy' && t.productName) {
        products.add(t.productName);
      }
    });
    return Array.from(products).sort();
  }, [data.transactions]);

  const addInvestor = useCallback(async (name: string) => {
    if (USE_API) {
      logInfo('Creating investor via API', { name });
      try {
        const response = await apiClient.post<InvestorApiResponse>('/api/v1/investors', { name });
        logInfo('Investor created', response);
        const mapped = mapInvestorResponse(response);
        setData(prev => ({ ...prev, investors: [...prev.investors, mapped] }));
        return true;
      } catch (error) {
        logError('Failed to add investor', error);
        return false;
      }
    }
    const newInvestor: Investor = {
      id: Date.now().toString(),
      name,
      totalInvested: 0,
      totalWithdrawn: 0,
      netInvestment: 0,
      lastActivityDate: new Date(),
      investments: [],
    };
    setData(prev => ({ ...prev, investors: [...prev.investors, newInvestor] }));
    return true;
  }, []);

  const applyLocalInvestorActivity = useCallback((investorId: string, payload: InvestorActivityPayload) => {
    setData(prev => ({
      ...prev,
      investors: prev.investors.map(inv => {
        if (inv.id !== investorId) return inv;
        const activity: InvestmentActivity = {
          id: Date.now().toString(),
          type: payload.type,
          amount: payload.amount,
          date: new Date(),
          notes: payload.notes,
        };
        if (payload.type === 'investment') {
          return {
            ...inv,
            totalInvested: inv.totalInvested + payload.amount,
            netInvestment: inv.netInvestment + payload.amount,
            lastActivityDate: activity.date,
            investments: [...inv.investments, activity],
          };
        }
        return {
          ...inv,
          totalWithdrawn: inv.totalWithdrawn + payload.amount,
          netInvestment: inv.netInvestment - payload.amount,
          lastActivityDate: activity.date,
          investments: [...inv.investments, activity],
        };
      }),
    }));
  }, []);

  const updateInvestorFromResponse = useCallback((response: InvestorApiResponse) => {
    const mapped = mapInvestorResponse(response);
    setData(prev => ({
      ...prev,
      investors: prev.investors.map(inv =>
        inv.id === mapped.id
          ? {
              ...mapped,
              investments: inv.investments,
            }
          : inv
      ),
    }));
  }, []);

  const addInvestment = useCallback(
    async (investorId: string, amount: number, notes?: string) => {
      const payload: InvestorActivityPayload = { type: 'investment', amount, notes };
      if (USE_API) {
        try {
          logInfo('Adding investment via API', { investorId, amount, notes });
          const response = await apiClient.post<InvestorApiResponse>(`/api/v1/investors/${investorId}/activities`, {
            ...payload,
          });
          logInfo('Investment recorded', response);
          updateInvestorFromResponse(response);
          return true;
        } catch (error) {
          logError('Failed to add investment', error);
          return false;
        }
      }
      applyLocalInvestorActivity(investorId, payload);
      return true;
    },
    [applyLocalInvestorActivity, updateInvestorFromResponse]
  );

  const addWithdrawal = useCallback(
    async (investorId: string, amount: number, notes?: string) => {
      const payload: InvestorActivityPayload = { type: 'withdrawal', amount, notes };
      if (USE_API) {
        try {
          logInfo('Adding withdrawal via API', { investorId, amount, notes });
          const response = await apiClient.post<InvestorApiResponse>(`/api/v1/investors/${investorId}/activities`, {
            ...payload,
          });
          logInfo('Withdrawal recorded', response);
          updateInvestorFromResponse(response);
          return true;
        } catch (error) {
          logError('Failed to add withdrawal', error);
          return false;
        }
      }
      applyLocalInvestorActivity(investorId, payload);
      return true;
    },
    [applyLocalInvestorActivity, updateInvestorFromResponse]
  );

  const { users, transactions, investors } = data;

  return (
    <AppContext.Provider
      value={{
        user,
        data,
        users,
        login,
        logout,
      addUser,
      updateUserRole,
      disableUser,
      toggleUserStatus,
      toggleUserStatus,
        transactions,
        getAvailableProducts,
        investors,
        addInvestor,
        addInvestment,
        addWithdrawal,
        currentPage,
        setCurrentPage,
        isAuthorized,
        isBootstrapping,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
