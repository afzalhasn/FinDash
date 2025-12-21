"use client";

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useProductInsights, useTimeseries } from '../../hooks/useInsights';
import { DateRangeFilter, PresetOption } from '../../shared/ui/filters/DateRangeFilter';
import { PageLayout } from '../../shared/ui/layout/PageLayout';

interface DisplayProduct {
  productName: string;
  totalBuy: number;
  totalSell: number;
  profit: number;
  profitMargin: number;
}

export function ProductInsightsPage() {
  const { setCurrentPage } = useApp();
  const [preset, setPreset] = useState<PresetOption>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (preset) {
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
  }, [customEndDate, customStartDate, preset]);

  const filterLabel = useMemo(() => {
    switch (preset) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        return 'Custom Range';
    }
  }, [preset]);

  const intervalForTimeseries = useMemo<'day' | 'week' | 'month'>(() => {
    switch (preset) {
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
  }, [preset]);

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
    <PageLayout
      header={{
        title: 'Product Insights',
        subtitle: 'Analyze product-wise profitability',
        backButton: {
          label: 'Back to Dashboard',
          onClick: () => setCurrentPage('dashboard'),
          icon: ArrowLeft,
        },
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


        {showError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Unable to load insights.</p>
              <p className="text-sm">{productError?.message || timeseriesError?.message || 'Please try again.'}</p>
              <div className="flex gap-4 mt-2">
                <button onClick={refetchProducts} className="text-primary hover:text-primary/80 text-sm">
                  Retry Products
                </button>
                <button onClick={refetchTimeseries} className="text-primary hover:text-primary/80 text-sm">
                  Retry Trends
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
            <h2 className="text-foreground mb-4">Top Performing Products</h2>
            {productLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : profitableProducts.length === 0 ? (
              <p className="text-muted-foreground">No profitable products in this period</p>
            ) : (
              <div className="space-y-4">
                {profitableProducts.slice(0, 5).map((product, index) => (
                  <div key={product.productName} className="bg-muted/40 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">Profit Margin: {product.profitMargin.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary mb-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Rank #{index + 1}
                      </span>
                      <p className="text-primary text-lg">
                        +₹{product.profit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
            <h2 className="text-foreground mb-4">Loss-Making Products</h2>
            {productLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : lossProducts.length === 0 ? (
              <p className="text-muted-foreground">No loss-making products in this period</p>
            ) : (
              <div className="space-y-4">
                {lossProducts.slice(0, 5).map(product => (
                  <div key={product.productName} className="bg-muted/40 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">Profit Margin: {product.profitMargin.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive mb-1">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        Loss
                      </span>
                      <p className="text-destructive text-lg">
                        -₹{Math.abs(product.profit).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-foreground mb-4">Sales vs Purchases vs Expenses</h2>
          {timeseriesLoading ? (
            <p className="text-muted-foreground">Loading trends...</p>
          ) : timeseriesData.length === 0 ? (
            <p className="text-muted-foreground">No data available for this range</p>
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
                <Line type="monotone" dataKey="sales" stroke="var(--chart-2)" name="Sales" />
                <Line type="monotone" dataKey="purchases" stroke="var(--chart-4)" name="Purchases" />
                <Line type="monotone" dataKey="expenses" stroke="var(--chart-3)" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-foreground mb-4">Break-even Products</h2>
          {productLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : breakEvenProducts.length === 0 ? (
            <p className="text-muted-foreground">No break-even products in this period</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {breakEvenProducts.map(product => (
                <div key={product.productName} className="bg-muted/40 rounded-lg p-4">
                  <p className="text-foreground font-medium">{product.productName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sales equal purchases ({filterLabel})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
    </PageLayout>
  );
}
