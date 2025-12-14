import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'admin' | 'partner' | 'staff';
export type QuantityType = 'kg' | 'dozen' | 'pack' | 'unit' | 'custom';
export type ExpenseCategory = 'rent' | 'transport' | 'salary' | 'other';

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

interface AppContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  disableUser: (userId: string) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'personName'>) => void;
  getAvailableProducts: () => string[];
  investors: Investor[];
  addInvestor: (name: string) => void;
  addInvestment: (investorId: string, amount: number, notes?: string) => void;
  addWithdrawal: (investorId: string, amount: number, notes?: string) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [currentPage, setCurrentPage] = useState('login');

  // Load persisted data from localStorage
  useEffect(() => {
    const savedTransactions = localStorage.getItem('findash_v2_transactions');
    const savedInvestors = localStorage.getItem('findash_v2_investors');
    const savedUsers = localStorage.getItem('findash_v2_users');
    
    if (savedTransactions) {
      const parsed = JSON.parse(savedTransactions);
      setTransactions(parsed.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      })));
    }
    
    if (savedInvestors) {
      const parsed = JSON.parse(savedInvestors);
      setInvestors(parsed.map((inv: any) => ({
        ...inv,
        lastActivityDate: new Date(inv.lastActivityDate),
        investments: inv.investments.map((i: any) => ({
          ...i,
          date: new Date(i.date)
        }))
      })));
    }

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('findash_v2_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (investors.length > 0) {
      localStorage.setItem('findash_v2_investors', JSON.stringify(investors));
    }
  }, [investors]);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('findash_v2_users', JSON.stringify(users));
    }
  }, [users]);

  const login = (email: string, password: string): boolean => {
    // Mock authentication - password is "password" for all users
    const foundUser = users.find(u => u.email === email && !u.disabled);
    if (foundUser && password === 'password') {
      setUser(foundUser);
      setCurrentPage('dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, role } : u
    ));
  };

  const disableUser = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, disabled: true } : u
    ));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'personName'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      personName: user?.name || 'Unknown',
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const getAvailableProducts = (): string[] => {
    // Get unique products from buy transactions
    const products = new Set<string>();
    transactions.forEach(t => {
      if (t.type === 'buy' && t.productName) {
        products.add(t.productName);
      }
    });
    return Array.from(products).sort();
  };

  const addInvestor = (name: string) => {
    const newInvestor: Investor = {
      id: Date.now().toString(),
      name,
      totalInvested: 0,
      totalWithdrawn: 0,
      netInvestment: 0,
      lastActivityDate: new Date(),
      investments: [],
    };
    setInvestors(prev => [...prev, newInvestor]);
  };

  const addInvestment = (investorId: string, amount: number, notes?: string) => {
    setInvestors(prev => prev.map(inv => {
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
    }));
  };

  const addWithdrawal = (investorId: string, amount: number, notes?: string) => {
    setInvestors(prev => prev.map(inv => {
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
    }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        addUser,
        updateUserRole,
        disableUser,
        transactions,
        addTransaction,
        getAvailableProducts,
        investors,
        addInvestor,
        addInvestment,
        addWithdrawal,
        currentPage,
        setCurrentPage,
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
