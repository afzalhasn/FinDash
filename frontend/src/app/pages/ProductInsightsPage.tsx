"use client";

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useProductInsights, useTimeseries } from '../../hooks/useInsights';

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

interface DisplayProduct {
  productName: string;
  totalBuy: number;
  totalSell: number;
  profit: number;
  profitMargin: number;
}

export function ProductInsightsPage() {
  const { setCurrentPage } = useApp();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : startOfWeek(now, { weekStartsOn: 1 }),
          end: customEndDate ? new Date(customEndDate) : endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'week':
      default:
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    }
  }, [customEndDate, customStartDate, timeFilter]);

  const filterLabel = useMemo(() => {
    switch (timeFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        return 'Custom Range';
    }
  }, [timeFilter]);

  const intervalForTimeseries = useMemo<'day' | 'week' | 'month'>(() => {
    switch (timeFilter) {
      case 'month':
        return 'week';
      case 'today':
        return 'day';
      case 'custom':
        return 'day';
      case 'week':
      default:
        return 'day';
    }
  }, [timeFilter]);

  const {
    data: productData,
    isLoading: productLoading,
    error: productError,
    refetch: refetchProducts,
  } = useProductInsights(dateRange);

  const {
    data: timeseriesData,
    isLoading: timeseriesLoading,
    error: timeseriesError,
    refetch: refetchTimeseries,
  } = useTimeseries(dateRange, intervalForTimeseries);

  const productProfits = useMemo<DisplayProduct[]>(() => {
    return productData
      .map(p => ({
        productName: p.productName,
        totalBuy: p.totalBought,
        totalSell: p.totalSold,
        profit: p.netProfit,
        profitMargin: p.totalBought > 0 ? (p.netProfit / p.totalBought) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [productData]);

  const profitableProducts = productProfits.filter(p => p.profit > 0);
  const lossProducts = productProfits.filter(p => p.profit < 0);
  const breakEvenProducts = productProfits.filter(p => p.profit === 0);

  const showError = productError || timeseriesError;

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2 flex-wrap">
              {(['today', 'week', 'month', 'custom'] as TimeFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'today'
                    ? 'Today'
                    : filter === 'week'
                      ? 'This Week'
                      : filter === 'month'
                        ? 'This Month'
                        : 'Custom'}
                </button>
              ))}
            </div>

            {timeFilter === 'custom' && (
              <div className="flex gap-2 items-center ml-auto">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {showError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Unable to load insights.</p>
              <p className="text-sm">{productError?.message || timeseriesError?.message || 'Please try again.'}</p>
              <div className="flex gap-4 mt-2">
                <button onClick={refetchProducts} className="text-indigo-600 hover:text-indigo-700 text-sm">
                  Retry Products
                </button>
                <button onClick={refetchTimeseries} className="text-indigo-600 hover:text-indigo-700 text-sm">
                  Retry Trends
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-4">Top Performing Products</h2>
            {productLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : profitableProducts.length === 0 ? (
              <p className="text-gray-500">No profitable products in this period</p>
            ) : (
              <div className="space-y-4">
                {profitableProducts.slice(0, 5).map((product, index) => (
                  <div key={product.productName} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 font-medium">{product.productName}</p>
                      <p className="text-sm text-gray-500">Profit Margin: {product.profitMargin.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800 mb-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Rank #{index + 1}
                      </span>
                      <p className="text-green-600 text-lg">
                        +${product.profit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-4">Loss-Making Products</h2>
            {productLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : lossProducts.length === 0 ? (
              <p className="text-gray-500">No loss-making products in this period</p>
            ) : (
              <div className="space-y-4">
                {lossProducts.slice(0, 5).map(product => (
                  <div key={product.productName} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 font-medium">{product.productName}</p>
                      <p className="text-sm text-gray-500">Profit Margin: {product.profitMargin.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800 mb-1">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        Loss
                      </span>
                      <p className="text-red-600 text-lg">
                        -${Math.abs(product.profit).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-gray-900 mb-4">Sales vs Purchases vs Expenses</h2>
          {timeseriesLoading ? (
            <p className="text-gray-500">Loading trends...</p>
          ) : timeseriesData.length === 0 ? (
            <p className="text-gray-500">No data available for this range</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={timeseriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tickFormatter={value => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip
                  labelFormatter={value => new Date(value).toLocaleString()}
                  formatter={(val: number) => `₹${val.toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#16a34a" name="Sales" />
                <Line type="monotone" dataKey="purchases" stroke="#dc2626" name="Purchases" />
                <Line type="monotone" dataKey="expenses" stroke="#f97316" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-gray-900 mb-4">Break-even Products</h2>
          {productLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : breakEvenProducts.length === 0 ? (
            <p className="text-gray-500">No break-even products in this period</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {breakEvenProducts.map(product => (
                <div key={product.productName} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 font-medium">{product.productName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Sales equal purchases ({filterLabel})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
