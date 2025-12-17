import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTransactions, TransactionTypeFilter } from '../../hooks/useTransactions';
import { ArrowLeft, Search, Filter, ShoppingCart, DollarSign, Receipt, Loader2, AlertCircle } from 'lucide-react';
import { formatIST } from '../../lib/timezone';

export function TransactionsPage() {
  const { user, setCurrentPage } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, isError, error, refetch } = useTransactions({
    search: searchQuery || undefined,
    type: typeFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const transactions = data?.items ?? [];
  const totalTransactions = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-gray-900">Transactions History</h1>
          <p className="text-gray-600">
            {user?.role === 'partner' ? 'View all transactions' : 'Read-only access'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Search by product or person..."
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="typeFilter" className="block text-gray-700 mb-2">
                Type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TransactionTypeFilter)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label htmlFor="startDate" className="block text-gray-700 mb-2">
                Date From
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="lg:col-start-4">
              <label htmlFor="endDate" className="block text-gray-700 mb-2">
                Date To
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
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
              }}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          ) : (
            <p className="text-gray-600">
              Showing {transactions.length} of {totalTransactions} transactions
            </p>
          )}
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Unable to load transactions.</p>
              <p className="text-sm">{error?.message ?? 'Please try again.'}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
          {!isLoading && transactions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'buy' ? 'bg-red-50' : 
                        transaction.type === 'sell' ? 'bg-green-50' : 
                        'bg-orange-50'
                      }`}>
                        {transaction.type === 'buy' ? (
                          <ShoppingCart className="w-5 h-5 text-red-600" />
                        ) : transaction.type === 'sell' ? (
                          <DollarSign className="w-5 h-5 text-green-600" />
                        ) : (
                          <Receipt className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-gray-900">
                          {transaction.type === 'expense' 
                            ? transaction.expenseDescription 
                            : transaction.productName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatIST(transaction.date, { includeTime: true })}
                        </p>
                      </div>
                    </div>

                    {transaction.type === 'expense' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                            Expense
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="text-gray-900 capitalize">{transaction.expenseCategory}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Person</p>
                          <p className="text-gray-900">{transaction.personName}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                            transaction.type === 'buy' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type === 'buy' ? 'Buy' : 'Sell'}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="text-gray-900">
                            {transaction.quantity ?? '-'} {transaction.quantityType ?? ''}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Price/Unit</p>
                          <p className="text-gray-900">
                            {transaction.pricePerUnit !== null && transaction.pricePerUnit !== undefined
                              ? `₹${transaction.pricePerUnit.toLocaleString()}`
                              : '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-gray-900">${transaction.totalAmount.toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Person</p>
                          <p className="text-gray-900">{transaction.personName}</p>
                        </div>
                      </div>
                    )}

                    {transaction.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="text-gray-500">Note:</span> {transaction.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 text-right">
                    <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                    <p className={`text-xl ${
                      transaction.type === 'sell' ? 'text-green-600' : 
                      transaction.type === 'buy' ? 'text-red-600' :
                      'text-orange-600'
                    }`}>
                      ${transaction.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
