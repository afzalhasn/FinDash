import type { Transaction } from '../types';

export type InventoryEntry = {
  quantity: number;
  productName: string;
  quantityType: string | null;
};

export type InventoryMap = Map<string, InventoryEntry>;

export const normalizeInventoryKey = (name: string, qtyType?: string | null) =>
  `${(name || '').trim().toLowerCase()}__${(qtyType || '').trim().toLowerCase()}`;

export const buildInventoryMap = (transactions: Transaction[]): InventoryMap => {
  const map: InventoryMap = new Map();
  transactions.forEach(transaction => {
    if (!transaction.productName || !transaction.quantity) return;
    if (transaction.type === 'expense') return;
    const key = normalizeInventoryKey(transaction.productName, transaction.quantityType ?? null);
    const delta = transaction.type === 'buy' ? transaction.quantity : transaction.type === 'sell' ? -transaction.quantity : 0;
    if (!delta) return;
    const entry = map.get(key) ?? { quantity: 0, productName: transaction.productName, quantityType: transaction.quantityType ?? null };
    entry.quantity += delta;
    entry.productName = transaction.productName;
    entry.quantityType = transaction.quantityType ?? null;
    map.set(key, entry);
  });
  return map;
};

export const getInventoryQuantity = (inventory: InventoryMap, name: string, qtyType?: string | null) => {
  if (!name) return 0;
  const entry = inventory.get(normalizeInventoryKey(name, qtyType));
  return entry?.quantity ?? 0;
};

export const getSellableProducts = (inventory: InventoryMap) => {
  const names = new Set<string>();
  inventory.forEach(entry => {
    if (entry.quantity > 0) names.add(entry.productName);
  });
  return Array.from(names);
};
