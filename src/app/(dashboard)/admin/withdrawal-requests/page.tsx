/**
 * Admin - Withdrawal Requests Dashboard
 * View and approve/reject withdrawal requests with RM recommendations
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Shield, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';
import { WithdrawalStatus } from '@prisma/client';

interface WithdrawalRequest {
  id: string;
  trackingNumber: string;
  status: WithdrawalStatus;
  amount: number;
  createdAt: string;
  rmProcessedAt: string | null;
  client: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    portfolio: {
      totalValue: number;
    } | null;
    relationshipManager: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  };
  processedByRM: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

interface ApiResponse {
  success: boolean;
  data?: {
    requests: WithdrawalRequest[];
  };
  error?: string;
}

export default function AdminWithdrawalRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<WithdrawalStatus | 'ALL'>('ALL');

  // Redirect if not authenticated or not ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch withdrawal requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        selectedStatus === 'ALL'
          ? '/api/admin/withdrawal-requests'
          : `/api/admin/withdrawal-requests?status=${selectedStatus}`;

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
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchRequests();
    }
  }, [status, session, selectedStatus, fetchRequests]);

  // Status badge component
  const StatusBadge = ({ status }: { status: WithdrawalStatus }) => {
    const variants: Record<
      WithdrawalStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
    > = {
      PENDING: { variant: 'outline', icon: <Clock className="mr-1 h-3 w-3" /> },
      RM_REVIEW: { variant: 'secondary', icon: <AlertCircle className="mr-1 h-3 w-3" /> },
      RM_APPROVED: { variant: 'default', icon: <Shield className="mr-1 h-3 w-3" /> },
      RM_REJECTED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" /> },
      ADMIN_REVIEW: { variant: 'secondary', icon: <Shield className="mr-1 h-3 w-3" /> },
      ADMIN_APPROVED: { variant: 'default', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
      ADMIN_REJECTED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" /> },
      COMPLETED: { variant: 'default', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
      CANCELLED: { variant: 'outline', icon: <XCircle className="mr-1 h-3 w-3" /> },
    };

    const config = variants[status];

    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  // Calculate summary statistics
  const pendingApproval = requests.filter(
    (r) => r.status === WithdrawalStatus.RM_APPROVED || r.status === WithdrawalStatus.ADMIN_REVIEW
  ).length;
  const underReview = requests.filter((r) => r.status === WithdrawalStatus.ADMIN_REVIEW).length;
  const approved = requests.filter((r) => r.status === WithdrawalStatus.ADMIN_APPROVED).length;
  const rejected = requests.filter((r) => r.status === WithdrawalStatus.ADMIN_REJECTED).length;

  if (loading && requests.length === 0) {
    return <LoadingSpinner text="Loading withdrawal requests..." className="min-h-screen" />;
  }

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8 max-w-full sm:max-w-7xl">
      <div className="mb-8">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue mb-2">Withdrawal Requests - Admin</h1>
        <p className="font-georgia text-brand-grey">
          Review and approve withdrawal requests recommended by Relationship Managers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-orange-600">{pendingApproval}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Under Review</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-brand-blue">{underReview}</CardTitle>
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
            {[
              'ALL',
              'RM_APPROVED',
              'ADMIN_REVIEW',
              'ADMIN_APPROVED',
              'ADMIN_REJECTED',
              'RM_REJECTED',
            ].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                onClick={() => setSelectedStatus(status as WithdrawalStatus | 'ALL')}
                size="sm"
              >
                {status.replace(/_/g, ' ')}
                {status !== 'ALL' && (
                  <span className="ml-2 text-xs">
                    ({requests.filter((r) => r.status === status).length})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Withdrawal Requests</CardTitle>
            <CardDescription>
              {selectedStatus === 'ALL' ? 'All statuses' : selectedStatus.replace(/_/g, ' ')}
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
              <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No withdrawal requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Relationship Manager</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Portfolio Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">{request.trackingNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {request.client.user.firstName} {request.client.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{request.client.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.client.relationshipManager ? (
                        <div className="text-sm">
                          {request.client.relationshipManager.user.firstName}{' '}
                          {request.client.relationshipManager.user.lastName}
                        </div>
                      ) : (
                        <span className="text-gray-400">No RM</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.client.portfolio ? (
                        `$${request.client.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/withdrawal-requests/${request.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
