/**
 * Admin - RM Performance Dashboard
 * View performance metrics and statistics for all Relationship Managers
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, RefreshCw, ArrowUpDown } from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface RMPerformance {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    status: string;
    createdAt: string;
  };
  specialization: string | null;
  maxClientLimit: number | null;
  clients: {
    total: number;
    active: number;
    utilization: number;
  };
  aum: {
    total: number;
    invested: number;
    gainLoss: number;
    avgPerClient: number;
  };
  purchaseRequests: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approvalRate: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    rms: RMPerformance[];
  };
  error?: string;
}

export default function RMPerformancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rms, setRMs] = useState<RMPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'clients' | 'investment' | 'approval'>('investment');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/rm-performance');
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRMs(data.data.rms);
      } else {
        toast.error(data.error || 'Failed to fetch RM performance data');
      }
    } catch (error) {
      console.error('Error fetching RM performance:', error);
      toast.error('Failed to fetch RM performance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchPerformance();
    }
  }, [status, session, fetchPerformance]);

  const sortedRMs = [...rms].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case 'name':
        aValue = a.user.firstName.localeCompare(b.user.firstName);
        bValue = 0;
        break;
      case 'clients':
        aValue = a.clients.total;
        bValue = b.clients.total;
        break;
      case 'investment':
        aValue = a.aum.total;
        bValue = b.aum.total;
        break;
      case 'approval':
        aValue = a.purchaseRequests.approvalRate;
        bValue = b.purchaseRequests.approvalRate;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    if (sortBy === 'name') {
      return sortOrder === 'asc' ? aValue : -aValue;
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const totalRMs = rms.length;
  const activeRMs = rms.filter((rm) => rm.user.status === 'ACTIVE').length;
  const totalClients = rms.reduce((sum, rm) => sum + rm.clients.total, 0);
  const totalInvestment = rms.reduce((sum, rm) => sum + rm.aum.total, 0);
  const avgApprovalRate =
    rms.length > 0
      ? rms.reduce((sum, rm) => sum + rm.purchaseRequests.approvalRate, 0) / rms.length
      : 0;

  const handleSort = (field: 'name' | 'clients' | 'investment' | 'approval') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading performance data..." />
      </div>
    );
  }

  return (
    <div className="container px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">
              RM Performance Dashboard
            </h1>
            <p className="font-georgia mt-2 text-brand-grey">
              Performance metrics and statistics for all Relationship Managers
            </p>
          </div>
          <Button onClick={fetchPerformance} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm">Total Relationship Managers</CardDescription>
            <CardTitle className="text-3xl text-brand-blue font-nums">{totalRMs}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {activeRMs} Active • {totalRMs - activeRMs} Inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm">Total Clients Managed</CardDescription>
            <CardTitle className="text-3xl text-brand-blue font-nums">{totalClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Avg: {totalRMs > 0 ? (totalClients / totalRMs).toFixed(1) : 0} per RM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm">Total Investment Amount</CardDescription>
            <div className="flex items-center">
              <DirhamIcon className="h-6 w-6 mr-1 text-brand-blue" />
              <CardTitle className="text-3xl text-brand-blue font-nums">
                {(totalInvestment / 1000000).toFixed(1)}M
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-600">
              <span>Avg per RM:</span>
              <DirhamIcon className="h-3 w-3 mx-1" />
              <span className="font-nums">
                {totalRMs > 0 ? ((totalInvestment / totalRMs) / 1000000).toFixed(1) : 0}M
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm">Average Approval Rate</CardDescription>
            <CardTitle className="text-3xl text-brand-blue font-nums">
              {avgApprovalRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Across all Relationship Managers</p>
          </CardContent>
        </Card>
      </div>

      {/* Sort Controls */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <CardTitle className="text-base">Sort By</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'name', label: 'Name' },
              { key: 'clients', label: 'Client Count' },
              { key: 'investment', label: 'Investment Amount' },
              { key: 'approval', label: 'Approval Rate' },
            ].map((option) => (
              <Button
                key={option.key}
                onClick={() => handleSort(option.key as 'name' | 'clients' | 'investment' | 'approval')}
                variant={sortBy === option.key ? 'default' : 'outline'}
                size="sm"
              >
                {option.label}
                {sortBy === option.key && (
                  <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RM Performance List */}
      {rms.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No Relationship Managers found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedRMs.map((rm) => (
            <Card key={rm.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {rm.user.firstName} {rm.user.lastName}
                      </CardTitle>
                      <Badge variant={rm.user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {rm.user.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{rm.user.email}</span>
                      {rm.user.phone && <span>{rm.user.phone}</span>}
                      {rm.specialization && (
                        <span className="text-brand-blue">• {rm.specialization}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Performance Score</div>
                    <div className="text-2xl font-bold text-brand-blue font-nums">
                      {rm.purchaseRequests.approvalRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Client Metrics */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Client Metrics
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Clients:</span>
                        <span className="font-semibold font-nums">{rm.clients.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active Clients:</span>
                        <span className="font-semibold font-nums">{rm.clients.active}</span>
                      </div>
                      {rm.maxClientLimit && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Capacity:</span>
                          <span className="font-semibold font-nums">
                            {rm.clients.utilization.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Investment Metrics */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <DirhamIcon className="h-4 w-4" />
                      Investment Metrics
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Amount:</span>
                        <div className="flex items-center font-semibold">
                          <DirhamIcon className="h-3 w-3 mr-1" />
                          <span className="font-nums">
                            {rm.aum.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg per Client:</span>
                        <div className="flex items-center font-semibold">
                          <DirhamIcon className="h-3 w-3 mr-1" />
                          <span className="font-nums">
                            {rm.aum.avgPerClient.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Gain/Loss:</span>
                        <div
                          className={`flex items-center font-semibold ${
                            rm.aum.gainLoss >= 0 ? 'text-brand-blue' : 'text-gray-600'
                          }`}
                        >
                          {rm.aum.gainLoss >= 0 ? '+' : ''}
                          <DirhamIcon className="h-3 w-3 mx-1" />
                          <span className="font-nums">
                            {rm.aum.gainLoss.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Performance */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Request Performance
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Requests:</span>
                        <span className="font-semibold font-nums">
                          {rm.purchaseRequests.total}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Approved:</span>
                        <span className="font-semibold font-nums">
                          {rm.purchaseRequests.approved}
                          {rm.purchaseRequests.total > 0 && (
                            <span className="text-gray-500 ml-1">
                              ({rm.purchaseRequests.approvalRate.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-semibold font-nums">
                          {rm.purchaseRequests.pending}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Rejected:</span>
                        <span className="font-semibold font-nums">
                          {rm.purchaseRequests.rejected}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
