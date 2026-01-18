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
  Wallet,
  AlertCircle,
  TrendingUp,
  Package,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
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
  pendingPayouts?: number;
  pendingPayoutsAmount?: number;
  totalPayoutsPaid?: number;
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

interface PayoutActivity {
  id: string;
  clientName: string;
  planName: string;
  amount: number;
  scheduledDate: string;
  status: string;
}

interface ChartData {
  requestStatusData: Array<{ name: string; value: number; fill: string }>;
  topClientsByAUM: Array<{ name: string; value: number }>;
  activityTrend: Array<{ date: string; withdrawals: number; products: number }>;
  approvalRates: {
    withdrawalApprovalRate: number;
    productApprovalRate: number;
  };
  payoutStatusData?: Array<{ name: string; value: number; fill: string }>;
}

interface DashboardResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
    recentActivities: Activity[];
    recentPayouts?: PayoutActivity[];
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
  const recentPayouts = data?.data.recentPayouts || [];
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
        return 'bg-brand-blue/10 text-brand-blue';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {/* Total Clients */}
        <StatCard
          title="Clients"
          value={stats?.totalClients || 0}
          icon={Users}
        />

        {/* Total AUM */}
        <StatCard
          title="Total Investment Amount"
          value={
            stats ? (
              <div className="flex items-center font-nums">
                <DirhamIcon className="w-5 h-5 mr-1" />
                {stats.totalAUM >= 1000000
                  ? `${(stats.totalAUM / 1000000).toFixed(2)}M`
                  : stats.totalAUM >= 1000
                    ? `${(stats.totalAUM / 1000).toFixed(1)}K`
                    : `${stats.totalAUM.toFixed(0)}`
                }
              </div>
            ) : '0'
          }
          icon={TrendingUp}
        />

        {/* Pending Product Requests */}
        <StatCard
          title="Pending Plans"
          value={stats?.pendingProductRequests || 0}
          icon={Package}
          status={(stats?.pendingProductRequests ?? 0) > 0 ? "info" : "default"}
          href={(stats?.pendingProductRequests ?? 0) > 0 ? "/rm/product-requests" : undefined}
          subValue={(stats?.pendingProductRequests ?? 0) > 0 ? "Needs Review" : undefined}
        />

        {/* Pending Payouts */}
        {stats?.pendingPayouts !== undefined && (
          <StatCard
            title="Pending Payouts"
            value={stats.pendingPayouts}
            icon={AlertCircle}
            status={stats.pendingPayouts > 0 ? "warning" : "default"}
            subValue={
              stats.pendingPayoutsAmount
                ? (
                  <div className="flex items-center text-xs font-nums">
                    <DirhamIcon className="w-3 h-3 mr-1" />
                    {stats.pendingPayoutsAmount >= 1000
                      ? `${(stats.pendingPayoutsAmount / 1000).toFixed(0)}K`
                      : stats.pendingPayoutsAmount.toFixed(0)
                    } pending
                  </div>
                )
                : undefined
            }
          />
        )}

        {/* Total Payouts Paid */}
        {stats?.totalPayoutsPaid !== undefined && (
          <StatCard
            title="Payouts Paid"
            value={
              <div className="flex items-center font-nums">
                <DirhamIcon className="w-5 h-5 mr-1" />
                {stats.totalPayoutsPaid >= 1000000
                  ? `${(stats.totalPayoutsPaid / 1000000).toFixed(2)}M`
                  : stats.totalPayoutsPaid >= 1000
                    ? `${(stats.totalPayoutsPaid / 1000).toFixed(0)}K`
                    : stats.totalPayoutsPaid.toFixed(0)
                }
              </div>
            }
            icon={TrendingUp}
            status="success"
          />
        )}
      </div>

      {/* Charts Section */}
      {charts && (
        <>
          {/* Approval Rates Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-900">Plan Approval Rate</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investment Plans</span>
                  <span className="text-base font-bold text-brand-blue font-nums">
                    {charts.approvalRates.productApprovalRate.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-blue rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${charts.approvalRates.productApprovalRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Request Status Distribution - Pie Chart */}
            {charts.requestStatusData.length > 0 && (
              <Card className="border-gray-200 shadow-sm h-full">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-900">Request Status</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.requestStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {charts.requestStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Clients by AUM - Bar Chart */}
            {charts.topClientsByAUM.length > 0 && (
              <Card className="border-gray-200 shadow-sm h-full">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-900">Top Clients by Investment Amount</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.topClientsByAUM} layout="vertical" margin={{ left: 20 }}>
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
                          formatter={(value: number) =>
                            `AED ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          }
                        />
                        <Bar
                          dataKey="value"
                          fill="#3b82f6"
                          radius={[0, 4, 4, 0]}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity Trend - Line Chart */}
          {charts.activityTrend.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-gray-900">Investment Plans Activity (30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.activityTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
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
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line
                        type="monotone"
                        dataKey="products"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="Investment Plans"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payout Status Distribution - Pie Chart */}
          {charts.payoutStatusData && charts.payoutStatusData.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-gray-900">Payout Status</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.payoutStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {charts.payoutStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recent Payouts */}
      {recentPayouts.length > 0 && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-900">Recent Payouts (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="divide-y divide-gray-100">
              {recentPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 first:pt-0 last:pb-0 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{payout.clientName}</p>
                    <p className="text-sm text-gray-500 truncate">{payout.planName}</p>
                    <p className="text-xs text-gray-400 mt-1 font-nums">
                      {format(new Date(payout.scheduledDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
                    <span className="font-semibold text-gray-900 flex items-center font-nums">
                      <DirhamIcon className="w-3 h-3 mr-1" />
                      {payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <Badge
                      variant="outline"
                      className={`border-0 font-medium ${
                        payout.status === 'COMPLETED'
                          ? 'bg-green-500/10 text-green-700'
                          : payout.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-700'
                            : 'bg-red-500/10 text-red-700'
                      }`}
                    >
                      {payout.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-900">Recent Investment Requests</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-50 p-4 mb-4">
                <AlertCircle className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">No recent activities</p>
              <p className="text-sm text-gray-500 mt-1">
                New client actions will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4 sm:gap-0"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-1 flex-shrink-0 ${activity.type === 'PRODUCT'
                      ? 'text-purple-600'
                      : 'text-orange-600'
                      }`}>
                      {activity.type === 'PRODUCT' ? (
                        <Package className="h-6 w-6" />
                      ) : (
                        <DirhamIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900">{activity.clientName}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.type === 'PRODUCT' ? activity.instrumentName : 'Withdrawal Request'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-nums">
                        {format(new Date(activity.createdAt), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-1 pl-11 sm:pl-0">
                    <span className="font-semibold text-gray-900 flex items-center font-nums">
                      {activity.type === 'PRODUCT' ? (
                        <>
                          {activity.instrumentSymbol} {activity.amount.toLocaleString()}
                        </>
                      ) : (
                        <>
                          <DirhamIcon className="w-3 h-3 mr-1" />
                          {activity.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </>
                      )}
                    </span>
                    <Badge variant="outline" className={`${getStatusColor(activity.status)} border-0 font-medium`}>
                      {activity.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
}
