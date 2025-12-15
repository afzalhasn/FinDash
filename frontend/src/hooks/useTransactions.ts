"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, ApiError } from '../lib/api';
import { useApp, Transaction, QuantityType, ExpenseCategory } from '../app/context/AppContext';

const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';
const DEFAULT_PAGE_SIZE = 25;

export type TransactionTypeFilter = Transaction['type'] | 'all';

export interface TransactionFilters {
  type?: TransactionTypeFilter;
  product?: string;
  person?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

type BaseTransactionPayload = {
  type: Transaction['type'];
  totalAmount: number;
  notes?: string;
  occurredAt: string;
};

type TradeTransactionPayload = BaseTransactionPayload & {
  type: 'buy' | 'sell';
  productName: string;
  quantity: number;
  quantityType: QuantityType;
  pricePerUnit: number;
};

type ExpenseTransactionPayload = BaseTransactionPayload & {
  type: 'expense';
  expenseCategory: ExpenseCategory;
  expenseDescription: string;
};

export type CreateTransactionPayload = TradeTransactionPayload | ExpenseTransactionPayload;

type NormalizedFilters = Omit<TransactionFilters, 'page' | 'pageSize'> & {
  page: number;
  pageSize: number;
};

const normalizeFilters = (filters: TransactionFilters): NormalizedFilters => ({
  ...filters,
  page: filters.page && filters.page > 0 ? filters.page : 1,
  pageSize: filters.pageSize && filters.pageSize > 0 ? filters.pageSize : DEFAULT_PAGE_SIZE,
});

const buildQueryString = (filters: NormalizedFilters) => {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters.product) params.set('product', filters.product);
  if (filters.person) params.set('person', filters.person);
  if (filters.search) params.set('search', filters.search);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  params.set('page', filters.page.toString());
  params.set('pageSize', filters.pageSize.toString());
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const fetchTransactions = async (filters: NormalizedFilters): Promise<TransactionsResponse> => {
  const queryString = buildQueryString(filters);
  return apiClient.get<TransactionsResponse>(`/api/v1/transactions${queryString}`);
};

const matchesSearch = (value: string | undefined, searchTerm: string) => {
  if (!value) return false;
  return value.toLowerCase().includes(searchTerm);
};

const buildLocalResponse = (transactions: Transaction[], filters: NormalizedFilters): TransactionsResponse => {
  const searchTerm = filters.search?.trim().toLowerCase() ?? '';
  const productFilter = filters.product?.trim().toLowerCase() ?? '';
  const personFilter = filters.person?.trim().toLowerCase() ?? '';
  const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  const filtered = transactions.filter(transaction => {
    if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }
    if (productFilter) {
      const candidate = transaction.productName?.toLowerCase() ?? '';
      if (!candidate.includes(productFilter)) {
        return false;
      }
    }
    if (personFilter && !transaction.personName.toLowerCase().includes(personFilter)) {
      return false;
    }
    if (startDate && transaction.date < startDate) {
      return false;
    }
    if (endDate && transaction.date > endDate) {
      return false;
    }
    if (searchTerm) {
      const matches =
        matchesSearch(transaction.productName, searchTerm) ||
        matchesSearch(transaction.expenseDescription, searchTerm) ||
        matchesSearch(transaction.notes, searchTerm) ||
        transaction.personName.toLowerCase().includes(searchTerm);
      if (!matches) {
        return false;
      }
    }
    return true;
  });

  const total = filtered.length;
  const startIndex = (filters.page - 1) * filters.pageSize;
  const paginated = filtered.slice(startIndex, startIndex + filters.pageSize);

  return {
    items: paginated,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
  };
};

export const transactionsKeys = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters = {}) => ['transactions', USE_API ? 'api' : 'mock', normalizeFilters(filters)] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  const { transactions } = useApp();
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const normalizedFilters = useMemo(() => normalizeFilters(filters), [filtersKey]);
  const localSignature = useMemo(() => (!USE_API ? JSON.stringify(transactions) : ''), [transactions]);
  const [reloadToken, setReloadToken] = useState(0);

  const [state, setState] = useState<{
    data?: TransactionsResponse;
    error?: ApiError;
    isLoading: boolean;
  }>({ isLoading: true });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const data = USE_API
          ? await fetchTransactions(normalizedFilters)
          : buildLocalResponse(transactions, normalizedFilters);
        if (!cancelled) {
          setState({ data, isLoading: false });
        }
      } catch (err) {
        const error = err instanceof ApiError ? err : new ApiError(500, 'Failed to load transactions');
        if (!cancelled) {
          setState({ error, isLoading: false });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [localSignature, reloadToken, normalizedFilters]);

  const refetch = useCallback(() => {
    setReloadToken(token => token + 1);
  }, []);

  useEffect(() => {
    if (!USE_API) return;
    const listener = () => refetch();
    window.addEventListener('transactions:updated', listener);
    return () => {
      window.removeEventListener('transactions:updated', listener);
    };
  }, [refetch]);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isError: Boolean(state.error),
    refetch,
  };
}

export function useAvailableProducts() {
  const { getAvailableProducts } = useApp();
  const [products, setProducts] = useState<string[]>(() => (USE_API ? [] : getAvailableProducts()));
  const [isLoading, setIsLoading] = useState(USE_API);
  const [error, setError] = useState<ApiError | undefined>(undefined);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!USE_API) {
      setProducts(getAvailableProducts());
      setIsLoading(false);
    }
  }, [getAvailableProducts]);

  useEffect(() => {
    if (!USE_API) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<string[]>('/api/v1/products/available');
        if (!cancelled) {
          setProducts(response);
          setError(undefined);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err : new ApiError(500, 'Failed to load products'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  const refetch = useCallback(() => {
    setRefreshIndex(index => index + 1);
  }, []);

  return {
    data: products,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateTransaction() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (payload: CreateTransactionPayload) => {
    setIsPending(true);
    try {
      await apiClient.post('/api/v1/transactions', payload);
      window.dispatchEvent(new CustomEvent('transactions:updated'));
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutateAsync,
    isPending,
  };
}
