/**
 * RM - Dashboard Component
 * Displays RM statistics and recent activities
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  DollarSign,
  ArrowDownToLine,
  AlertCircle,
  TrendingUp,
  Package,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';
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
} from 'recharts';

interface DashboardStats {
  totalClients: number;
  pendingWithdrawalRequests: number;
  pendingProductRequests: number;
  totalAUM: number;
}

interface Activity {
  id: string;
  type: 'PURCHASE' | 'WITHDRAWAL' | 'PRODUCT';
  clientName: string;
  instrumentName: string;
  instrumentSymbol: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface ChartData {
  requestStatusData: Array<{ name: string; value: number; fill: string }>;
  topClientsByAUM: Array<{ name: string; value: number }>;
  activityTrend: Array<{ date: string; withdrawals: number; products: number }>;
  approvalRates: {
    withdrawalApprovalRate: number;
    productApprovalRate: number;
  };
}

interface DashboardResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
    recentActivities: Activity[];
    charts?: ChartData;
  };
  error?: string;
}

async function fetchDashboardStats(): Promise<DashboardResponse> {
  const response = await fetch('/api/rm/dashboard/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
}

export function RMDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rm-dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load dashboard data. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const stats = data?.data.stats;
  const activities = data?.data.recentActivities || [];
  const charts = data?.data.charts;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_RM_REVIEW':
        return 'bg-yellow-500/10 text-yellow-700';
      case 'RM_APPROVED':
      case 'APPROVED':
        return 'bg-green-500/10 text-green-700';
      case 'RM_REJECTED':
      case 'REJECTED':
        return 'bg-red-500/10 text-red-700';
      case 'ADMIN_REVIEW':
        return 'bg-brand-blue/10/10 text-brand-blue';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Clients */}
        <StatCard
          title="Clients"
          value={stats?.totalClients || 0}
          icon={Users}
        />

        {/* Total AUM */}
        <StatCard
          title="Total AUM"
          value={
            stats && stats.totalAUM >= 1000000
              ? `$${(stats.totalAUM / 1000000).toFixed(2)}M`
              : stats && stats.totalAUM >= 1000
                ? `$${(stats.totalAUM / 1000).toFixed(1)}K`
                : `$${stats?.totalAUM.toFixed(0) || '0'}`
          }
          icon={TrendingUp}
        />

        {/* Pending Withdrawal Requests */}
        <StatCard
          title="Withdrawals"
          value={stats?.pendingWithdrawalRequests || 0}
          icon={ArrowDownToLine}
          status={(stats?.pendingWithdrawalRequests ?? 0) > 0 ? "warning" : "default"}
          href={(stats?.pendingWithdrawalRequests ?? 0) > 0 ? "/rm/withdrawal-requests" : undefined}
          subValue={(stats?.pendingWithdrawalRequests ?? 0) > 0 ? "Pending Review" : undefined}
        />

        {/* Pending Product Requests */}
        <StatCard
          title="Products"
          value={stats?.pendingProductRequests || 0}
          icon={Package}
          status={(stats?.pendingProductRequests ?? 0) > 0 ? "info" : "default"}
          href={(stats?.pendingProductRequests ?? 0) > 0 ? "/rm/product-requests" : undefined}
          subValue={(stats?.pendingProductRequests ?? 0) > 0 ? "Pending Review" : undefined}
        />
      </div>

      {/* Charts Section */}
      {charts && (
        <>
          {/* Approval Rates Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm font-medium">Approval Performance</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Withdrawals</span>
                    <span className="text-sm font-bold text-brand-blue">
                      {charts.approvalRates.withdrawalApprovalRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-blue rounded-full"
                      style={{ width: `${charts.approvalRates.withdrawalApprovalRate}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Products</span>
                    <span className="text-sm font-bold text-purple-600">
                      {charts.approvalRates.productApprovalRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${charts.approvalRates.productApprovalRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Request Status Distribution - Pie Chart */}
            {charts.requestStatusData.length > 0 && (
              <Card className="border-gray-200">
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm font-medium">Request Status</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="w-full overflow-x-auto pb-4">
                    <div className="min-w-[300px]">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={charts.requestStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {charts.requestStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Clients by AUM - Bar Chart */}
            {charts.topClientsByAUM.length > 0 && (
              <Card className="border-gray-200">
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm font-medium">Top Clients</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="w-full overflow-x-auto pb-4">
                    <div className="min-w-[400px]">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={charts.topClientsByAUM} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={90}
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(value: number) =>
                              `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            }
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity Trend - Line Chart */}
          {charts.activityTrend.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm font-medium">Activity Trend (30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="w-full overflow-x-auto pb-4">
                  <div className="min-w-[500px]">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={charts.activityTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString();
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="withdrawals"
                          stroke="#f97316"
                          strokeWidth={2}
                          name="Withdrawals"
                        />
                        <Line
                          type="monotone"
                          dataKey="products"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          name="Products"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recent Activities */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-xs">No recent activities</p>
          ) : (
            <div className="space-y-2.5">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`rounded-full p-1.5 ${activity.type === 'PRODUCT'
                      ? 'bg-purple-500/10'
                      : 'bg-orange-500/10'
                      }`}>
                      {activity.type === 'PRODUCT' ? (
                        <Package className="h-3 w-3 text-purple-600" />
                      ) : (
                        <DollarSign className="h-3 w-3 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{activity.clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.type === 'PRODUCT' ? activity.instrumentName : 'Withdrawal'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(activity.createdAt), 'MMM dd, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-medium text-xs">
                        {activity.type === 'PRODUCT'
                          ? `${activity.instrumentSymbol} ${activity.amount.toFixed(0)}`
                          : `$${(activity.amount / 1000).toFixed(1)}K`
                        }
                      </p>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(activity.status)} text-[10px] px-1.5 py-0`}>
                      {activity.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
