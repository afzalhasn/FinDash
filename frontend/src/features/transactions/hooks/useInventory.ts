"use client";

import { useCallback, useMemo } from 'react';
import { useApp } from '../../../app/context/AppContext';
import type { QuantityType } from '../types';

export function useInventory() {
  const { transactions } = useApp();

  const normalizeInventoryKey = useCallback((name: string, qtyType?: string | null) => {
    return `${(name || '').trim().toLowerCase()}__${(qtyType || '').trim().toLowerCase()}`;
  }, []);

  const productInventory = useMemo(() => {
    const map = new Map<string, { quantity: number; productName: string; quantityType: string | null }>();
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
  }, [normalizeInventoryKey, transactions]);

  const lookupInventory = useCallback(
    (name: string, qtyType?: string | null) => {
      if (!name) return 0;
      const entry = productInventory.get(normalizeInventoryKey(name, qtyType));
      return entry?.quantity ?? 0;
    },
    [normalizeInventoryKey, productInventory]
  );

  const sellableProducts = useMemo(() => {
    const names = new Set<string>();
    productInventory.forEach(entry => {
      if (entry.quantity > 0) {
        names.add(entry.productName);
      }
    });
    return Array.from(names);
  }, [productInventory]);

  const getAvailableQuantity = useCallback(
    (productName: string, quantityType: QuantityType | string | null) => {
      return lookupInventory(productName, quantityType);
    },
    [lookupInventory]
  );

  return {
    productInventory,
    sellableProducts,
    lookupInventory,
    getAvailableQuantity,
  };
}
