/**
 * Admin Dashboard Component
 * Comprehensive analytics dashboard with system-wide metrics
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface AnalyticsOverview {
  totalClients: number;
  totalRMs: number;
  totalAdmins: number;
  totalAUM: number;
  totalInstruments: number;
  pendingRequests: number;
  pendingPurchaseRequests: number;
  pendingWithdrawalRequests: number;
  totalTransactions: number;
  completedTransactions: number;
  transactionSuccessRate: number;
}

interface ChartData {
  rmDistribution: Array<{ name: string; clients: number; aum: number }>;
  instrumentDistribution: Array<{ name: string; value: number }>;
  transactionTrend: Array<{ date: string; purchases: number; withdrawals: number; total: number }>;
  requestStatusDistribution: Array<{ name: string; value: number; fill: string }>;
  userGrowthTrend: Array<{ month: string; clients: number; rms: number }>;
}

interface AnalyticsResponse {
  success: boolean;
  data: {
    overview: AnalyticsOverview;
    charts?: ChartData;
  };
  error?: string;
}

async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const response = await fetch('/api/admin/analytics/overview');
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  return response.json();
}

export function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: fetchAnalytics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load analytics data. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const overview = data.data.overview;
  const charts = data.data.charts;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total AUM Card */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Total AUM</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-brand-blue">
              ${overview.totalAUM >= 1000000
                ? `${(overview.totalAUM / 1000000).toFixed(2)}M`
                : overview.totalAUM >= 1000
                ? `${(overview.totalAUM / 1000).toFixed(1)}K`
                : overview.totalAUM.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        {/* Total Clients Card */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Clients</CardTitle>
            <Users className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-brand-blue">{overview.totalClients}</div>
          </CardContent>
        </Card>

        {/* Total RMs Card */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">RMs</CardTitle>
            <UserCheck className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-brand-blue">{overview.totalRMs}</div>
          </CardContent>
        </Card>

        {/* Pending Requests Card */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-amber-600">{overview.pendingRequests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid gap-3 grid-cols-3">
        {/* Active Instruments Card */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Instruments</CardTitle>
            <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-brand-blue">{overview.totalInstruments}</div>
          </CardContent>
        </Card>

        {/* Total Transactions Card */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Transactions</CardTitle>
            <FileText className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-brand-blue">{overview.totalTransactions}</div>
          </CardContent>
        </Card>

        {/* Transaction Success Rate Card */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">Success Rate</CardTitle>
            <CheckCircle className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-green-600">{overview.transactionSuccessRate.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Client/RM Ratio</span>
              <span className="text-sm font-semibold">
                {overview.totalRMs > 0 ? `${(overview.totalClients / overview.totalRMs).toFixed(1)}:1` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Avg AUM/Client</span>
              <span className="text-sm font-semibold">
                ${overview.totalClients > 0 ? ((overview.totalAUM / overview.totalClients) / 1000).toFixed(1) + 'K' : '0'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Purchase Requests</span>
              <span className="text-sm font-semibold text-brand-blue">{overview.pendingPurchaseRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Withdrawal Requests</span>
              <span className="text-sm font-semibold text-orange-600">{overview.pendingWithdrawalRequests}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {charts && (
        <>
          {/* User Growth Trend - Line Chart */}
          {charts.userGrowthTrend.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm font-medium">User Growth (6 Months)</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={charts.userGrowthTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="clients"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Clients"
                    />
                    <Line
                      type="monotone"
                      dataKey="rms"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="RMs"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Charts Grid */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* RM Distribution - Bar Chart */}
            {charts.rmDistribution.length > 0 && (
              <Card className="border-gray-200">
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm font-medium">Top RMs</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={charts.rmDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === 'aum') {
                            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                          }
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="aum" fill="#3b82f6" name="AUM" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="clients" fill="#10b981" name="Clients" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Instrument Distribution - Pie Chart */}
            {charts.instrumentDistribution.length > 0 && (
              <Card className="border-gray-200">
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm font-medium">Instrument Types</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={charts.instrumentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {charts.instrumentDistribution.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Transaction Volume Trend - Area Chart */}
          {charts.transactionTrend.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm font-medium">Transaction Volume (30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={charts.transactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString();
                      }}
                      formatter={(value: number) =>
                        `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      }
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="purchases"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Purchases"
                    />
                    <Area
                      type="monotone"
                      dataKey="withdrawals"
                      stackId="1"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.6}
                      name="Withdrawals"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Request Status Distribution - Pie Chart */}
          {charts.requestStatusDistribution.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm font-medium">Request Status</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={charts.requestStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {charts.requestStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
