"use client";

import { useCallback, useMemo } from 'react';
import { useApp } from '../../../app/context/AppContext';
import type { QuantityType } from '../types';
import { buildInventoryMap, getSellableProducts, getInventoryQuantity } from '../services/inventory';

export function useInventory() {
  const { transactions } = useApp();

  const productInventory = useMemo(() => buildInventoryMap(transactions), [transactions]);

  const lookupInventory = useCallback(
    (name: string, qtyType?: string | null) => {
      return getInventoryQuantity(productInventory, name, qtyType);
    },
    [productInventory]
  );

  const sellableProducts = useMemo(() => {
    return getSellableProducts(productInventory);
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
