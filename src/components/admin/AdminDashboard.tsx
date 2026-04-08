'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  TrendingUp,
  FileText,
  Clock,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatCard } from '@/components/dashboard/StatCard';
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
  AreaChart,
  Area,
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: fetchAnalytics,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading analytics..." />;
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

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total AUM Card */}
        <StatCard
          title="Total Investment Amount"
          value={
            <div className="flex items-center font-nums">
              <DirhamIcon className="w-5 h-5 mr-1" />
              {overview.totalAUM >= 1000000
                ? `${(overview.totalAUM / 1000000).toFixed(2)}M`
                : overview.totalAUM >= 1000
                  ? `${(overview.totalAUM / 1000).toFixed(1)}K`
                  : `${overview.totalAUM.toFixed(0)}`
              }
            </div>
          }
          icon={TrendingUp}
        />

        {/* Total Clients Card */}
        <StatCard
          title="Clients"
          value={overview.totalClients}
          icon={Users}
        />

        {/* Total RMs Card */}
        <StatCard
          title="RMs"
          value={overview.totalRMs}
          icon={UserCheck}
        />

        {/* Pending Requests Card */}
        <StatCard
          title="Pending Workflow Actions"
          value={overview.pendingRequests}
          icon={Clock}
          status={overview.pendingRequests > 0 ? "warning" : "default"}
          href={"/admin/purchase-requests" as any}
          subValue={overview.pendingPurchaseRequests > 0 ? "Investment Requests needing review" : undefined}
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active Instruments Card */}
        <StatCard
          title="Active Plans"
          value={overview.totalInstruments}
          icon={BarChart3}
        />

        {/* Total Transactions Card */}
        <StatCard
          title="Transactions"
          value={overview.totalTransactions}
          icon={FileText}
        />

        {/* Pending Withdrawals */}
        <StatCard
          title="Pending Withdrawals"
          value={overview.pendingWithdrawalRequests}
          icon={AlertCircle}
          status={overview.pendingWithdrawalRequests > 0 ? "danger" : "default"}
        />
      </div>

      {/* Charts Section */}
      {charts && (
        <div className="grid gap-4 mt-6">

          {/* Top Row: Transaction Volume (AreaChart) fully spanned horizontally */}
          {charts.transactionTrend.length > 0 && (
            <Card className="border-gray-200 shadow-sm w-full">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-gray-900">Transaction Volume (30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.transactionTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        formatter={(value: number) => `AED ${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area
                        type="monotone"
                        dataKey="purchases"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                        name="Investments"
                      />
                      <Area
                        type="monotone"
                        dataKey="withdrawals"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                        name="Withdrawals"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bottom Row Grids */}
          <div className="grid gap-4 lg:grid-cols-2">

            {/* RM Distribution - Bar Chart */}
            {charts.rmDistribution.length > 0 && (
              <Card className="border-gray-200 shadow-sm h-full">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-900">Top RMs by AUM</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.rmDistribution} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number, name: string) => {
                            if (name === 'AUM') return `AED ${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
                            return value;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="aum" fill="#3b82f6" name="AUM" radius={[0, 4, 4, 0]} barSize={16} />
                        <Bar dataKey="clients" fill="#10b981" name="Clients" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instrument Distribution - Pie Chart */}
            {charts.instrumentDistribution.length > 0 && (
              <Card className="border-gray-200 shadow-sm h-full">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-900">Instrument Overview</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.instrumentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {charts.instrumentDistribution.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
