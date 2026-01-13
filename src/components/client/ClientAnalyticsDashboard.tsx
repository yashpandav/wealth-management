/**
 * Client Analytics Dashboard
 * Comprehensive analytics with interactive charts for portfolio insights
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
    return <LoadingSpinner text="Loading analytics..." />;
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
          <p className="text-sm flex items-center">
            Value: <DirhamIcon className="w-3 h-3 mx-1" />
            <span className="font-medium font-nums">{payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </p>
          <p className="text-sm text-muted-foreground font-nums">
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
          <p className="text-sm flex items-center">
            Value: <DirhamIcon className="w-3 h-3 mx-1" />
            <span className="font-medium font-nums">{data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </p>
          <p className={`text-sm flex items-center font-nums ${isGainPositive ? 'text-green-600' : 'text-red-600'}`}>
            Gain/Loss: {isGainPositive ? '+' : ''}
            <DirhamIcon className="w-3 h-3 mx-1" />
            {data.gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground font-nums">
            {data.percentage.toFixed(2)}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Gain/Loss</CardTitle>
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
            )}
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={`text-2xl font-bold flex items-center font-nums ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}
              <DirhamIcon className="w-5 h-5 mx-1" />
              {Math.abs(analytics.overview.gainLoss) >= 1000
                ? `${(analytics.overview.gainLoss / 1000).toFixed(1)}K`
                : analytics.overview.gainLoss.toFixed(0)}
            </div>
            <p className={`text-xs mt-0.5 font-medium font-nums ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{analytics.overview.gainLossPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Annual Return</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-brand-blue font-nums">
              {analytics.overview.annualizedReturn.toFixed(1)}%
            </div>
            <p className="text-xs mt-0.5 text-gray-600 font-nums">
              {analytics.performance.yearsSinceCreation.toFixed(1)} years
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Diversification</CardTitle>
            <PieChart className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-brand-blue font-nums">
              {analytics.riskMetrics.diversificationScore.toFixed(0)}/100
            </div>
            <p className="text-xs mt-0.5 text-gray-600 font-nums">
              {analytics.riskMetrics.numberOfHoldings} holdings
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Concentration</CardTitle>
            <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-brand-blue font-nums">
              {analytics.riskMetrics.concentrationRisk.toFixed(0)}%
            </div>
            <p className="text-xs mt-0.5 text-gray-600">
              Top allocation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Asset Allocation by Type - Pie Chart */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium">Asset Type</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={allocationPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={70}
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
        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium">Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={sectorPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={70}
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
      <Card className="border-gray-200">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm font-medium">Top Holdings</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topHoldingsBarData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics Summary */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm font-medium">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <p className="text-xs font-medium text-gray-600">Portfolio Value</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-brand-blue flex items-center justify-end font-nums">
                  <DirhamIcon className="w-4 h-4 mr-1" />
                  {analytics.overview.totalValue >= 1000000
                    ? `${(analytics.overview.totalValue / 1000000).toFixed(2)}M`
                    : analytics.overview.totalValue >= 1000
                      ? `${(analytics.overview.totalValue / 1000).toFixed(1)}K`
                      : analytics.overview.totalValue.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Invested</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-brand-blue flex items-center justify-end font-nums">
                  <DirhamIcon className="w-4 h-4 mr-1" />
                  {analytics.overview.totalInvested >= 1000000
                    ? `${(analytics.overview.totalInvested / 1000000).toFixed(2)}M`
                    : analytics.overview.totalInvested >= 1000
                      ? `${(analytics.overview.totalInvested / 1000).toFixed(1)}K`
                      : analytics.overview.totalInvested.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <p className="text-xs font-medium text-gray-600">Today&apos;s Change</p>
              </div>
              <div className="text-right">
                <p className={`text-base font-bold flex items-center justify-end font-nums ${analytics.overview.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.overview.dayChange >= 0 ? '+' : ''}
                  <DirhamIcon className="w-4 h-4 mx-1" />
                  {Math.abs(analytics.overview.dayChange) >= 1000
                    ? `${(analytics.overview.dayChange / 1000).toFixed(1)}K`
                    : analytics.overview.dayChange.toFixed(0)}
                </p>
                <p className={`text-xs font-nums ${analytics.overview.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.overview.dayChange >= 0 ? '+' : ''}{analytics.overview.dayChangePercent.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Time in Market</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-brand-blue font-nums">
                  {analytics.performance.daysSinceCreation} days
                </p>
                <p className="text-xs text-gray-600 font-nums">
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
