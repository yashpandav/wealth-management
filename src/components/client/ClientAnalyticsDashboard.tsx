/**
 * Client Analytics Dashboard (Updated for Investment Product Model)
 * Comprehensive analytics with interactive charts for investment insights
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
    expectedAnnualReturn: number;
    weightedAverageROI: number;
  };
  allocation: {
    byInvestment: Array<{
      name: string;
      value: number;
      percentage: number;
      count: number;
    }>;
    byDuration: Array<{
      duration: string;
      value: number;
      percentage: number;
      count: number;
    }>;
    diversificationScore: number;
  };
  topInvestments: Array<{
    id: string;
    trackingNumber: string;
    investmentName: string;
    amount: number;
    annualReturn: number;
    roi: number;
    expectedAnnualInterest: number;
    allocationPercent: number;
  }>;
  performance: {
    annualizedReturn: number;
    expectedAnnualReturn: number;
    daysSinceCreation: number;
    yearsSinceCreation: number;
  };
  riskMetrics: {
    diversificationScore: number;
    concentrationRisk: number;
    numberOfInvestments: number;
    numberOfUniquePlans: number;
  };
  payouts: {
    totalEarned: number;
    pending: number;
    completed: number;
    history: Array<{
      date: string;
      amount: number;
      status: string;
    }>;
  };
  investments: {
    totalPlans: number;
    distribution: Array<{
      name: string;
      value: number;
      count: number;
    }>;
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

  // Prepare pie chart data for allocation by investment
  const allocationPieData = analytics.allocation.byInvestment.map((item) => ({
    name: item.name.length > 30 ? item.name.substring(0, 27) + '...' : item.name,
    fullName: item.name,
    value: item.value,
    percentage: item.percentage,
  }));

  // Prepare bar chart data for top investments
  const topInvestmentsBarData = analytics.topInvestments.slice(0, 10).map((inv) => ({
    name: inv.investmentName.length > 20 ? inv.investmentName.substring(0, 17) + '...' : inv.investmentName,
    fullName: inv.investmentName,
    value: inv.amount,
    expectedInterest: inv.expectedAnnualInterest,
    percentage: inv.allocationPercent,
  }));

  // Prepare duration allocation data
  const durationPieData = analytics.allocation.byDuration.map((item) => ({
    name: item.duration,
    value: item.value,
    percentage: item.percentage,
  }));

  // Custom tooltip for pie charts
  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number; fullName?: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium">{payload[0].payload.fullName || payload[0].name}</p>
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
  const CustomBarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; fullName: string; value: number; expectedInterest: number; percentage: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium">{data.fullName || data.name}</p>
          <p className="text-sm flex items-center">
            Amount: <DirhamIcon className="w-3 h-3 mx-1" />
            <span className="font-medium font-nums">{data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </p>
          <p className={`text-sm flex items-center font-nums text-green-600`}>
            Expected Return:
            <DirhamIcon className="w-3 h-3 mx-1" />
            {data.expectedInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            <CardTitle className="text-xs font-medium text-gray-600">Interest Earned</CardTitle>
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
            <CardTitle className="text-xs font-medium text-gray-600">Expected Annual Return</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-brand-blue flex items-center font-nums">
              <DirhamIcon className="w-5 h-5 mr-1" />
              {analytics.overview.expectedAnnualReturn >= 1000
                ? `${(analytics.overview.expectedAnnualReturn / 1000).toFixed(1)}K`
                : analytics.overview.expectedAnnualReturn.toFixed(0)}
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
              {analytics.riskMetrics.numberOfInvestments} investments
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Weighted Avg ROI</CardTitle>
            <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-brand-blue font-nums">
              {analytics.overview.weightedAverageROI.toFixed(2)}%
            </div>
            <p className="text-xs mt-0.5 text-gray-600">
              Monthly average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Overview Cards */}
      {analytics.payouts && (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Total Interest Earned</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-2xl font-bold flex items-center font-nums text-green-600">
                <DirhamIcon className="w-5 h-5 mr-2" />
                {analytics.payouts.totalEarned >= 1000
                  ? `${(analytics.payouts.totalEarned / 1000).toFixed(1)}K`
                  : analytics.payouts.totalEarned.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Pending Payouts</CardTitle>
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-2xl font-bold font-nums text-amber-600">
                {analytics.payouts.pending}
              </div>
              <p className="text-xs mt-0.5 text-gray-600">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Completed Payouts</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-2xl font-bold font-nums text-green-600">
                {analytics.payouts.completed}
              </div>
              <p className="text-xs mt-0.5 text-gray-600">
                Successfully paid
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Allocation by Investment Plan - Pie Chart */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium">Investment Plan Distribution</CardTitle>
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

        {/* Duration Allocation - Pie Chart */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium">Investments by Duration</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={durationPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {durationPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payout History - Bar Chart */}
        {analytics.payouts && analytics.payouts.history.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm font-medium">Interest Earnings (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.payouts.history}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-lg">
                            <p className="font-medium">{data.date}</p>
                            <p className="text-sm flex items-center">
                              Amount: <DirhamIcon className="w-3 h-3 mx-1" />
                              <span className="font-medium font-nums">
                                {data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="text-sm">
                              Status: <span className={`font-medium ${data.status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'}`}>
                                {data.status}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Investment Plans Count */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium">Investment Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Plans</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-brand-blue font-nums">
                    {analytics.investments.totalPlans}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <p className="text-xs font-medium text-gray-600">Unique Investment Types</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-brand-blue font-nums">
                    {analytics.riskMetrics.numberOfUniquePlans}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Concentration Risk</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-brand-blue font-nums">
                    {analytics.riskMetrics.concentrationRisk.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    Top allocation
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Investments - Bar Chart */}
      {topInvestmentsBarData.length > 0 ? (
        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium">Top Investments by Amount</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topInvestmentsBarData} layout="horizontal">
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
      ) : (
        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium">Top Investments</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-gray-900">No Investments Yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Your investment portfolio will appear here once processed
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics Summary */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm font-medium">Portfolio Stats</CardTitle>
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
                <p className="text-xs font-medium text-gray-600">Annualized Return</p>
              </div>
              <div className="text-right">
                <p className={`text-base font-bold flex items-center justify-end font-nums ${analytics.overview.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.overview.annualizedReturn.toFixed(2)}%
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
