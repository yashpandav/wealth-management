/**
 * Client - Withdrawal Requests Tracking Page
 * View and track status of all withdrawal requests
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, Clock, CheckCircle, XCircle, AlertCircle, Eye, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';
import { WithdrawalStatus } from '@prisma/client';

interface WithdrawalRequest {
  id: string;
  trackingNumber: string;
  status: WithdrawalStatus;
  amount: number;
  bankName: string;
  reason: string | null;
  createdAt: string;
  rmProcessedAt: string | null;
  adminProcessedAt: string | null;
  rmNotes: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
}

interface ApiResponse {
  success: boolean;
  data?: {
    requests: WithdrawalRequest[];
  };
  error?: string;
}

export default function ClientWithdrawalRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<WithdrawalStatus | 'ALL'>('ALL');

  // Redirect if not authenticated or not CLIENT
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch withdrawal requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        selectedStatus === 'ALL'
          ? '/api/client/withdrawal-requests'
          : `/api/client/withdrawal-requests?status=${selectedStatus}`;

      const response = await fetch(url);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRequests(data.data.requests);
      } else {
        toast.error(data.error || 'Failed to fetch withdrawal requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      fetchRequests();
    }
  }, [status, session, selectedStatus, fetchRequests]);

  // Status badge component
  const StatusBadge = ({ status }: { status: WithdrawalStatus }) => {
    const variants: Record<
      WithdrawalStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }
    > = {
      PENDING: { variant: 'outline', icon: <Clock className="mr-1 h-3 w-3" />, label: 'Pending Review' },
      RM_REVIEW: { variant: 'secondary', icon: <AlertCircle className="mr-1 h-3 w-3" />, label: 'Under RM Review' },
      RM_APPROVED: { variant: 'default', icon: <ArrowRight className="mr-1 h-3 w-3" />, label: 'Pending Admin Approval' },
      RM_REJECTED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" />, label: 'Rejected by RM' },
      ADMIN_REVIEW: { variant: 'secondary', icon: <AlertCircle className="mr-1 h-3 w-3" />, label: 'Under Admin Review' },
      ADMIN_APPROVED: { variant: 'default', icon: <CheckCircle className="mr-1 h-3 w-3" />, label: 'Approved' },
      ADMIN_REJECTED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" />, label: 'Rejected' },
      COMPLETED: { variant: 'default', icon: <CheckCircle className="mr-1 h-3 w-3" />, label: 'Completed' },
      CANCELLED: { variant: 'outline', icon: <XCircle className="mr-1 h-3 w-3" />, label: 'Cancelled' },
    };

    const config = variants[status];

    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Progress indicator component
  const ProgressIndicator = ({ status }: { status: WithdrawalStatus }) => {
    const stages = [
      { key: 'PENDING', label: 'Submitted', statuses: ['PENDING'] },
      { key: 'RM', label: 'RM Review', statuses: ['RM_REVIEW', 'RM_APPROVED', 'RM_REJECTED'] },
      { key: 'ADMIN', label: 'Admin Review', statuses: ['ADMIN_REVIEW', 'ADMIN_APPROVED', 'ADMIN_REJECTED'] },
      { key: 'FINAL', label: 'Final', statuses: ['COMPLETED', 'CANCELLED'] },
    ];

    const getCurrentStage = () => {
      if (status === 'PENDING') return 0;
      if (['RM_REVIEW', 'RM_APPROVED', 'RM_REJECTED'].includes(status)) return 1;
      if (['ADMIN_REVIEW', 'ADMIN_APPROVED', 'ADMIN_REJECTED'].includes(status)) return 2;
      return 3;
    };

    const currentStage = getCurrentStage();
    const isRejected = status.includes('REJECTED');

    return (
      <div className="flex items-center gap-2">
        {stages.map((stage, index) => {
          const isActive = index === currentStage;
          const isCompleted = index < currentStage;
          const isCurrent = index <= currentStage;

          return (
            <div key={stage.key} className="flex items-center">
              <div
                className={`flex flex-col items-center ${isActive ? 'scale-110' : ''
                  } transition-transform`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${isRejected && isActive
                    ? 'bg-red-500 text-white'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-brand-blue/10 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isRejected && isActive ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-1 text-gray-600 text-center">{stage.label}</span>
              </div>
              {index < stages.length - 1 && (
                <div
                  className={`w-12 h-1 mx-1 ${isCurrent && index < currentStage ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Calculate summary statistics
  const pending = requests.filter((r) => r.status === WithdrawalStatus.PENDING).length;
  const inReview = requests.filter(
    (r) =>
      r.status === WithdrawalStatus.RM_REVIEW ||
      r.status === WithdrawalStatus.ADMIN_REVIEW ||
      r.status === WithdrawalStatus.RM_APPROVED
  ).length;
  const approved = requests.filter(
    (r) => r.status === WithdrawalStatus.ADMIN_APPROVED || r.status === WithdrawalStatus.COMPLETED
  ).length;
  const rejected = requests.filter(
    (r) => r.status === WithdrawalStatus.RM_REJECTED || r.status === WithdrawalStatus.ADMIN_REJECTED
  ).length;

  if (loading && requests.length === 0) {
    return <LoadingSpinner text="Loading withdrawal requests..." className="min-h-screen" />;
  }

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8 px-4 max-w-full sm:max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">My Withdrawal Requests</h1>
          <p className="font-georgia text-brand-grey mt-2">Track the status of your withdrawal requests</p>
        </div>
        <Button onClick={() => router.push('/client/withdraw')} className="font-optima">
          <Plus className="mr-2 h-4 w-4" />
          New Withdrawal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-orange-600">{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Review</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-brand-blue">{inReview}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-green-600">{approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-red-600">{rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Status Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'RM_REVIEW', 'RM_APPROVED', 'ADMIN_REVIEW', 'ADMIN_APPROVED', 'RM_REJECTED', 'ADMIN_REJECTED'].map(
              (status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus(status as WithdrawalStatus | 'ALL')}
                  size="sm"
                >
                  {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
                  {status !== 'ALL' && (
                    <span className="ml-2 text-xs">
                      ({requests.filter((r) => r.status === status).length})
                    </span>
                  )}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Withdrawal Requests</CardTitle>
            <CardDescription>
              {selectedStatus === 'ALL' ? 'All requests' : selectedStatus.replace(/_/g, ' ')}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="mb-4">No withdrawal requests found</p>
              <Button onClick={() => router.push('/client/withdraw')}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Your First Withdrawal Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Tracking Number</span>
                            <span className="font-mono text-sm font-semibold">
                              {request.trackingNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Amount</span>
                            <span className="text-2xl font-bold text-brand-blue">
                              ${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Bank</span>
                            <span className="text-sm font-medium">{request.bankName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Submitted</span>
                            <span className="text-sm">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div>
                          <StatusBadge status={request.status} />
                        </div>

                        {/* Notes/Rejection Reason */}
                        {request.rejectionReason && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-semibold text-red-800 mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-red-700">{request.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Progress */}
                      <div className="flex flex-col justify-center">
                        <p className="text-sm font-medium text-gray-700 mb-4">Request Progress</p>
                        <ProgressIndicator status={request.status} />

                        <div className="mt-6 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              router.push(`/client/withdrawal-requests/${request.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
