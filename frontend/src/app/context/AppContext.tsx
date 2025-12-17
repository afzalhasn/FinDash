"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { apiClient } from '../../shared/lib/api';
import { useAuth } from '../../features/auth/context';
import type { User, UserRole } from '../../features/auth/types';
import { AppPage, DEFAULT_PAGE, PUBLIC_PAGES } from '../../features/auth/routes';
import { MOCK_USERS } from '../../features/auth/mockData';
import type { Transaction, QuantityType, ExpenseCategory } from '../../features/transactions/types';
import { fetchAllTransactions } from '../../features/transactions/services/api';
import type { Investor, InvestmentActivity, InvestorActivityPayload } from '../../features/investors/types';
import { fetchInvestors, createInvestorRequest, createInvestorActivityRequest } from '../../features/investors/services/api';
import { fetchUsers, createUserRequest, updateUserRoleRequest, toggleUserStatusRequest } from '../../features/users/services/api';
export type { User, UserRole } from '../../features/auth/types';
export type { AppPage } from '../../features/auth/routes';
export type { Transaction, QuantityType, ExpenseCategory } from '../../features/transactions/types';

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

const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';

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
  const { user, login: authLogin, logout: authLogout, isBootstrapping: authBootstrapping, isAuthorized } = useAuth();
  const [data, setData] = useState<AppDataState>(() => ({
    users: USE_API ? [] : [...MOCK_USERS],
    transactions: [],
    investors: [],
  }));
  const [bootStatus, setBootStatus] = useState<{
    users: boolean;
    investors: boolean;
    transactions: boolean;
  }>({
    users: !USE_API,
    investors: !USE_API,
    transactions: !USE_API,
  });
  const [currentPage, setCurrentPageState] = useState<AppPage>(DEFAULT_PAGE);
  const isBootstrapping = authBootstrapping || Object.values(bootStatus).some(status => !status);

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
        const investors = await fetchInvestors();
        logInfo('Investors response received', investors.length);
        if (cancelled) return;
        setData(prev => ({ ...prev, investors }));
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
        const loadedUsers = await fetchUsers();
        logInfo('Users response received', loadedUsers.length);
        if (cancelled) return;
        setData(prev => ({
          ...prev,
          users: loadedUsers,
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
        const normalized = await fetchAllTransactions();
        if (cancelled) return;
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

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const authenticatedUser = await authLogin(email, password);
      if (!authenticatedUser) {
        return false;
      }
      setCurrentPage('dashboard', { role: authenticatedUser.role });
      return true;
    },
    [authLogin, setCurrentPage]
  );

  const logout = useCallback(async () => {
    await authLogout();
    setCurrentPage('login');
  }, [authLogout, setCurrentPage]);

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    if (USE_API) {
      logInfo('Creating user via API', { email: userData.email });
      try {
        const created = await createUserRequest({
          ...userData,
          password: 'password',
        });
        logInfo('User created', created);
        setData(prev => ({ ...prev, users: [...prev.users, created] }));
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
        const response = await updateUserRoleRequest(userId, role);
        logInfo('User role updated', response);
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => (u.id === response.id ? response : u)),
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
          const response = await toggleUserStatusRequest(userId, role, disabled);
          setData(prev => ({
            ...prev,
            users: prev.users.map(u => (u.id === response.id ? response : u)),
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
        const response = await createInvestorRequest(name);
        logInfo('Investor created', response);
        setData(prev => ({ ...prev, investors: [...prev.investors, response] }));
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

  const updateInvestorFromResponse = useCallback((investor: Investor) => {
    setData(prev => ({
      ...prev,
      investors: prev.investors.map(inv =>
        inv.id === investor.id
          ? {
            ...investor,
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
          const response = await createInvestorActivityRequest(investorId, payload);
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
          const response = await createInvestorActivityRequest(investorId, payload);
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
