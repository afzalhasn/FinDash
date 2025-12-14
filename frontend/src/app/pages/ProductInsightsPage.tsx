import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

interface ProductProfit {
  productName: string;
  totalBuy: number;
  totalSell: number;
  profit: number;
  profitMargin: number;
  quantityBought: number;
  quantitySold: number;
}

export function ProductInsightsPage() {
  const { transactions, setCurrentPage } = useApp();
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

  // Calculate product-wise profit
  const productProfits = useMemo(() => {
    const productMap = new Map<string, ProductProfit>();

    filteredTransactions.forEach(t => {
      if (!productMap.has(t.productName)) {
        productMap.set(t.productName, {
          productName: t.productName,
          totalBuy: 0,
          totalSell: 0,
          profit: 0,
          profitMargin: 0,
          quantityBought: 0,
          quantitySold: 0,
        });
      }

      const product = productMap.get(t.productName)!;
      if (t.type === 'buy') {
        product.totalBuy += t.totalAmount;
        product.quantityBought += t.quantity;
      } else {
        product.totalSell += t.totalAmount;
        product.quantitySold += t.quantity;
      }
    });

    // Calculate profit and margin
    const results: ProductProfit[] = [];
    productMap.forEach(product => {
      product.profit = product.totalSell - product.totalBuy;
      product.profitMargin = product.totalBuy > 0 
        ? (product.profit / product.totalBuy) * 100 
        : 0;
      results.push(product);
    });

    // Sort by profit (descending)
    return results.sort((a, b) => b.profit - a.profit);
  }, [filteredTransactions]);

  // Separate profitable and loss-making products
  const profitableProducts = productProfits.filter(p => p.profit > 0);
  const lossProducts = productProfits.filter(p => p.profit < 0);
  const breakEvenProducts = productProfits.filter(p => p.profit === 0);

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
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-gray-900">Product Insights</h1>
          <p className="text-gray-600">Analyze product-wise profitability</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p>Profitable Products</p>
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-3xl">{profitableProducts.length}</p>
            <p className="text-sm text-green-100 mt-1">{filterLabel}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p>Loss-Making Products</p>
              <TrendingDown className="w-6 h-6" />
            </div>
            <p className="text-3xl">{lossProducts.length}</p>
            <p className="text-sm text-red-100 mt-1">{filterLabel}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p>Break-Even Products</p>
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-3xl">{breakEvenProducts.length}</p>
            <p className="text-sm text-gray-100 mt-1">{filterLabel}</p>
          </div>
        </div>

        {/* Top Profitable Products */}
        {profitableProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-gray-900">Top Profitable Products</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 text-gray-700">Product</th>
                    <th className="text-right py-3 px-4 text-gray-700">Qty Bought</th>
                    <th className="text-right py-3 px-4 text-gray-700">Qty Sold</th>
                    <th className="text-right py-3 px-4 text-gray-700">Total Buy</th>
                    <th className="text-right py-3 px-4 text-gray-700">Total Sell</th>
                    <th className="text-right py-3 px-4 text-gray-700">Profit</th>
                    <th className="text-right py-3 px-4 text-gray-700">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {profitableProducts.map((product, index) => (
                    <tr key={product.productName} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{product.productName}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{product.quantityBought}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{product.quantitySold}</td>
                      <td className="py-3 px-4 text-right text-red-600">
                        ${product.totalBuy.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        ${product.totalSell.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        ${product.profit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                          {product.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loss-Making Products */}
        {lossProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingDown className="w-6 h-6 text-red-600" />
              <h2 className="text-gray-900">Loss-Making Products</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700">Product</th>
                    <th className="text-right py-3 px-4 text-gray-700">Qty Bought</th>
                    <th className="text-right py-3 px-4 text-gray-700">Qty Sold</th>
                    <th className="text-right py-3 px-4 text-gray-700">Total Buy</th>
                    <th className="text-right py-3 px-4 text-gray-700">Total Sell</th>
                    <th className="text-right py-3 px-4 text-gray-700">Loss</th>
                    <th className="text-right py-3 px-4 text-gray-700">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {lossProducts.map((product) => (
                    <tr key={product.productName} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{product.productName}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{product.quantityBought}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{product.quantitySold}</td>
                      <td className="py-3 px-4 text-right text-red-600">
                        ${product.totalBuy.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        ${product.totalSell.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">
                        ${Math.abs(product.profit).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                          {product.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No data state */}
        {productProfits.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">No product data available for the selected period</p>
          </div>
        )}
      </main>
    </div>
  );
}
