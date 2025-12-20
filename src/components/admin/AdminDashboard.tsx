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
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total AUM Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AUM</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview.totalAUM.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Assets Under Management</p>
          </CardContent>
        </Card>

        {/* Total Clients Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalClients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Active client accounts</p>
          </CardContent>
        </Card>

        {/* Total RMs Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relationship Managers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalRMs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.totalClients > 0
                ? `Avg ${(overview.totalClients / overview.totalRMs).toFixed(1)} clients per RM`
                : 'No clients assigned'}
            </p>
          </CardContent>
        </Card>

        {/* Pending Requests Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.pendingPurchaseRequests} purchase, {overview.pendingWithdrawalRequests}{' '}
              withdrawal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Instruments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Instruments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalInstruments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for investment</p>
          </CardContent>
        </Card>

        {/* Total Transactions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.completedTransactions} completed
            </p>
          </CardContent>
        </Card>

        {/* Transaction Success Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.transactionSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Transaction completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions / Insights Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Client-to-RM Ratio</span>
              <span className="font-semibold">
                {overview.totalRMs > 0
                  ? `${(overview.totalClients / overview.totalRMs).toFixed(1)}:1`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average AUM per Client</span>
              <span className="font-semibold">
                $
                {overview.totalClients > 0
                  ? (overview.totalAUM / overview.totalClients).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average AUM per RM</span>
              <span className="font-semibold">
                $
                {overview.totalRMs > 0
                  ? (overview.totalAUM / overview.totalRMs).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Purchase Requests</span>
              <span className="font-semibold text-blue-600">
                {overview.pendingPurchaseRequests}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Withdrawal Requests</span>
              <span className="font-semibold text-orange-600">
                {overview.pendingWithdrawalRequests}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Pending</span>
              <span className="font-semibold">{overview.pendingRequests}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {charts && (
        <>
          {/* User Growth Trend - Line Chart */}
          {charts.userGrowthTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={charts.userGrowthTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="clients"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="New Clients"
                    />
                    <Line
                      type="monotone"
                      dataKey="rms"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="New RMs"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* RM Distribution - Bar Chart */}
            {charts.rmDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top RMs by AUM</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={charts.rmDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
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
              <Card>
                <CardHeader>
                  <CardTitle>Instrument Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={charts.instrumentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
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
            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume Trend (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
                      tick={{ fontSize: 12 }}
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
                      name="Purchase Volume"
                    />
                    <Area
                      type="monotone"
                      dataKey="withdrawals"
                      stackId="1"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.6}
                      name="Withdrawal Volume"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Request Status Distribution - Pie Chart */}
          {charts.requestStatusDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Request Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={charts.requestStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
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
