"use client";

import { useCallback, useEffect, useState } from 'react';
import { isWithinInterval, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { apiClient, ApiError } from '../shared/lib/api';
import { useApp, Transaction, Investor } from '../app/context/AppContext';

const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';

export interface ProductInsight {
  productName: string;
  totalSold: number;
  totalBought: number;
  netProfit: number;
}
interface ProductInsightApiResponse {
  product_name: string;
  total_sold: number;
  total_bought: number;
  net_profit: number;
}

export interface TimeSeriesPoint {
  bucket: string;
  purchases: number;
  sales: number;
  expenses: number;
}

export interface DashboardSummary {
  purchases: number;
  sales: number;
  expenses: number;
  profit: number;
  totalCashIn: number;
}

type InsightSummaryResponse = {
  purchases: number;
  sales: number;
  expenses: number;
  profit: number;
  total_cash_in: number;
};

const computeSummary = (
  transactions: Transaction[],
  investors: Investor[],
  start: Date,
  end: Date
): DashboardSummary => {
  const filtered = transactions.filter(t => isWithinInterval(t.date, { start, end }));
  const purchases = filtered.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.totalAmount, 0);
  const sales = filtered.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.totalAmount, 0);
  const expenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.totalAmount, 0);
  const totalCashIn = investors.reduce((sum, inv) => sum + inv.netInvestment, 0);
  return {
    purchases,
    sales,
    expenses,
    profit: sales - purchases - expenses,
    totalCashIn,
  };
};

