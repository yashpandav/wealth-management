'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
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
    expectedAnnualReturn: number;
    weightedAverageROI: number;
  };
  allocation: {
    byInvestment: Array<{ name: string; value: number; percentage: number; count: number }>;
    byDuration: Array<{ duration: string; value: number; percentage: number; count: number }>;
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
  payouts: {
    totalEarned: number;
    pending: number;
    completed: number;
    history: Array<{ date: string; amount: number; status: string }>;
  };
  investments: {
    totalPlans: number;
  };
}

interface AnalyticsResponse {
  success: boolean;
  data: { analytics: AnalyticsData | null };
  error?: string;
}

async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch('/api/client/analytics');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

const PALETTE = ['#1d4ed8', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];

// Inline percent label rendered inside each slice
const InnerLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percentage,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percentage: number;
}) => {
  if (percentage < 6) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${percentage.toFixed(0)}%`}
    </text>
  );
};

function SliceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name?: string; duration?: string; value: number; percentage: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md text-sm">
      <p className="font-medium text-gray-700 mb-1 font-optima">{d.name ?? d.duration}</p>
      <p className="flex items-center gap-1 font-bold text-brand-blue font-nums">
        <DirhamIcon className="w-3 h-3" />
        {Number(d.value).toLocaleString('en-US', { minimumFractionDigits: 0 })}
      </p>
      <p className="text-xs text-gray-500 font-nums">{d.percentage.toFixed(1)}% of total</p>
    </div>
  );
}

function DonutChart({ data, nameKey }: {
  data: Array<Record<string, unknown>>;
  nameKey: string;
}) {
  return (
    <div className="flex gap-5 items-center">
      <ResponsiveContainer width="52%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={84}
            dataKey="value"
            labelLine={false}
            label={InnerLabel as unknown as boolean}
          >
            {data.map((_e, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<SliceTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex-1 space-y-2 min-w-0">
        {data.map((d, i) => {
          const label = (d[nameKey] as string) ?? '';
          const pct = d.percentage as number;
          return (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span className="text-xs text-gray-600 truncate flex-1 font-optima">
                {label.length > 22 ? label.slice(0, 20) + '…' : label}
              </span>
              <span className="text-xs font-semibold text-gray-800 flex-shrink-0 font-nums">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ClientAnalyticsDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['client-analytics'],
    queryFn: fetchAnalytics,
  });

  if (isLoading) return <LoadingSpinner text="Loading analytics..." />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load analytics. Please try again later.</AlertDescription>
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

  const a = data.data.analytics;
  const isGain = a.overview.gainLoss >= 0;

  const planData = a.allocation.byInvestment.map((d) => ({ ...d, name: d.name }));
  const durationData = a.allocation.byDuration.map((d) => ({ ...d, name: d.duration }));

  return (
    <div className="space-y-6">

      {/* ── Row 1: Core Metrics ── */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Portfolio Value"
          value={
            <div className="flex items-center font-nums">
              <DirhamIcon className="w-5 h-5 mr-1" />
              {fmt(a.overview.totalValue)}
            </div>
          }
          icon={DirhamIcon}
        />

        <StatCard
          title="Total Invested"
          value={
            <div className="flex items-center font-nums">
              <DirhamIcon className="w-5 h-5 mr-1" />
              {fmt(a.overview.totalInvested)}
            </div>
          }
          icon={PiggyBank}
        />

        <StatCard
          title="Interest Earned"
          value={
            <div className="flex items-center font-nums">
              {isGain ? '+' : ''}
              <DirhamIcon className="w-5 h-5 mx-1" />
              {fmt(Math.abs(a.overview.gainLoss))}
            </div>
          }
          icon={isGain ? TrendingUp : TrendingDown}
          status={isGain ? 'success' : 'danger'}
          trend={isGain ? 'up' : 'down'}
          trendValue={`${a.overview.gainLossPercent.toFixed(1)}%`}
        />

        <StatCard
          title="Expected Annual"
          value={
            <div className="flex items-center font-nums">
              <DirhamIcon className="w-5 h-5 mr-1" />
              {fmt(a.overview.expectedAnnualReturn)}
            </div>
          }
          icon={Wallet}
          subValue={`${a.overview.weightedAverageROI.toFixed(2)}% weighted ROI`}
        />
      </div>

      {/* ── Row 2: Payout Metrics ── */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <StatCard
          title="Payouts Received"
          value={
            <div className="flex items-center font-nums">
              <DirhamIcon className="w-5 h-5 mr-1" />
              {fmt(a.payouts.totalEarned)}
            </div>
          }
          icon={CheckCircle2}
          status="success"
          subValue={`${a.payouts.completed} completed`}
        />

        <StatCard
          title="Pending Payouts"
          value={a.payouts.pending}
          icon={Clock}
          status={a.payouts.pending > 0 ? 'warning' : 'neutral'}
          subValue="awaiting processing"
        />

        <StatCard
          title="Active Plans"
          value={a.investments.totalPlans}
          icon={Activity}
          status="info"
          subValue="investment plans"
        />
      </div>

      {/* ── Row 3: Charts ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Payout History Bar Chart */}
        {a.payouts.history.length > 0 ? (
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium font-optima flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                Interest Earnings — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={a.payouts.history} barCategoryGap="38%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'var(--font-optima)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md text-sm">
                          <p className="font-medium text-gray-700 mb-1 font-optima">{d.date}</p>
                          <p className="flex items-center gap-1 font-bold text-brand-blue font-nums">
                            <DirhamIcon className="w-3 h-3" />
                            {Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </p>
                          <p className={`text-xs mt-0.5 font-nums ${d.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {d.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="amount" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium font-optima flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                Interest Earnings — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart3 className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-optima">No payout history in the last 6 months</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Allocation by Plan */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium font-optima">Allocation by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {planData.length > 0 ? (
              <DonutChart data={planData as Array<Record<string, unknown>>} nameKey="name" />
            ) : (
              <p className="text-sm text-gray-400 font-optima">No plan data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Duration + Top Investments Table ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Allocation by Duration */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium font-optima">Allocation by Duration</CardTitle>
          </CardHeader>
          <CardContent>
            {durationData.length > 0 ? (
              <DonutChart data={durationData as Array<Record<string, unknown>>} nameKey="name" />
            ) : (
              <p className="text-sm text-gray-400 font-optima">No duration data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Investments */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium font-optima">Top Investments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {a.topInvestments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider font-optima">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider font-optima">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider font-optima">
                        ROI
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider font-optima">
                        Ann. Return
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {a.topInvestments.slice(0, 6).map((inv, i) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-5 rounded-full flex-shrink-0"
                              style={{ background: PALETTE[i % PALETTE.length] }}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 font-optima">
                                {inv.investmentName}
                              </p>
                              <p className="text-xs text-gray-500 font-nums">{inv.trackingNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-nums flex items-center justify-end gap-0.5 text-gray-900">
                            <DirhamIcon className="w-3 h-3 text-gray-500" />
                            {inv.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-blue-600 font-nums">
                            {inv.roi.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-emerald-600 font-nums">
                            {inv.annualReturn.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart3 className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-optima">No investments yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
