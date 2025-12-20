/**
 * RM - Dashboard Component
 * Displays RM statistics and recent activities
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ShoppingCart,
  DollarSign,
  ArrowDownToLine,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  pendingPurchaseRequests: number;
  pendingWithdrawalRequests: number;
  totalAUM: number;
}

interface Activity {
  id: string;
  type: 'PURCHASE' | 'WITHDRAWAL';
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
  activityTrend: Array<{ date: string; purchases: number; withdrawals: number }>;
  approvalRates: {
    purchaseApprovalRate: number;
    withdrawalApprovalRate: number;
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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
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
        return 'bg-blue-500/10 text-blue-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">Total clients under management</p>
          </CardContent>
        </Card>

        {/* Total AUM */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets Under Management</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalAUM.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Total portfolio value managed</p>
          </CardContent>
        </Card>

        {/* Pending Purchase Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Purchase Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPurchaseRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
            {stats && stats.pendingPurchaseRequests > 0 && (
              <Link href="/rm/purchase-requests">
                <Button variant="link" size="sm" className="mt-2 h-auto p-0">
                  Review requests →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Pending Withdrawal Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawal Requests</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingWithdrawalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
            {stats && stats.pendingWithdrawalRequests > 0 && (
              <Link href="/rm/withdrawal-requests">
                <Button variant="link" size="sm" className="mt-2 h-auto p-0">
                  Review requests →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {charts && (
        <>
          {/* Approval Rates Card */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Purchase Requests</span>
                    <span className="text-lg font-bold text-green-600">
                      {charts.approvalRates.purchaseApprovalRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${charts.approvalRates.purchaseApprovalRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Approval rate for purchase requests</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Withdrawal Requests</span>
                    <span className="text-lg font-bold text-blue-600">
                      {charts.approvalRates.withdrawalApprovalRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${charts.approvalRates.withdrawalApprovalRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Approval rate for withdrawal requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Request Status Distribution - Pie Chart */}
            {charts.requestStatusData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={charts.requestStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
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
                </CardContent>
              </Card>
            )}

            {/* Top Clients by AUM - Bar Chart */}
            {charts.topClientsByAUM.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Clients by AUM</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={charts.topClientsByAUM} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity Trend - Line Chart */}
          {charts.activityTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Trend (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="purchases"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Purchase Requests"
                    />
                    <Line
                      type="monotone"
                      dataKey="withdrawals"
                      stroke="#f97316"
                      strokeWidth={2}
                      name="Withdrawal Requests"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent activities</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-full p-2 ${activity.type === 'PURCHASE' ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
                      {activity.type === 'PURCHASE' ? (
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === 'PURCHASE' ? (
                          <>
                            Purchase request for {activity.instrumentSymbol} - {activity.instrumentName}
                          </>
                        ) : (
                          <>
                            Withdrawal request
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.createdAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        ${activity.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(activity.status)}>
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