export function useInsightSummary(range: { start: Date; end: Date }) {
  const { transactions, investors } = useApp();
  const [state, setState] = useState<{
    data?: DashboardSummary;
    isLoading: boolean;
    error?: ApiError;
  }>({ isLoading: USE_API });

  const startISO = range.start.toISOString();
  const endISO = range.end.toISOString();

  useEffect(() => {
    if (!USE_API) {
      setState({ data: computeSummary(transactions, investors, range.start, range.end), isLoading: false });
      return;
    }
    let cancelled = false;
    const load = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const params = new URLSearchParams({ start: startISO, end: endISO });
        const response = await apiClient.get<InsightSummaryResponse>(
          `/api/v1/insights/summary?${params.toString()}`
        );
        if (!cancelled) {
          setState({
            data: {
              ...response,
              totalCashIn: response.total_cash_in,
            },
            isLoading: false,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: undefined,
            isLoading: false,
            error: err instanceof ApiError ? err : new ApiError(500, 'Failed to load summary'),
          });
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [endISO, investors, range.end, range.start, startISO, transactions]);

  const refetch = useCallback(() => {
    if (!USE_API) {
      setState({ data: computeSummary(transactions, investors, range.start, range.end), isLoading: false });
      return;
    }
    const params = new URLSearchParams({ start: startISO, end: endISO });
    apiClient
      .get<InsightSummaryResponse>(`/api/v1/insights/summary?${params.toString()}`)
      .then(response =>
        setState({
          data: {
            ...response,
            totalCashIn: response.total_cash_in,
          },
          isLoading: false,
        })
      )
      .catch(err =>
        setState({
          data: undefined,
          isLoading: false,
          error: err instanceof ApiError ? err : new ApiError(500, 'Failed to load summary'),
        })
      );
  }, [endISO, investors, range.end, range.start, startISO, transactions]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    isError: Boolean(state.error),
    refetch,
  };
}

const aggregateProducts = (transactions: Transaction[], start: Date, end: Date): ProductInsight[] => {
  const filtered = transactions.filter(t => isWithinInterval(t.date, { start, end }));
  const productMap = new Map<
    string,
    { totalBought: number; totalSold: number }
  >();

  filtered.forEach(t => {
    if (t.type === 'expense' || !t.productName) return;
    if (!productMap.has(t.productName)) {
      productMap.set(t.productName, { totalBought: 0, totalSold: 0 });
    }
    const entry = productMap.get(t.productName)!;
    if (t.type === 'buy') {
      entry.totalBought += t.totalAmount;
    } else if (t.type === 'sell') {
      entry.totalSold += t.totalAmount;
    }
  });

  return Array.from(productMap.entries()).map(([productName, { totalBought, totalSold }]) => ({
    productName,
    totalBought,
    totalSold,
    netProfit: totalSold - totalBought,
  }));
};

export function useProductInsights(range: { start: Date; end: Date }) {
  const { transactions } = useApp();
  const [state, setState] = useState<{
    data: ProductInsight[];
    isLoading: boolean;
    error?: ApiError;
  }>({ data: [], isLoading: USE_API });

  const startISO = range.start.toISOString();
  const endISO = range.end.toISOString();

  useEffect(() => {
    if (!USE_API) {
      setState({
        data: aggregateProducts(transactions, range.start, range.end),
        isLoading: false,
      });
      return;
    }

    let cancelled = false;
    const load = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const params = new URLSearchParams({ start: startISO, end: endISO });
        const response = await apiClient.get<ProductInsightApiResponse[]>(
          `/api/v1/insights/products?${params.toString()}`
        );
        if (!cancelled) {
          setState({
            data: response.map(row => ({
              productName: row.product_name,
              totalSold: row.total_sold,
              totalBought: row.total_bought,
              netProfit: row.net_profit,
            })),
            isLoading: false,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: [],
            isLoading: false,
            error: err instanceof ApiError ? err : new ApiError(500, 'Failed to load product insights'),
          });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [startISO, endISO, range.end, range.start, transactions]);

  const refetch = useCallback(() => {
    if (!USE_API) {
      setState({
        data: aggregateProducts(transactions, range.start, range.end),
        isLoading: false,
      });
      return;
    }
    const params = new URLSearchParams({ start: startISO, end: endISO });
    apiClient
      .get<ProductInsightApiResponse[]>(`/api/v1/insights/products?${params.toString()}`)
      .then(res =>
        setState({
          data: res.map(row => ({
            productName: row.product_name,
            totalSold: row.total_sold,
            totalBought: row.total_bought,
            netProfit: row.net_profit,
          })),
          isLoading: false,
        })
      )
      .catch(err =>
        setState({
          data: [],
          isLoading: false,
          error: err instanceof ApiError ? err : new ApiError(500, 'Failed to load product insights'),
        })
      );
  }, [endISO, range.end, range.start, startISO, transactions]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    isError: Boolean(state.error),
    refetch,
  };
}

const aggregateTimeseries = (
  transactions: Transaction[],
  start: Date,
  end: Date,
  interval: 'day' | 'week' | 'month'
): TimeSeriesPoint[] => {
  const filtered = transactions.filter(t => isWithinInterval(t.date, { start, end }));
  const bucketMap = new Map<
    string,
    { purchases: number; sales: number; expenses: number }
  >();

  const resolveBucket = (date: Date) => {
    switch (interval) {
      case 'week':
        return startOfWeek(date, { weekStartsOn: 1 }).toISOString();
      case 'month':
        return startOfMonth(date).toISOString();
      default:
        return startOfDay(date).toISOString();
    }
  };

  filtered.forEach(t => {
    const key = resolveBucket(t.date);
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { purchases: 0, sales: 0, expenses: 0 });
    }
    const bucket = bucketMap.get(key)!;
    if (t.type === 'buy') bucket.purchases += t.totalAmount;
    if (t.type === 'sell') bucket.sales += t.totalAmount;
    if (t.type === 'expense') bucket.expenses += t.totalAmount;
  });

  return Array.from(bucketMap.entries())
    .map(([bucket, data]) => ({ bucket, ...data }))
    .sort((a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime());
};

export function useTimeseries(range: { start: Date; end: Date }, interval: 'day' | 'week' | 'month') {
  const { transactions } = useApp();
  const [state, setState] = useState<{
    data: TimeSeriesPoint[];
    isLoading: boolean;
    error?: ApiError;
  }>({ data: [], isLoading: USE_API });

  const startISO = range.start.toISOString();
  const endISO = range.end.toISOString();

  useEffect(() => {
    if (!USE_API) {
      setState({
        data: aggregateTimeseries(transactions, range.start, range.end, interval),
        isLoading: false,
      });
      return;
    }

    let cancelled = false;
    const load = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const params = new URLSearchParams({
          start: startISO,
          end: endISO,
          interval,
        });
        const response = await apiClient.get<TimeSeriesPoint[]>(
          `/api/v1/insights/timeseries?${params.toString()}`
        );
        if (!cancelled) {
          setState({ data: response, isLoading: false });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: [],
            isLoading: false,
            error: err instanceof ApiError ? err : new ApiError(500, 'Failed to load timeseries'),
          });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [endISO, interval, range.end, range.start, startISO, transactions]);

  const refetch = useCallback(() => {
    if (!USE_API) {
      setState({
        data: aggregateTimeseries(transactions, range.start, range.end, interval),
        isLoading: false,
      });
      return;
    }
    const params = new URLSearchParams({ start: startISO, end: endISO, interval });
    apiClient
      .get<TimeSeriesPoint[]>(`/api/v1/insights/timeseries?${params.toString()}`)
      .then(res => setState({ data: res, isLoading: false }))
      .catch(err =>
        setState({
          data: [],
          isLoading: false,
          error: err instanceof ApiError ? err : new ApiError(500, 'Failed to load timeseries'),
        })
      );
  }, [endISO, interval, range.end, range.start, startISO, transactions]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    isError: Boolean(state.error),
    refetch,
  };
}
