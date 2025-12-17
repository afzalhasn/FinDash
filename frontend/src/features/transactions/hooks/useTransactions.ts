"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../shared/lib/api';
import { istBoundaryDate } from '../../../shared/lib/timezone';
import { useApp } from '../../../app/context/AppContext';
import type {
  CreateTransactionPayload,
  Transaction,
  TransactionFilters,
  TransactionsResponse,
} from '../types';
import {
  NormalizedFilters,
  fetchAvailableProducts,
  fetchTransactionsFromApi,
  normalizeFilters,
  createTransactionRequest,
} from '../services/api';

const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';
export const transactionsKeys = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters = {}) => ['transactions', USE_API ? 'api' : 'mock', normalizeFilters(filters)] as const,
};

const matchesSearch = (value: string | undefined, searchTerm: string) => {
  if (!value) return false;
  return value.toLowerCase().includes(searchTerm);
};

const buildLocalResponse = (transactions: Transaction[], filters: NormalizedFilters): TransactionsResponse => {
  const searchTerm = filters.search?.trim().toLowerCase() ?? '';
  const productFilter = filters.product?.trim().toLowerCase() ?? '';
  const personFilter = filters.person?.trim().toLowerCase() ?? '';
  const startDate = filters.startDate ? istBoundaryDate(filters.startDate) : undefined;
  const endDate = filters.endDate ? istBoundaryDate(filters.endDate, { endOfDay: true }) : undefined;

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

export function useTransactions(filters: TransactionFilters = {}) {
  const { transactions } = useApp();
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const normalizedFilters = useMemo(() => normalizeFilters(filters), [filtersKey]);
  const localSignature = useMemo(() => JSON.stringify(transactions), [transactions]);
  const nonApiSignature = USE_API ? undefined : localSignature;
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
        const sourceTransactions = USE_API
          ? await fetchTransactionsFromApi(normalizedFilters)
          : transactions;
        const data = buildLocalResponse(sourceTransactions, normalizedFilters);
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
  }, [nonApiSignature, reloadToken, normalizedFilters, transactions]);

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
        const response = await fetchAvailableProducts();
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
      await createTransactionRequest(payload);
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
