import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ShoppingCart, DollarSign, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '../../shared/lib/api';
import type { QuantityType, ExpenseCategory, CreateTransactionPayload } from '../../features/transactions/types';
import { useAvailableProducts, useCreateTransaction } from '../../features/transactions/hooks/useTransactions';
import { useInventory } from '../../features/transactions/hooks/useInventory';
import { PageLayout } from '../../shared/ui/layout/PageLayout';

type EntryType = 'buy' | 'sell' | 'expense';

export function AddEntryPage() {
  const { user, setCurrentPage } = useApp();
  const { data: availableProductsData = [], isLoading: productsLoading } = useAvailableProducts();
  const availableProducts = availableProductsData ?? [];
  const { mutateAsync: createTransaction, isPending: isSubmitting } = useCreateTransaction();
  const { sellableProducts, lookupInventory } = useInventory();
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

  const sellProductOptions = sellableProducts.length > 0 ? sellableProducts : availableProducts;
  const resolvedSellQuantityType = quantityType === 'custom' ? (customQuantityType || undefined) : quantityType;
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
    <PageLayout
      header={{
        title: 'Add New Entry',
        subtitle: `Person: ${user?.name ?? 'Unknown'}`,
        backButton: {
          label: 'Back to Dashboard',
          onClick: handleCancel,
          icon: ArrowLeft,
        },
      }}
      contentClassName="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
          {/* Entry Type Toggle */}
          <div className="mb-6">
            <label className="block text-muted-foreground mb-3">Entry Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEntryType('buy')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  entryType === 'buy'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-border/70 text-muted-foreground hover:border-border'
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
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/70 text-muted-foreground hover:border-border'
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
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border/70 text-muted-foreground hover:border-border'
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
                <label htmlFor="productSelection" className="block text-muted-foreground mb-2">
                  {entryType === 'sell' ? 'Select Product' : 'Product'}
                </label>
                
                {entryType === 'sell' ? (
                  productsLoading ? (
                    <div className="p-4 bg-muted/40 border border-border/70 rounded-lg flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading products available for sale...</span>
                    </div>
                  ) : sellProductOptions.length === 0 ? (
                    <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                      <p className="text-accent">No products available for sale. Please add purchases first.</p>
                    </div>
                  ) : (
                    <select
                      id="productSelection"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
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
                      <div className="p-3 bg-muted/40 border border-border/70 rounded-lg flex items-center gap-2 text-muted-foreground mb-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading previously purchased products...</span>
                      </div>
                    )}
                    {!productsLoading && availableProducts.length > 0 && (
                      <select
                        id="productSelection"
                        value={isNewProduct ? '__new__' : productName}
                        onChange={(e) => handleProductSelection(e.target.value)}
                        className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 mb-3"
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
                        className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
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
                  <label htmlFor="quantity" className="block text-muted-foreground mb-2">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    placeholder="0"
                    required
                  />
                  {entryType === 'sell' && productName && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Available: {availableSellQuantity.toFixed(2)} {quantityType === 'custom' ? '' : quantityType}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="quantityType" className="block text-muted-foreground mb-2">
                    Quantity Type
                  </label>
                  <select
                    id="quantityType"
                    value={quantityType}
                    onChange={(e) => setQuantityType(e.target.value as QuantityType)}
                    className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
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
                  <label htmlFor="customQuantityType" className="block text-muted-foreground mb-2">
                    Custom Quantity Type
                  </label>
                  <input
                    id="customQuantityType"
                    type="text"
                    value={customQuantityType}
                    onChange={(e) => setCustomQuantityType(e.target.value)}
                    className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    placeholder="e.g., Liter, Box, etc."
                    required
                  />
                </div>
              )}

              {/* Price Per Unit */}
              <div className="mb-6">
                <label htmlFor="pricePerUnit" className="block text-muted-foreground mb-2">
                  Price per Unit
                </label>
                <input
                  id="pricePerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Total Amount (Auto-calculated) */}
              <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/15">
                <p className="text-muted-foreground mb-1">Total Amount</p>
                <p className="text-primary text-2xl">
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
                <label htmlFor="expenseCategory" className="block text-muted-foreground mb-2">
                  Expense Category
                </label>
                <select
                  id="expenseCategory"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
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
                <label htmlFor="expenseDescription" className="block text-muted-foreground mb-2">
                  Description
                </label>
                <input
                  id="expenseDescription"
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  placeholder="Enter expense description"
                  required
                />
              </div>

              {/* Expense Amount */}
              <div className="mb-6">
                <label htmlFor="expenseAmount" className="block text-muted-foreground mb-2">
                  Amount
                </label>
                <input
                  id="expenseAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  placeholder="0.00"
                  required
                />
              </div>
            </>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="date" className="block text-muted-foreground mb-2">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                required
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-muted-foreground mb-2">
                Time
              </label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-muted-foreground mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting || (entryType === 'sell' && (productsLoading || sellProductOptions.length === 0))}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          </div>
      </form>
    </PageLayout>
  );
}
