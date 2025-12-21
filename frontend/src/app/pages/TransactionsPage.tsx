import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTransactions } from '../../features/transactions/hooks/useTransactions';
import type { TransactionTypeFilter } from '../../features/transactions/types';
import { ArrowLeft, Search, Filter, ShoppingCart, DollarSign, Receipt, Loader2, AlertCircle } from 'lucide-react';
import { formatIST } from '../../shared/lib/timezone';
import { PageLayout } from '../../shared/ui/layout/PageLayout';

export function TransactionsPage() {
  const { user, setCurrentPage } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, error, refetch } = useTransactions({
    search: searchQuery || undefined,
    type: typeFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    pageSize,
  });

  const transactions = data?.items ?? [];
  const totalTransactions = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));

  return (
    <PageLayout
      header={{
        title: 'Transactions History',
        subtitle: user?.role === 'partner' ? 'View all transactions' : 'Read-only access',
        backButton: {
          label: 'Back to Dashboard',
          onClick: () => setCurrentPage('dashboard'),
          icon: ArrowLeft,
        },
      }}
    >
        {/* Filters */}
        <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-foreground">Filters</h2>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[220px]">
              <label htmlFor="search" className="block text-muted-foreground mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  placeholder="Search by product or person..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-xs">
              <label htmlFor="typeFilter" className="block text-muted-foreground mb-2">
                Type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TransactionTypeFilter)}
                className="w-full px-4 py-2 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <option value="all">All Types</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col gap-2 flex-wrap justify-end">
              <label className="block text-muted-foreground">Date Range</label>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || typeFilter !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="mt-4 text-primary hover:text-primary/80"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading transactions...</span>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, totalTransactions)} of {totalTransactions} transactions
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label htmlFor="pageSize" className="text-muted-foreground">
              Rows per page
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-1 border border-input bg-input-background text-foreground rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              {[10, 20, 30, 40].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1 border border-input rounded disabled:opacity-50 hover:bg-muted/40"
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1 border border-input rounded disabled:opacity-50 hover:bg-muted/40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {isError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Unable to load transactions.</p>
              <p className="text-sm">{error?.message ?? 'Please try again.'}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 inline-flex items-center text-primary hover:text-primary/80"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
          {!isLoading && transactions.length === 0 ? (
            <div className="bg-card border border-border/70 rounded-xl shadow-sm p-12 text-center">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-card border border-border/70 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'buy' ? 'bg-destructive/10' : 
                        transaction.type === 'sell' ? 'bg-primary/10' : 
                        'bg-accent/10'
                      }`}>
                        {transaction.type === 'buy' ? (
                          <ShoppingCart className="w-5 h-5 text-destructive" />
                        ) : transaction.type === 'sell' ? (
                          <DollarSign className="w-5 h-5 text-primary" />
                        ) : (
                          <Receipt className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-foreground">
                          {transaction.type === 'expense' 
                            ? transaction.expenseDescription 
                            : transaction.productName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatIST(transaction.date, { includeTime: true })}
                        </p>
                      </div>
                    </div>

                    {transaction.type === 'expense' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-accent/10 text-accent">
                            Expense
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Category</p>
                          <p className="text-foreground capitalize">{transaction.expenseCategory}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Person</p>
                          <p className="text-foreground">{transaction.personName}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                            transaction.type === 'buy' 
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {transaction.type === 'buy' ? 'Buy' : 'Sell'}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="text-foreground">
                            {transaction.quantity ?? '-'} {transaction.quantityType ?? ''}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Price/Unit</p>
                          <p className="text-foreground">
                            {transaction.pricePerUnit !== null && transaction.pricePerUnit !== undefined
                              ? `₹${transaction.pricePerUnit.toLocaleString()}`
                              : '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-foreground">₹{transaction.totalAmount.toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Person</p>
                          <p className="text-foreground">{transaction.personName}</p>
                        </div>
                      </div>
                    )}

                    {transaction.notes && (
                      <div className="mt-3 p-3 bg-muted/40 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <span className="text-muted-foreground/80">Note:</span> {transaction.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 text-right">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className={`text-xl ${
                      transaction.type === 'sell' ? 'text-primary' : 
                      transaction.type === 'buy' ? 'text-destructive' :
                      'text-accent'
                    }`}>
                      ₹{transaction.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
    </PageLayout>
  );
}
