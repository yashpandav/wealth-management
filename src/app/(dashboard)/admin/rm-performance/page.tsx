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
import { Users, TrendingUp, CheckCircle, XCircle, Award } from 'lucide-react';
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
  yearsOfExperience: number | null;
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
  withdrawalRequests: {
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
  const [sortBy, setSortBy] = useState<'name' | 'clients' | 'aum' | 'approval'>('aum');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Redirect if not authenticated or not ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch RM performance data
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

  // Sort RMs
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
      case 'aum':
        aValue = a.aum.total;
        bValue = b.aum.total;
        break;
      case 'approval':
        aValue = (a.purchaseRequests.approvalRate + a.withdrawalRequests.approvalRate) / 2;
        bValue = (b.purchaseRequests.approvalRate + b.withdrawalRequests.approvalRate) / 2;
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

  // Calculate overall statistics
  const totalRMs = rms.length;
  const totalClients = rms.reduce((sum, rm) => sum + rm.clients.total, 0);
  const totalAUM = rms.reduce((sum, rm) => sum + rm.aum.total, 0);
  const avgClientsPerRM = totalRMs > 0 ? totalClients / totalRMs : 0;



  return (
    <div className="container px-8 py-8">
      <div className="mb-8">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue mb-2">RM Performance Dashboard</h1>
        <p className="font-georgia text-brand-grey">
          Comprehensive performance metrics for all Relationship Managers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total RMs</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-brand-blue font-nums">{totalRMs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Clients</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-green-600 font-nums">{totalClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Investment Amount</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-purple-600 flex items-center">
              <DirhamIcon className="h-6 w-6 mr-1" />
              <span className="font-nums">{(totalAUM / 1000000).toFixed(1)}M</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Clients/RM</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-orange-600 font-nums">
              {avgClientsPerRM.toFixed(1)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sort Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sort By</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'name', label: 'Name' },
              { key: 'clients', label: 'Client Count' },
              { key: 'aum', label: 'Total Investment Amount' },
              { key: 'approval', label: 'Approval Rate' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  if (sortBy === option.key) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(option.key as 'name' | 'clients' | 'aum' | 'approval');
                    setSortOrder('desc');
                  }
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortBy === option.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
              >
                {option.label}
                {sortBy === option.key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance Metrics</CardTitle>
          <CardDescription>Click column headers to sort</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12">
              <LoadingSpinner text="Searching..." />
            </div>
          ) : rms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No Relationship Managers found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedRMs.map((rm) => {
                const isPositiveGain = rm.aum.gainLoss >= 0;
                const avgApprovalRate =
                  (rm.purchaseRequests.approvalRate + rm.withdrawalRequests.approvalRate) / 2;

                return (
                  <Card key={rm.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {rm.user.firstName} {rm.user.lastName}
                            {rm.yearsOfExperience && (
                              <Badge variant="secondary" className="ml-2">
                                <Award className="mr-1 h-3 w-3" />
                                <span className="font-nums">{rm.yearsOfExperience}</span> years
                              </Badge>
                            )}
                            <Badge
                              variant={rm.user.status === 'ACTIVE' ? 'default' : 'secondary'}
                            >
                              {rm.user.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {rm.user.email}
                            {rm.specialization && ` • ${rm.specialization}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Client Metrics */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Client Metrics
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Clients:</span>
                              <span className="font-semibold font-nums">{rm.clients.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Active Clients:</span>
                              <span className="font-semibold font-nums">{rm.clients.active}</span>
                            </div>
                            {rm.maxClientLimit && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Capacity:</span>
                                <span className="font-semibold">
                                  <span className="font-nums">{rm.clients.utilization.toFixed(0)}%</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* AUM Metrics */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                            <DirhamIcon className="h-4 w-4" />
                            Investment Amount
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Investment Amount:</span>
                              <span className="font-semibold flex items-center">
                                <DirhamIcon className="h-3 w-3 mr-1" />
                                <span className="font-nums">{rm.aum.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg per Client:</span>
                              <span className="font-semibold flex items-center">
                                <DirhamIcon className="h-3 w-3 mr-1" />
                                <span className="font-nums">{rm.aum.avgPerClient.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gain/Loss:</span>
                              <span
                                className={`font-semibold flex items-center ${isPositiveGain ? 'text-green-600' : 'text-red-600'
                                  }`}
                              >
                                {isPositiveGain ? '+' : ''}
                                <DirhamIcon className="h-3 w-3 mx-1" />
                                <span className="font-nums">{rm.aum.gainLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Request Metrics */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Request Performance
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Investment Approved:</span>
                              <span className="font-semibold text-green-600">
                                <span className="font-nums">{rm.purchaseRequests.approved}/{rm.purchaseRequests.total}</span>
                                {rm.purchaseRequests.total > 0 && (
                                  <span className="ml-1 text-xs font-nums">
                                    ({rm.purchaseRequests.approvalRate.toFixed(0)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Withdrawal Approved:</span>
                              <span className="font-semibold text-green-600">
                                <span className="font-nums">{rm.withdrawalRequests.approved}/{rm.withdrawalRequests.total}</span>
                                {rm.withdrawalRequests.total > 0 && (
                                  <span className="ml-1 text-xs font-nums">
                                    ({rm.withdrawalRequests.approvalRate.toFixed(0)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pending Actions:</span>
                              <span className="font-semibold text-orange-600 font-nums">
                                {rm.purchaseRequests.pending + rm.withdrawalRequests.pending}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Overall Performance Badge */}
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-gray-600">Overall Performance:</span>
                        <Badge
                          variant={
                            avgApprovalRate >= 80
                              ? 'default'
                              : avgApprovalRate >= 60
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="text-sm"
                        >
                          {avgApprovalRate >= 80 ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          <span className="font-nums">{avgApprovalRate.toFixed(1)}%</span> Approval Rate
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
