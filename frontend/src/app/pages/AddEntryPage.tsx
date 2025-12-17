import React, { useState, useMemo, useCallback } from 'react';
import { useApp, QuantityType, ExpenseCategory } from '../context/AppContext';
import { ArrowLeft, ShoppingCart, DollarSign, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '../../lib/api';
import { useAvailableProducts, useCreateTransaction, CreateTransactionPayload } from '../../hooks/useTransactions';

type EntryType = 'buy' | 'sell' | 'expense';

export function AddEntryPage() {
  const { user, setCurrentPage, transactions } = useApp();
  const { data: availableProductsData = [], isLoading: productsLoading } = useAvailableProducts();
  const availableProducts = availableProductsData ?? [];
  const { mutateAsync: createTransaction, isPending: isSubmitting } = useCreateTransaction();
  const [entryType, setEntryType] = useState<EntryType>('buy');
  
  // Buy/Sell fields
  const [productName, setProductName] = useState('');
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [quantityType, setQuantityType] = useState<QuantityType>('unit');
  const [customQuantityType, setCustomQuantityType] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  
  // Expense fields
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('other');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  
  // Common fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].slice(0, 5));
  const [notes, setNotes] = useState('');
  const normalizedSelectedProduct = productName.trim();

  const totalAmount = entryType === 'expense' 
    ? Number(expenseAmount) || 0
    : (Number(quantity) || 0) * (Number(pricePerUnit) || 0);

  const normalizeInventoryKey = useCallback((name: string, qtyType?: string | null) => {
    return `${(name || '').trim().toLowerCase()}__${(qtyType || '').trim().toLowerCase()}`;
  }, []);

  const productInventory = useMemo(() => {
    const map = new Map<string, { quantity: number; productName: string; quantityType: string | null }>();
    transactions.forEach((t) => {
      if (!t.productName || !t.quantity) return;
      if (t.type === 'expense') return;
      const key = normalizeInventoryKey(t.productName, t.quantityType ?? null);
      const delta = t.type === 'buy' ? t.quantity : t.type === 'sell' ? -t.quantity : 0;
      if (!delta) return;
      const entry = map.get(key) ?? { quantity: 0, productName: t.productName, quantityType: t.quantityType ?? null };
      entry.quantity += delta;
      entry.productName = t.productName;
      entry.quantityType = t.quantityType ?? null;
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

  const sellProductOptions = sellableProducts.length > 0 ? sellableProducts : availableProducts;
  const resolvedSellQuantityType = quantityType === 'custom' ? quantityType : quantityType;
  const availableSellQuantity = useMemo(() => {
    if (entryType !== 'sell' || !normalizedSelectedProduct) return 0;
    return lookupInventory(normalizedSelectedProduct, resolvedSellQuantityType);
  }, [entryType, lookupInventory, normalizedSelectedProduct, resolvedSellQuantityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedProductName = productName.trim();

    if (entryType === 'sell') {
      if (productsLoading) {
        toast.info('Loading available products. Please wait a moment.');
        return;
      }
      if (
        !normalizedProductName ||
        !sellProductOptions.some(option => option.trim().toLowerCase() === normalizedProductName.toLowerCase())
      ) {
        toast.error('Cannot sell a product that hasn\'t been purchased yet!');
        return;
      }
    }

    if (entryType !== 'expense' && !normalizedProductName) {
      toast.error('Please select or enter a product name.');
      return;
    }

    const dateTime = new Date(`${date}T${time}`);
    const occurredAt = dateTime.toISOString();

    let payload: CreateTransactionPayload;

    if (entryType === 'expense') {
      payload = {
        type: 'expense',
        expenseCategory,
        expenseDescription,
        totalAmount: Number(expenseAmount),
        notes: notes || undefined,
        occurredAt,
      };
    } else {
      if (quantityType === 'custom' && !customQuantityType.trim()) {
        toast.error('Please specify a custom quantity type.');
        return;
      }
      const finalQuantityType = quantityType === 'custom' ? (customQuantityType as QuantityType) : quantityType;
      const numericQuantity = Number(quantity);
      if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
        toast.error('Please enter a valid quantity greater than zero.');
        return;
      }
      if (entryType === 'sell') {
        const availableQty = lookupInventory(productName, finalQuantityType);
        if (availableQty <= 0) {
          toast.error('No inventory available for the selected product and quantity type.');
          return;
        }
        if (numericQuantity > availableQty) {
          toast.error(`Only ${availableQty.toFixed(2)} units are available to sell.`);
          return;
        }
      }
      payload = {
        type: entryType,
        productName: normalizedProductName,
        quantity: numericQuantity,
        quantityType: finalQuantityType,
        pricePerUnit: Number(pricePerUnit),
        totalAmount,
        notes: notes || undefined,
        occurredAt,
      };
    }

    try {
      await createTransaction(payload);
      toast.success(entryType === 'expense' ? 'Expense added successfully!' : `${entryType === 'buy' ? 'Purchase' : 'Sale'} added successfully!`);
      setCurrentPage('dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save entry. Please try again.';
      toast.error(message);
    }
  };

  const handleCancel = () => {
    setCurrentPage('dashboard');
  };

  const handleProductSelection = (selectedProduct: string) => {
    if (selectedProduct === '__new__') {
      setIsNewProduct(true);
      setProductName('');
    } else {
      setIsNewProduct(false);
      setProductName(selectedProduct);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-gray-900">Add New Entry</h1>
          <p className="text-gray-600">Person: {user?.name}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          {/* Entry Type Toggle */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-3">Entry Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEntryType('buy')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  entryType === 'buy'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                Buy
              </button>
              <button
                type="button"
                onClick={() => setEntryType('sell')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  entryType === 'sell'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                Sell
              </button>
              <button
                type="button"
                onClick={() => setEntryType('expense')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  entryType === 'expense'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Receipt className="w-5 h-5" />
                Expense
              </button>
            </div>
          </div>

          {/* Buy/Sell Form */}
          {entryType !== 'expense' && (
            <>
              {/* Product Selection */}
              <div className="mb-6">
                <label htmlFor="productSelection" className="block text-gray-700 mb-2">
                  {entryType === 'sell' ? 'Select Product' : 'Product'}
                </label>
                
                {entryType === 'sell' ? (
                  productsLoading ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading products available for sale...</span>
                    </div>
                  ) : sellProductOptions.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800">No products available for sale. Please add purchases first.</p>
                    </div>
                  ) : (
                    <select
                      id="productSelection"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select a product</option>
                      {sellProductOptions.map((product) => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>
                  )
                ) : (
                  // Buy: Can select existing or create new
                  <>
                    {productsLoading && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 text-gray-600 mb-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading previously purchased products...</span>
                      </div>
                    )}
                    {!productsLoading && availableProducts.length > 0 && (
                      <select
                        id="productSelection"
                        value={isNewProduct ? '__new__' : productName}
                        onChange={(e) => handleProductSelection(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                        disabled={isSubmitting}
                      >
                        <option value="">Select existing product</option>
                        {availableProducts.map((product) => (
                          <option key={product} value={product}>{product}</option>
                        ))}
                        <option value="__new__">+ Add new product</option>
                      </select>
                    )}
                    
                    {(isNewProduct || availableProducts.length === 0) && (
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter new product name"
                        required
                      />
                    )}
                  </>
                )}
              </div>

              {/* Quantity and Quantity Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="quantity" className="block text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
                  {entryType === 'sell' && productName && (
                    <p className="text-sm text-gray-500 mt-2">
                      Available: {availableSellQuantity.toFixed(2)} {quantityType === 'custom' ? '' : quantityType}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="quantityType" className="block text-gray-700 mb-2">
                    Quantity Type
                  </label>
                  <select
                    id="quantityType"
                    value={quantityType}
                    onChange={(e) => setQuantityType(e.target.value as QuantityType)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="unit">Unit</option>
                    <option value="kg">Kg</option>
                    <option value="dozen">Dozen</option>
                    <option value="pack">Pack</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Custom Quantity Type */}
              {quantityType === 'custom' && (
                <div className="mb-6">
                  <label htmlFor="customQuantityType" className="block text-gray-700 mb-2">
                    Custom Quantity Type
                  </label>
                  <input
                    id="customQuantityType"
                    type="text"
                    value={customQuantityType}
                    onChange={(e) => setCustomQuantityType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Liter, Box, etc."
                    required
                  />
                </div>
              )}

              {/* Price Per Unit */}
              <div className="mb-6">
                <label htmlFor="pricePerUnit" className="block text-gray-700 mb-2">
                  Price per Unit
                </label>
                <input
                  id="pricePerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Total Amount (Auto-calculated) */}
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <p className="text-gray-700 mb-1">Total Amount</p>
                <p className="text-indigo-600 text-2xl">
                  ₹{isNaN(totalAmount) ? '0.00' : totalAmount.toFixed(2)}
                </p>
              </div>
            </>
          )}

          {/* Expense Form */}
          {entryType === 'expense' && (
            <>
              {/* Expense Category */}
              <div className="mb-6">
                <label htmlFor="expenseCategory" className="block text-gray-700 mb-2">
                  Expense Category
                </label>
                <select
                  id="expenseCategory"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="rent">Rent</option>
                  <option value="transport">Transport</option>
                  <option value="salary">Salary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Expense Description */}
              <div className="mb-6">
                <label htmlFor="expenseDescription" className="block text-gray-700 mb-2">
                  Description
                </label>
                <input
                  id="expenseDescription"
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter expense description"
                  required
                />
              </div>

              {/* Expense Amount */}
              <div className="mb-6">
                <label htmlFor="expenseAmount" className="block text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  id="expenseAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="date" className="block text-gray-700 mb-2">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-gray-700 mb-2">
                Time
              </label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting || (entryType === 'sell' && (productsLoading || sellProductOptions.length === 0))}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
