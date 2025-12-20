/**
 * Client - Asset Allocation Charts Component
 * Visualize portfolio allocation by type and sector
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Holding } from './HoldingsTable';

interface AssetAllocationChartsProps {
  holdings: Holding[];
}

// Color palette for charts
const TYPE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
];

const SECTOR_COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#eab308', // yellow
  '#a855f7', // purple
  '#ef4444', // red
  '#0ea5e9', // sky
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
];

export function AssetAllocationCharts({ holdings }: AssetAllocationChartsProps) {
  // Calculate allocation by instrument type
  const typeAllocation = useMemo(() => {
    const typeMap = new Map<string, number>();

    holdings.forEach((holding) => {
      const type = holding.instrument.type;
      const current = typeMap.get(type) || 0;
      typeMap.set(type, current + holding.currentValue);
    });

    return Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  // Calculate allocation by sector
  const sectorAllocation = useMemo(() => {
    const sectorMap = new Map<string, number>();

    holdings.forEach((holding) => {
      const sector = holding.instrument.sector || 'Other';
      const current = sectorMap.get(sector) || 0;
      sectorMap.set(sector, current + holding.currentValue);
    });

    return Array.from(sectorMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  // Calculate total portfolio value for percentages
  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.currentValue, 0);
  }, [holdings]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalValue) * 100).toFixed(2);
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">
            ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">{percentage}% of portfolio</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderLabel = (entry: { name: string; value: number; percent: number }) => {
    const percentage = (entry.percent * 100).toFixed(1);
    return `${percentage}%`;
  };

  if (holdings.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Asset Type Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allocation by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeAllocation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeAllocation.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string, entry: any) => {
                  if (entry.payload?.value) {
                    const percentage = ((entry.payload.value / totalValue) * 100).toFixed(1);
                    return `${value} (${percentage}%)`;
                  }
                  return value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sector Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allocation by Sector</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorAllocation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
              >
                {sectorAllocation.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string, entry: any) => {
                  if (entry.payload?.value) {
                    const percentage = ((entry.payload.value / totalValue) * 100).toFixed(1);
                    return `${value} (${percentage}%)`;
                  }
                  return value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
