"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  updateUserRole: (userId: string, role: UserRole) => Promise<boolean>;
  disableUser: (userId: string) => Promise<boolean>;
  getAvailableProducts: () => string[];
  addInvestor: (name: string) => Promise<boolean>;
  addInvestment: (investorId: string, amount: number, notes?: string) => Promise<boolean>;
  addWithdrawal: (investorId: string, amount: number, notes?: string) => Promise<boolean>;
  currentPage: AppPage;
  setCurrentPage: (page: AppPage, options?: { role?: UserRole | null }) => void;
  isAuthorized: (page: AppPage, roleOverride?: UserRole | null) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  transactions: 'findash_v2_transactions',
  users: 'findash_v2_users',
};

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

const PAGE_ACCESS: Partial<Record<AppPage, UserRole[]>> = {
  'add-entry': ['admin', 'partner'],
  'add-investor': ['admin'],
  'new-account': ['admin'],
};

const PUBLIC_PAGES: AppPage[] = ['login'];

// Mock users with 3 roles
const initialUsers: User[] = [
  { id: '1', email: 'admin@findash.com', name: 'Admin User', role: 'admin' },
  { id: '2', email: 'partner@findash.com', name: 'John Partner', role: 'partner' },
  { id: '3', email: 'staff@findash.com', name: 'Jane Staff', role: 'staff' },
];

// Mock initial transactions with expenses
const initialTransactions: Transaction[] = [
  {
    id: '1',
    type: 'buy',
    productName: 'Laptop',
    quantity: 5,
    quantityType: 'unit',
    pricePerUnit: 800,
    totalAmount: 4000,
    personName: 'John Partner',
    date: new Date('2024-12-09'),
    notes: 'Bulk purchase'
  },
  {
    id: '2',
    type: 'sell',
    productName: 'Laptop',
    quantity: 3,
    quantityType: 'unit',
    pricePerUnit: 1200,
    totalAmount: 3600,
    personName: 'Jane Staff',
    date: new Date('2024-12-10'),
  },
  {
    id: '3',
    type: 'expense',
    expenseCategory: 'rent',
    expenseDescription: 'Office rent for December',
    totalAmount: 1500,
    personName: 'Admin User',
    date: new Date('2024-12-01'),
  },
  {
    id: '4',
    type: 'buy',
    productName: 'Mouse',
    quantity: 20,
    quantityType: 'unit',
    pricePerUnit: 15,
    totalAmount: 300,
    personName: 'John Partner',
    date: new Date('2024-12-11'),
  },
  {
    id: '5',
    type: 'sell',
    productName: 'Mouse',
    quantity: 15,
    quantityType: 'unit',
    pricePerUnit: 25,
    totalAmount: 375,
    personName: 'Jane Staff',
    date: new Date('2024-12-12'),
  },
  {
    id: '6',
    type: 'expense',
    expenseCategory: 'transport',
    expenseDescription: 'Delivery charges',
    totalAmount: 200,
    personName: 'John Partner',
    date: new Date('2024-12-12'),
  },
  {
    id: '7',
    type: 'buy',
    productName: 'Keyboard',
    quantity: 10,
    quantityType: 'unit',
    pricePerUnit: 50,
    totalAmount: 500,
    personName: 'John Partner',
    date: new Date('2024-12-12'),
  },
  {
    id: '8',
    type: 'sell',
    productName: 'Keyboard',
    quantity: 8,
    quantityType: 'unit',
    pricePerUnit: 80,
    totalAmount: 640,
    personName: 'Jane Staff',
    date: new Date('2024-12-13'),
  },
  {
    id: '9',
    type: 'sell',
    productName: 'Laptop',
    quantity: 2,
    quantityType: 'unit',
    pricePerUnit: 1200,
    totalAmount: 2400,
    personName: 'John Partner',
    date: new Date('2024-12-13'),
  },
  {
    id: '10',
    type: 'expense',
    expenseCategory: 'salary',
    expenseDescription: 'Staff salary',
    totalAmount: 2000,
    personName: 'Admin User',
    date: new Date('2024-12-13'),
  },
];

