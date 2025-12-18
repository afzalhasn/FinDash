import { describe, it, expect } from 'vitest';
import type { Transaction } from '../../types';
import { buildInventoryMap, getSellableProducts, getInventoryQuantity } from '../../services/inventory';

const sampleTransactions: Transaction[] = [
  { id: '1', type: 'buy', productName: 'Apples', quantity: 10, quantityType: 'kg', totalAmount: 100, pricePerUnit: 10, personName: 'A', date: new Date('2024-01-01') },
  { id: '2', type: 'sell', productName: 'Apples', quantity: 4, quantityType: 'kg', totalAmount: 80, pricePerUnit: 20, personName: 'B', date: new Date('2024-01-03') },
  { id: '3', type: 'buy', productName: 'Oranges', quantity: 5, quantityType: 'kg', totalAmount: 50, pricePerUnit: 10, personName: 'A', date: new Date('2024-01-02') },
  { id: '4', type: 'expense', expenseCategory: 'rent', totalAmount: 20, personName: 'A', date: new Date('2024-01-04') },
];

describe('inventory helpers', () => {
  it('aggregates transactions into inventory map', () => {
    const map = buildInventoryMap(sampleTransactions);
    expect(map.get('apples__kg')?.quantity).toBe(6);
    expect(map.get('oranges__kg')?.quantity).toBe(5);
    expect(getSellableProducts(map)).toEqual(['Apples', 'Oranges']);
    expect(getInventoryQuantity(map, 'Apples', 'kg')).toBe(6);
    expect(getInventoryQuantity(map, 'Oranges', 'kg')).toBe(5);
  });
});
