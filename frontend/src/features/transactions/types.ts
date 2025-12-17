export type QuantityType = 'kg' | 'dozen' | 'pack' | 'unit' | 'custom';
export type ExpenseCategory = 'rent' | 'transport' | 'salary' | 'other';

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'expense';
  productName?: string;
  expenseCategory?: ExpenseCategory;
  expenseDescription?: string;
  quantity?: number;
  quantityType?: QuantityType;
  pricePerUnit?: number;
  totalAmount: number;
  personName: string;
  date: Date;
  notes?: string;
}

export interface TransactionApiResponse {
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

export type BaseTransactionPayload = {
  type: Transaction['type'];
  totalAmount: number;
  notes?: string;
  occurredAt: string;
};

export type TradeTransactionPayload = BaseTransactionPayload & {
  type: 'buy' | 'sell';
  productName: string;
  quantity: number;
  quantityType: QuantityType;
  pricePerUnit: number;
};

export type ExpenseTransactionPayload = BaseTransactionPayload & {
  type: 'expense';
  expenseCategory: ExpenseCategory;
  expenseDescription: string;
};

export type CreateTransactionPayload = TradeTransactionPayload | ExpenseTransactionPayload;

export type TransactionCreateRequest = {
  type: Transaction['type'];
  total_amount: number;
  notes?: string;
  occurred_at: string;
  product_name?: string;
  quantity?: number;
  quantity_type?: QuantityType;
  price_per_unit?: number;
  expense_category?: ExpenseCategory;
  expense_description?: string;
};

export interface InventoryEntry {
  quantity: number;
  productName: string;
  quantityType: string | null;
}