// Mock initial investors
const safeParse = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}"`, error);
    return fallback;
  }
};


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(() => (USE_API ? loadAuthTokens() : null));
  const [data, setData] = useState<AppDataState>(() => ({
    users: USE_API ? [] : initialUsers,
    transactions: USE_API ? [] : initialTransactions,
    investors: [],
  }));
  const [currentPage, setCurrentPageState] = useState<AppPage>(DEFAULT_PAGE);

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

  // Load persisted data from localStorage
  useEffect(() => {
    const savedTransactions = safeParse<Transaction[]>(STORAGE_KEYS.transactions, []);
    const savedUsers = safeParse<User[]>(STORAGE_KEYS.users, []);

    if (USE_API) {
      return;
    }
    setData({
      users: savedUsers.length ? savedUsers : initialUsers,
      transactions: savedTransactions.length ? savedTransactions.map((t: any) => ({ ...t, date: new Date(t.date) })) : initialTransactions,
      investors: [],
    });
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (USE_API) return;
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data.transactions));
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(data.users));
  }, [data]);

  useEffect(() => {
    if (!user && currentPage !== 'login') {
      setCurrentPage('login');
      return;
    }
    if (user && !isAuthorized(currentPage, user.role)) {
      setCurrentPage('dashboard');
    }
  }, [user, currentPage, isAuthorized, setCurrentPage]);

  useEffect(() => {
    if (!USE_API || tokens || !loadAuthTokens()) return;
    const stored = loadAuthTokens();
    if (!stored) return;
    setTokens(stored);
    apiClient
      .get<User>('/api/v1/auth/me')
      .then(setUser)
      .catch(() => {
        clearAuthTokens();
        setTokens(null);
        setUser(null);
      });
  }, [tokens]);

  useEffect(() => {
    if (!USE_API || !user) return;
    let cancelled = false;
    const loadInvestors = async () => {
      try {
        const response = await apiClient.get<InvestorApiResponse[]>('/api/v1/investors');
        if (cancelled) return;
        const normalized: Investor[] = response.map(mapInvestorResponse);
        setData(prev => ({ ...prev, investors: normalized }));
      } catch (error) {
        console.warn('Failed to load investors', error);
      }
    };
    loadInvestors();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!USE_API || !user) return;
    let cancelled = false;
    const loadUsers = async () => {
      try {
        const response = await apiClient.get<UserApiResponse[]>('/api/v1/users');
        if (cancelled) return;
        setData(prev => ({
          ...prev,
          users: response.map(u => ({ ...u })),
        }));
      } catch (error) {
        console.warn('Failed to load users', error);
      }
    };
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (USE_API) {
      try {
        const response = await apiClient.post<{ accessToken: string; refreshToken: string; expiresIn: number; user: User }>(
          '/api/v1/auth/login',
          { email, password }
        );
        const nextTokens: AuthTokens = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: Date.now() + response.expiresIn * 1000,
        };
        saveAuthTokens(nextTokens);
        setTokens(nextTokens);
        setUser(response.user);
        setCurrentPage('dashboard', { role: response.user.role });
        return true;
      } catch (err) {
        console.error('Login failed', err);
        return false;
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
      try {
        await apiClient.post('/api/v1/auth/logout', { refreshToken: tokens?.refreshToken });
      } catch (err) {
        console.warn('Logout API call failed', err);
      }
      clearAuthTokens();
      setTokens(null);
    }
    setUser(null);
    setCurrentPage('login');
  }, [tokens, setCurrentPage]);

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    if (USE_API) {
      try {
        const response = await apiClient.post<UserApiResponse>('/api/v1/users', {
          ...userData,
          password: 'password',
        });
        setData(prev => ({ ...prev, users: [...prev.users, response] }));
        return true;
      } catch (error) {
        console.error('Failed to create user', error);
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
      try {
        const response = await apiClient.patch<UserApiResponse>(`/api/v1/users/${userId}/role`, {
          role,
        });
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => (u.id === response.id ? { ...u, role: response.role, disabled: response.disabled } : u)),
        }));
        return true;
      } catch (error) {
        console.error('Failed to update user role', error);
        return false;
      }
    }
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === userId ? { ...u, role } : u)),
    }));
    return true;
  }, []);

  const disableUser = useCallback(async (userId: string) => {
    if (USE_API) {
      try {
        const response = await apiClient.patch<UserApiResponse>(`/api/v1/users/${userId}/role`, {
          disabled: true,
        });
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => (u.id === response.id ? { ...u, role: response.role, disabled: response.disabled } : u)),
        }));
        return true;
      } catch (error) {
        console.error('Failed to disable user', error);
        return false;
      }
    }
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === userId ? { ...u, disabled: true } : u)),
    }));
    return true;
  }, []);

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
      try {
        const response = await apiClient.post<InvestorApiResponse>('/api/v1/investors', { name });
        const mapped = mapInvestorResponse(response);
        setData(prev => ({ ...prev, investors: [...prev.investors, mapped] }));
        return true;
      } catch (error) {
        console.error('Failed to add investor', error);
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
              investments: [
                ...inv.investments,
                {
                  id: Date.now().toString(),
                  type: mapped.netInvestment > inv.netInvestment ? 'investment' : 'withdrawal',
                  amount: Math.abs(mapped.netInvestment - inv.netInvestment),
                  date: mapped.lastActivityDate,
                },
              ],
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
          const response = await apiClient.post<InvestorApiResponse>(`/api/v1/investors/${investorId}/activities`, {
            ...payload,
          });
          updateInvestorFromResponse(response);
          return true;
        } catch (error) {
          console.error('Failed to add investment', error);
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
          const response = await apiClient.post<InvestorApiResponse>(`/api/v1/investors/${investorId}/activities`, {
            ...payload,
          });
          updateInvestorFromResponse(response);
          return true;
        } catch (error) {
          console.error('Failed to add withdrawal', error);
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
        transactions,
        getAvailableProducts,
        investors,
        addInvestor,
        addInvestment,
        addWithdrawal,
        currentPage,
        setCurrentPage,
        isAuthorized,
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
