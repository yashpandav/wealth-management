/**
 * Client - Performance Over Time Chart
 * Displays portfolio performance with time-based visualization
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';

interface PerformanceChartProps {
  currentValue: number;
  totalInvested: number;
}

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export function PerformanceChart({ currentValue, totalInvested }: PerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1Y');

  // Generate mock historical data based on current portfolio value
  // In production, this would come from an API endpoint with real historical data
  const generateHistoricalData = useCallback((period: TimePeriod) => {
    const today = new Date();
    const dataPoints: { date: string; value: number; invested: number }[] = [];

    let daysBack = 365; // Default to 1 year
    let interval = 7; // Weekly data points

    switch (period) {
      case '1M':
        daysBack = 30;
        interval = 1; // Daily
        break;
      case '3M':
        daysBack = 90;
        interval = 3; // Every 3 days
        break;
      case '6M':
        daysBack = 180;
        interval = 7; // Weekly
        break;
      case '1Y':
        daysBack = 365;
        interval = 7; // Weekly
        break;
      case 'ALL':
        daysBack = 730; // 2 years
        interval = 14; // Bi-weekly
        break;
    }

    // Starting value (simulated)
    const startValue = totalInvested * 0.85; // Assume 15% growth over the period
    const valueGrowth = (currentValue - startValue) / (daysBack / interval);

    for (let i = daysBack; i >= 0; i -= interval) {
      const date = subDays(today, i);
      const pointIndex = (daysBack - i) / interval;

      // Simulate some volatility
      const volatility = (Math.random() - 0.5) * 0.03 * currentValue;
      const value = startValue + (valueGrowth * pointIndex) + volatility;

      // Invested amount grows linearly (simulated regular investments)
      const invested = totalInvested - ((totalInvested - totalInvested * 0.9) * (i / daysBack));

      dataPoints.push({
        date: format(date, 'MMM dd'),
        value: Math.max(0, value),
        invested: Math.max(0, invested),
      });
    }

    return dataPoints;
  }, [currentValue, totalInvested]);

  const chartData = useMemo(() => generateHistoricalData(selectedPeriod), [selectedPeriod, generateHistoricalData]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (chartData.length < 2) return { change: 0, changePercent: 0 };

    const startValue = chartData[0].value;
    const endValue = chartData[chartData.length - 1].value;
    const change = endValue - startValue;
    const changePercent = (change / startValue) * 100;

    return { change, changePercent };
  }, [chartData]);

  const isPositive = performanceMetrics.change >= 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string }; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="mb-2 font-medium">{payload[0].payload.date}</p>
          <p className="text-sm">
            Portfolio: <span className="font-medium">${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </p>
          {payload[1] && (
            <p className="text-sm text-muted-foreground">
              Invested: <span className="font-medium">${payload[1].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Portfolio Performance</CardTitle>
            <div className={`mt-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}${performanceMetrics.change.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              ({isPositive ? '+' : ''}{performanceMetrics.changePercent.toFixed(2)}%)
              <span className="ml-2 text-muted-foreground">
                {selectedPeriod === 'ALL' ? 'All time' : `Last ${selectedPeriod}`}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as TimePeriod[]).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="h-8 px-3"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Portfolio Value"
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="invested"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Total Invested"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Portfolio Value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 border-2 border-dashed border-slate-400 bg-transparent" />
            <span>Total Invested</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
