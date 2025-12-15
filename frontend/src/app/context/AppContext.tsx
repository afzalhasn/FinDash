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
  addUser: (user: Omit<User, 'id'>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  disableUser: (userId: string) => void;
  getAvailableProducts: () => string[];
  addInvestor: (name: string) => void;
  addInvestment: (investorId: string, amount: number, notes?: string) => void;
  addWithdrawal: (investorId: string, amount: number, notes?: string) => void;
  currentPage: AppPage;
  setCurrentPage: (page: AppPage, options?: { role?: UserRole | null }) => void;
  isAuthorized: (page: AppPage, roleOverride?: UserRole | null) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  transactions: 'findash_v2_transactions',
  investors: 'findash_v2_investors',
  users: 'findash_v2_users',
};

const DEFAULT_PAGE: AppPage = 'login';
const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';

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
const initialInvestors: Investor[] = [
  {
    id: '1',
    name: 'Michael Chen',
    totalInvested: 50000,
    totalWithdrawn: 5000,
    netInvestment: 45000,
    lastActivityDate: new Date('2024-12-10'),
    investments: [
      { id: '1', type: 'investment', amount: 50000, date: new Date('2024-12-01'), notes: 'Initial investment' },
      { id: '2', type: 'withdrawal', amount: 5000, date: new Date('2024-12-10'), notes: 'Partial withdrawal' },
    ]
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    totalInvested: 30000,
    totalWithdrawn: 0,
    netInvestment: 30000,
    lastActivityDate: new Date('2024-12-05'),
    investments: [
      { id: '1', type: 'investment', amount: 30000, date: new Date('2024-12-05'), notes: 'First investment' },
    ]
  },
];

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
    investors: USE_API ? [] : initialInvestors,
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
    const savedInvestors = safeParse<Investor[]>(STORAGE_KEYS.investors, []);
    const savedUsers = safeParse<User[]>(STORAGE_KEYS.users, []);

    if (USE_API) {
      return;
    }
    setData({
      users: savedUsers.length ? savedUsers : initialUsers,
      transactions: savedTransactions.length ? savedTransactions.map((t: any) => ({ ...t, date: new Date(t.date) })) : initialTransactions,
      investors: savedInvestors.length
        ? savedInvestors.map((inv: any) => ({
            ...inv,
            lastActivityDate: new Date(inv.lastActivityDate),
            investments: inv.investments.map((i: any) => ({
              ...i,
              date: new Date(i.date)
            }))
          }))
        : initialInvestors,
    });
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (USE_API) return;
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data.transactions));
    localStorage.setItem(STORAGE_KEYS.investors, JSON.stringify(data.investors));
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

  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
    };
    setData(prev => ({ ...prev, users: [...prev.users, newUser] }));
  }, []);

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === userId ? { ...u, role } : u)),
    }));
  }, []);

  const disableUser = useCallback((userId: string) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === userId ? { ...u, disabled: true } : u)),
    }));
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

  const addInvestor = useCallback((name: string) => {
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
  }, []);

  const addInvestment = useCallback((investorId: string, amount: number, notes?: string) => {
    setData(prev => ({
      ...prev,
      investors: prev.investors.map(inv => {
        if (inv.id === investorId) {
          const newActivity: InvestmentActivity = {
            id: Date.now().toString(),
            type: 'investment',
            amount,
            date: new Date(),
            notes,
          };
          return {
            ...inv,
            totalInvested: inv.totalInvested + amount,
            netInvestment: inv.netInvestment + amount,
            lastActivityDate: new Date(),
            investments: [...inv.investments, newActivity],
          };
        }
        return inv;
      }),
    }));
  }, []);

  const addWithdrawal = useCallback((investorId: string, amount: number, notes?: string) => {
    setData(prev => ({
      ...prev,
      investors: prev.investors.map(inv => {
        if (inv.id === investorId) {
          const newActivity: InvestmentActivity = {
            id: Date.now().toString(),
            type: 'withdrawal',
            amount,
            date: new Date(),
            notes,
          };
          return {
            ...inv,
            totalWithdrawn: inv.totalWithdrawn + amount,
            netInvestment: inv.netInvestment - amount,
            lastActivityDate: new Date(),
            investments: [...inv.investments, newActivity],
          };
        }
        return inv;
      }),
    }));
  }, []);

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
