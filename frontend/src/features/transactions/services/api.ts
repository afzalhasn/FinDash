import { apiClient } from '../../../shared/lib/api';
import { serializeISTBoundary, istBoundaryDate } from '../../../shared/lib/timezone';
import type {
  CreateTransactionPayload,
  Transaction,
  TransactionApiResponse,
  TransactionCreateRequest,
  TransactionFilters,
  TransactionsResponse,
} from '../types';

export const PRODUCTS_API_PATH = '/api/v1/transactions/products/available';
export const DEFAULT_PAGE_SIZE = 25;

export type NormalizedFilters = Omit<TransactionFilters, 'page' | 'pageSize'> & {
  page: number;
  pageSize: number;
};

export const normalizeFilters = (filters: TransactionFilters): NormalizedFilters => ({
  ...filters,
  page: filters.page && filters.page > 0 ? filters.page : 1,
  pageSize: filters.pageSize && filters.pageSize > 0 ? filters.pageSize : DEFAULT_PAGE_SIZE,
});

type TextMatchFn = (value: string | undefined, term: string) => boolean;
type BoundaryResolver = (value: string, options?: { endOfDay?: boolean }) => Date | undefined;

const defaultTextMatcher: TextMatchFn = (value, term) => {
  if (!value || !term) return false;
  return value.toLowerCase().includes(term);
};

const defaultBoundaryResolver: BoundaryResolver = (value, options) => istBoundaryDate(value, options);

export const buildQueryString = (filters: NormalizedFilters) => {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters.product) params.set('product', filters.product);
  if (filters.person) params.set('person', filters.person);
  if (filters.startDate) {
    const serialized = serializeISTBoundary(filters.startDate);
    if (serialized) params.set('start', serialized);
  }
  if (filters.endDate) {
    const serialized = serializeISTBoundary(filters.endDate, { endOfDay: true });
    if (serialized) params.set('end', serialized);
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const mapTransactionResponse = (payload: TransactionApiResponse): Transaction => ({
  id: payload.id,
  type: payload.type,
  productName: payload.product_name ?? undefined,
  expenseCategory: payload.expense_category ?? undefined,
  expenseDescription: payload.expense_description ?? undefined,
  quantity: payload.quantity ?? undefined,
  quantityType: payload.quantity_type ?? undefined,
  pricePerUnit: payload.price_per_unit ?? undefined,
  totalAmount: Number(payload.total_amount),
  notes: payload.notes ?? undefined,
  date: new Date(payload.occurred_at),
  personName: payload.person_name,
});

const normalizeSearchTerm = (value?: string) => value?.trim().toLowerCase();

export const buildLocalTransactionsResponse = (
  transactions: Transaction[],
  filters: NormalizedFilters,
  textMatcher: TextMatchFn = defaultTextMatcher,
  boundaryResolver: BoundaryResolver = defaultBoundaryResolver,
): TransactionsResponse => {
  const normalizedFilters = {
    ...filters,
    product: normalizeSearchTerm(filters.product),
    person: normalizeSearchTerm(filters.person),
    search: normalizeSearchTerm(filters.search),
  };

  const startDate = normalizedFilters.startDate ? boundaryResolver(normalizedFilters.startDate) : undefined;
  const endDate = normalizedFilters.endDate ? boundaryResolver(normalizedFilters.endDate, { endOfDay: true }) : undefined;

  const filtered = transactions.filter((transaction) => {
    if (normalizedFilters.type && normalizedFilters.type !== 'all' && transaction.type !== normalizedFilters.type) {
      return false;
    }
    if (normalizedFilters.product && !textMatcher(transaction.productName, normalizedFilters.product)) {
      return false;
    }
    if (normalizedFilters.person && !textMatcher(transaction.personName, normalizedFilters.person)) {
      return false;
    }
    if (normalizedFilters.search) {
      const matchesSearch =
        textMatcher(transaction.productName, normalizedFilters.search) ||
        textMatcher(transaction.personName, normalizedFilters.search) ||
        textMatcher(transaction.notes, normalizedFilters.search) ||
        textMatcher(transaction.expenseCategory, normalizedFilters.search) ||
        textMatcher(transaction.expenseDescription, normalizedFilters.search);
      if (!matchesSearch) {
        return false;
      }
    }
    if (startDate && (!transaction.date || transaction.date < startDate)) {
      return false;
    }
    if (endDate && (!transaction.date || transaction.date > endDate)) {
      return false;
    }
    return true;
  });

  const offset = (normalizedFilters.page - 1) * normalizedFilters.pageSize;
  const paginatedItems = filtered.slice(offset, offset + normalizedFilters.pageSize);

  return {
    items: paginatedItems,
    total: filtered.length,
    page: normalizedFilters.page,
    pageSize: normalizedFilters.pageSize,
  };
};

export const fetchTransactionsFromApi = async (filters: NormalizedFilters): Promise<Transaction[]> => {
  const queryString = buildQueryString(filters);
  const response = await apiClient.get<TransactionApiResponse[]>(`/api/v1/transactions${queryString}`);
  return response.map(mapTransactionResponse);
};

export const fetchAllTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get<TransactionApiResponse[]>('/api/v1/transactions');
  return response.map(mapTransactionResponse);
};

export const fetchAvailableProducts = async (): Promise<string[]> => {
  return apiClient.get<string[]>(PRODUCTS_API_PATH);
};

export const buildTransactionRequestPayload = (payload: CreateTransactionPayload): TransactionCreateRequest => {
  const base: TransactionCreateRequest = {
    type: payload.type,
    total_amount: payload.totalAmount,
    occurred_at: payload.occurredAt,
    notes: payload.notes,
  };
  if (payload.type === 'expense') {
    return {
      ...base,
      expense_category: payload.expenseCategory,
      expense_description: payload.expenseDescription,
    };
  }
  return {
    ...base,
    product_name: payload.productName,
    quantity: payload.quantity,
    quantity_type: payload.quantityType,
    price_per_unit: payload.pricePerUnit,
  };
};

export const createTransactionRequest = async (payload: CreateTransactionPayload) => {
  const requestPayload = buildTransactionRequestPayload(payload);
  await apiClient.post('/api/v1/transactions', requestPayload);
};
