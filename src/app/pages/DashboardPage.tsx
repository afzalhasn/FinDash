import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, LogOut, History, BarChart3, Users, UserPlus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format, startOfDay, endOfDay } from 'date-fns';

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DashboardPage() {
  const { user, logout, transactions, investors, setCurrentPage } = useApp();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (timeFilter) {
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
  }, [timeFilter, customStartDate, customEndDate]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      isWithinInterval(t.date, { start: dateRange.start, end: dateRange.end })
    );
  }, [transactions, dateRange]);

  // Calculate summary metrics
  const summary = useMemo(() => {
    const purchases = filteredTransactions
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const sales = filteredTransactions
      .filter(t => t.type === 'sell')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Calculate total cash in from investors (all time)
    const totalCashIn = investors.reduce((sum, inv) => sum + inv.netInvestment, 0);

    const profit = sales - purchases - expenses;

    return { purchases, sales, expenses, totalCashIn, profit };
  }, [filteredTransactions, investors]);

  // Prepare doughnut chart data (Purchase vs Sales vs Expenses)
  const doughnutData = useMemo(() => {
    return [
      { name: 'Purchases', value: summary.purchases },
      { name: 'Sales', value: summary.sales },
      { name: 'Expenses', value: summary.expenses },
    ].filter(item => item.value > 0);
  }, [summary]);

  // Prepare pie chart data for purchases by product
  const purchaseByProductData = useMemo(() => {
    const productMap = new Map<string, number>();
    filteredTransactions
      .filter(t => t.type === 'buy' && t.productName)
      .forEach(t => {
        const current = productMap.get(t.productName!) || 0;
        productMap.set(t.productName!, current + t.totalAmount);
      });
    
    return Array.from(productMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredTransactions]);

  // Prepare pie chart data for sales by product
  const salesByProductData = useMemo(() => {
    const productMap = new Map<string, number>();
    filteredTransactions
      .filter(t => t.type === 'sell' && t.productName)
      .forEach(t => {
        const current = productMap.get(t.productName!) || 0;
        productMap.set(t.productName!, current + t.totalAmount);
      });
    
    return Array.from(productMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredTransactions]);

  // Calculate insights - most/least profitable products
  const insights = useMemo(() => {
    const productProfits = new Map<string, { profit: number; sales: number; purchases: number }>();
    
    filteredTransactions.forEach(t => {
      if ((t.type === 'buy' || t.type === 'sell') && t.productName) {
        if (!productProfits.has(t.productName)) {
          productProfits.set(t.productName, { profit: 0, sales: 0, purchases: 0 });
        }
        const data = productProfits.get(t.productName)!;
        if (t.type === 'buy') {
          data.purchases += t.totalAmount;
          data.profit -= t.totalAmount;
        } else {
          data.sales += t.totalAmount;
          data.profit += t.totalAmount;
        }
      }
    });

    const profitArray = Array.from(productProfits.entries()).map(([name, data]) => ({
      product: name,
      profit: data.profit
    }));

    profitArray.sort((a, b) => b.profit - a.profit);

    const mostProfitable = profitArray[0] || { product: 'N/A', profit: 0 };
    const leastProfitable = profitArray[profitArray.length - 1] || { product: 'N/A', profit: 0 };

    return { mostProfitable, leastProfitable };
  }, [filteredTransactions]);

  // Get recent 5 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const filterLabel = useMemo(() => {
    switch (timeFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return 'Custom Range';
    }
  }, [timeFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-indigo-600">FinDash</h1>
              <p className="text-gray-600">Welcome, {user?.name} ({user?.role})</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Admin-only buttons */}
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

              {/* Admin & Partner can add entries */}
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeFilter === 'today'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeFilter === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeFilter === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeFilter('custom')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeFilter === 'custom'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>

            {timeFilter === 'custom' && (
              <div className="flex gap-2 items-center ml-auto">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

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
            <p className="text-2xl">${summary.totalCashIn.toLocaleString()}</p>
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
            <p className="text-gray-900 text-2xl">${summary.purchases.toLocaleString()}</p>
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
            <p className="text-gray-900 text-2xl">${summary.sales.toLocaleString()}</p>
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
            <p className="text-gray-900 text-2xl">${summary.expenses.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">{filterLabel}</p>
          </div>

          {/* Profit/Loss */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Profit / Loss</p>
              <div className={`p-2 rounded-lg ${summary.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <DollarSign className={`w-5 h-5 ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <p className={`text-2xl ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(summary.profit).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">{filterLabel}</p>
          </div>
        </div>

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
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
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
            {purchaseByProductData.length > 0 ? (
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
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
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
            {salesByProductData.length > 0 ? (
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
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
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
                        {format(transaction.date, 'MMM d, yyyy • h:mm a')}
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
                      ${transaction.totalAmount.toLocaleString()}
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
                Profit: ${insights.mostProfitable.profit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-indigo-100 mb-1">Least Profitable Product</p>
              <p className="text-xl">
                {insights.leastProfitable.product}
              </p>
              <p className="text-sm text-indigo-100 mt-1">
                {insights.leastProfitable.profit >= 0 ? 'Profit' : 'Loss'}: ${Math.abs(insights.leastProfitable.profit).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
