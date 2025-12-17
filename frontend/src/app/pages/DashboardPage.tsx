import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, TrendingUp, TrendingDown, DollarSign, LogOut, History, BarChart3, Users, UserPlus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { useInsightSummary, useProductInsights } from '../../hooks/useInsights';
import { useInvestorsFeature } from '../../features/investors/hooks/useInvestors';
import { formatIST } from '../../shared/lib/timezone';
import { DateRangeFilter, PresetOption } from '../../shared/ui/filters/DateRangeFilter';
import { PageLayout } from '../../shared/ui/layout/PageLayout';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DashboardPage() {
  const { user, logout, transactions, setCurrentPage } = useApp();
  const { investors } = useInvestorsFeature();
  const [preset, setPreset] = useState<PresetOption>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (preset) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : startOfWeek(now),
          end: customEndDate ? new Date(customEndDate) : endOfWeek(now)
        };
      default:
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
    }
  }, [preset, customStartDate, customEndDate]);

  const { data: summary, isLoading: summaryLoading, isError: summaryError, error: summaryErrorDetails, refetch: refetchSummary } = useInsightSummary({
    start: dateRange.start,
    end: dateRange.end,
  });

  const { data: productInsights = [], isLoading: productLoading, error: productError, refetch: refetchProducts } = useProductInsights({
    start: dateRange.start,
    end: dateRange.end,
  });

  const summaryValues = {
    purchases: summary?.purchases ?? 0,
    sales: summary?.sales ?? 0,
    expenses: summary?.expenses ?? 0,
    profit: summary?.profit ?? 0,
    totalCashIn: summary?.totalCashIn ?? investors.reduce((sum, inv) => sum + inv.netInvestment, 0),
  };

  // Prepare doughnut chart data (Purchase vs Sales vs Expenses)
  const doughnutData = useMemo(() => {
    return [
      { name: 'Purchases', value: summaryValues.purchases },
      { name: 'Sales', value: summaryValues.sales },
      { name: 'Expenses', value: summaryValues.expenses },
    ].filter(item => item.value > 0);
  }, [summary]);

  const purchaseByProductData = useMemo(() => {
    return productInsights
      .filter(p => p.totalBought > 0)
      .map(p => ({ name: p.productName, value: p.totalBought }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [productInsights]);

  const salesByProductData = useMemo(() => {
    return productInsights
      .filter(p => p.totalSold > 0)
      .map(p => ({ name: p.productName, value: p.totalSold }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [productInsights]);

  const insights = useMemo(() => {
    if (!productInsights.length) {
      return {
        mostProfitable: { product: 'N/A', profit: 0 },
        leastProfitable: { product: 'N/A', profit: 0 },
      };
    }
    const sorted = [...productInsights].sort((a, b) => b.netProfit - a.netProfit);
    const mostProfitable = sorted[0];
    const leastProfitable = sorted[sorted.length - 1];
    return {
      mostProfitable: { product: mostProfitable.productName, profit: mostProfitable.netProfit },
      leastProfitable: { product: leastProfitable.productName, profit: leastProfitable.netProfit },
    };
  }, [productInsights]);

  // Get recent 5 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const filterLabel = useMemo(() => {
    switch (preset) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return 'Custom Range';
    }
  }, [preset]);

  const headerActions = (
    <div className="flex items-center gap-3 flex-wrap">
      {user?.role === 'admin' && (
        <>
          <button
            onClick={() => setCurrentPage('new-account')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>New Account</span>
          </button>
          <button
            onClick={() => setCurrentPage('add-investor')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Investor</span>
          </button>
        </>
      )}

      <button
        onClick={() => setCurrentPage('insights')}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BarChart3 className="w-5 h-5" />
        <span>Insights</span>
      </button>

      <button
        onClick={() => setCurrentPage('history')}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <History className="w-5 h-5" />
        <span>Transactions</span>
      </button>

      {(user?.role === 'admin' || user?.role === 'partner') && (
        <button
          onClick={() => setCurrentPage('add-entry')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Entry</span>
        </button>
      )}

      <button
        onClick={logout}
        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <PageLayout
      header={{
        title: 'FinDash',
        subtitle: `Welcome, ${user?.name ?? 'Guest'} (${user?.role ?? 'unknown'})`,
        actions: headerActions,
      }}
    >
      <DateRangeFilter
        value={{ preset, startDate: customStartDate, endDate: customEndDate }}
        onChange={({ preset: nextPreset, startDate, endDate }) => {
          setPreset(nextPreset);
          setCustomStartDate(startDate ?? '');
          setCustomEndDate(endDate ?? '');
        }}
        className="mb-6"
      />
      {/* Summary Cards - 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Cash In */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100">Total Cash In</p>
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl">
              {summaryLoading ? 'Loading…' : `₹${summaryValues.totalCashIn.toLocaleString()}`}
            </p>
            <p className="text-sm text-purple-100 mt-1">Investor Capital</p>
          </div>

          {/* Total Purchases */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Total Purchases</p>
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-gray-900 text-2xl">
              {summaryLoading ? 'Loading…' : `₹${summaryValues.purchases.toLocaleString()}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">{filterLabel}</p>
          </div>

          {/* Total Sales */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Total Sales</p>
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-gray-900 text-2xl">
              {summaryLoading ? 'Loading…' : `₹${summaryValues.sales.toLocaleString()}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">{filterLabel}</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Total Expenses</p>
              <div className="p-2 bg-orange-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-900 text-2xl">
              {summaryLoading ? 'Loading…' : `₹${summaryValues.expenses.toLocaleString()}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">{filterLabel}</p>
          </div>

          {/* Profit/Loss */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Profit / Loss</p>
              <div className={`p-2 rounded-lg ${summaryValues.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <DollarSign className={`w-5 h-5 ${summaryValues.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <p className={`text-2xl ${summaryValues.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryLoading ? 'Loading…' : `₹${Math.abs(summaryValues.profit).toLocaleString()}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">{filterLabel}</p>
          </div>
        </div>

        {summaryError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-red-700 flex items-start gap-3">
            <DollarSign className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Unable to load summary.</p>
              <p className="text-sm">{summaryErrorDetails?.message ?? 'Please try again.'}</p>
              <button onClick={refetchSummary} className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Doughnut Chart - Purchase vs Sales vs Expenses */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-4">Overview</h2>
            {doughnutData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={doughnutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {doughnutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Pie Chart - Purchase by Product */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-4">Purchase by Product</h2>
            {productLoading ? (
              <div className="h-[250px] flex items-center justify-center text-gray-500">Loading...</div>
            ) : purchaseByProductData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={purchaseByProductData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {purchaseByProductData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No purchases yet
              </div>
            )}
          </div>

          {/* Pie Chart - Sales by Product */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-4">Sales by Product</h2>
            {productLoading ? (
              <div className="h-[250px] flex items-center justify-center text-gray-500">Loading...</div>
            ) : salesByProductData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={salesByProductData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {salesByProductData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No sales yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Recent Transactions</h2>
            <button
              onClick={() => setCurrentPage('history')}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
            >
              View More →
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'buy' ? 'bg-red-100' :
                      transaction.type === 'sell' ? 'bg-green-100' :
                      'bg-orange-100'
                    }`}>
                      {transaction.type === 'buy' ? (
                        <TrendingDown className={`w-5 h-5 text-red-600`} />
                      ) : transaction.type === 'sell' ? (
                        <TrendingUp className={`w-5 h-5 text-green-600`} />
                      ) : (
                        <DollarSign className={`w-5 h-5 text-orange-600`} />
                      )}
                    </div>
                    <div>
                      <p className="text-gray-900">
                        {transaction.type === 'expense' 
                          ? transaction.expenseDescription 
                          : transaction.productName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatIST(transaction.date, { includeTime: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs mb-1 ${
                      transaction.type === 'buy' ? 'bg-red-100 text-red-800' :
                      transaction.type === 'sell' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                    <p className={`${
                      transaction.type === 'sell' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      ₹{transaction.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Insights */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <h2 className="mb-4">Quick Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-indigo-100 mb-1">Most Profitable Product {filterLabel}</p>
                <p className="text-xl">
                  {insights.mostProfitable.product}
                </p>
                <p className="text-sm text-indigo-100 mt-1">
                  Profit: ₹{Number(insights.mostProfitable.profit || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-indigo-100 mb-1">Least Profitable Product {filterLabel}</p>
                <p className="text-xl">
                  {insights.leastProfitable.product}
                </p>
                <p className="text-sm text-indigo-100 mt-1">
                  {insights.leastProfitable.profit >= 0 ? 'Profit' : 'Loss'}: ₹
                  {Math.abs(Number(insights.leastProfitable.profit || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
    </PageLayout>
  );
}
