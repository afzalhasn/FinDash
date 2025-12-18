import { describe, it, expect } from 'vitest';
import type { Transaction } from '../../types';
import { normalizeFilters, buildLocalTransactionsResponse } from '../api';
import { istBoundaryDate } from '../../../../shared/lib/timezone';

const sampleTransactions: Transaction[] = [
  { id: '1', type: 'buy', productName: 'Tea', quantity: 5, quantityType: 'kg', totalAmount: 500, pricePerUnit: 100, personName: 'Alice', date: new Date('2024-01-10') },
  { id: '2', type: 'sell', productName: 'Tea', quantity: 3, quantityType: 'kg', totalAmount: 420, pricePerUnit: 140, personName: 'Bob', date: new Date('2024-01-12') },
  { id: '3', type: 'expense', expenseCategory: 'rent', totalAmount: 200, personName: 'Alice', date: new Date('2024-01-09') },
];

describe('transaction filter utilities', () => {
  it('normalizes filters with defaults', () => {
    const normalized = normalizeFilters({});
    expect(normalized.page).toBe(1);
    expect(normalized.pageSize).toBeGreaterThan(0);
  });

  it('filters transactions locally based on criteria', () => {
    const filters = normalizeFilters({ type: 'buy', product: 'Tea', startDate: '2024-01-01', endDate: '2024-01-31' });
    const response = buildLocalTransactionsResponse(sampleTransactions, filters, (value, term) => (value ?? '').toLowerCase().includes(term), (date, options) => istBoundaryDate(date, options));
    expect(response.total).toBe(1);
    expect(response.items[0].id).toBe('1');
  });
});
