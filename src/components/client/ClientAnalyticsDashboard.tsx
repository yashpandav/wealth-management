/**
 * Client Analytics Dashboard
 * Comprehensive analytics with interactive charts for portfolio insights
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalValue: number;
    totalInvested: number;
    gainLoss: number;
    gainLossPercent: number;
    dayChange: number;
    dayChangePercent: number;
    annualizedReturn: number;
  };
  allocation: {
    byType: Array<{
      type: string;
      value: number;
      percentage: number;
      count: number;
    }>;
    bySector: Array<{
      sector: string;
      value: number;
      percentage: number;
      count: number;
    }>;
    diversificationScore: number;
  };
  topHoldings: Array<{
    symbol: string;
    name: string;
    type: string;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    allocationPercent: number;
  }>;
  performance: {
    annualizedReturn: number;
    daysSinceCreation: number;
    yearsSinceCreation: number;
  };
  riskMetrics: {
    diversificationScore: number;
    concentrationRisk: number;
    numberOfHoldings: number;
  };
}

interface AnalyticsResponse {
  success: boolean;
  data: {
    analytics: AnalyticsData | null;
  };
  error?: string;
}

async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const response = await fetch('/api/client/analytics');
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data');
  }
  return response.json();
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const INSTRUMENT_TYPE_LABELS: Record<string, string> = {
  STOCK: 'Stocks',
  BOND: 'Bonds',
  ETF: 'ETFs',
  MUTUAL_FUND: 'Mutual Funds',
  ALTERNATIVE: 'Alternatives',
};

export function ClientAnalyticsDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['client-analytics'],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.success || !data.data.analytics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No analytics available. Make your first investment to see insights.
        </AlertDescription>
      </Alert>
    );
  }

  const analytics = data.data.analytics;
  const isPositive = analytics.overview.gainLoss >= 0;

  // Prepare pie chart data for allocation by type
  const allocationPieData = analytics.allocation.byType.map((item) => ({
    name: INSTRUMENT_TYPE_LABELS[item.type] || item.type,
    value: item.value,
    percentage: item.percentage,
  }));

  // Prepare bar chart data for top holdings
  const topHoldingsBarData = analytics.topHoldings.slice(0, 10).map((holding) => ({
    name: holding.symbol,
    value: holding.currentValue,
    gainLoss: holding.gainLoss,
    percentage: holding.allocationPercent,
  }));

  // Prepare sector allocation data
  const sectorPieData = analytics.allocation.bySector.map((item) => ({
    name: item.sector,
    value: item.value,
    percentage: item.percentage,
  }));

  // Custom tooltip for pie charts
  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">
            Value: <span className="font-medium">${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {payload[0].payload.percentage.toFixed(2)}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; gainLoss: number; percentage: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isGainPositive = data.gainLoss >= 0;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            Value: <span className="font-medium">${data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </p>
          <p className={`text-sm ${isGainPositive ? 'text-green-600' : 'text-red-600'}`}>
            Gain/Loss: {isGainPositive ? '+' : ''}${data.gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.percentage.toFixed(2)}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}${analytics.overview.gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{analytics.overview.gainLossPercent.toFixed(2)}% return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annualized Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.annualizedReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.performance.yearsSinceCreation.toFixed(1)} years
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversification Score</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.riskMetrics.diversificationScore.toFixed(0)}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.riskMetrics.numberOfHoldings} holdings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concentration Risk</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.riskMetrics.concentrationRisk.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Largest single allocation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Allocation by Type - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={allocationPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sector Allocation - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={sectorPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sectorPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Holdings - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Holdings by Value</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topHoldingsBarData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">Portfolio Value</p>
                <p className="text-xs text-muted-foreground">Current market value</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  ${analytics.overview.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">Total Invested</p>
                <p className="text-xs text-muted-foreground">Amount invested</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  ${analytics.overview.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">Day Change</p>
                <p className="text-xs text-muted-foreground">Today&apos;s performance</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${analytics.overview.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.overview.dayChange >= 0 ? '+' : ''}${analytics.overview.dayChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-xs ${analytics.overview.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.overview.dayChange >= 0 ? '+' : ''}{analytics.overview.dayChangePercent.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Investment Period</p>
                <p className="text-xs text-muted-foreground">Time in market</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {analytics.performance.daysSinceCreation} days
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.performance.yearsSinceCreation.toFixed(1)} years
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
