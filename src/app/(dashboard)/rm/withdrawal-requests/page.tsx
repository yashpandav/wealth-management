/**
 * RM - Withdrawal Requests Dashboard
 * View and manage withdrawal requests from assigned clients
 */

'use client';

import { useEffect, useState } from 'react';
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
import { RefreshCw, Eye, Clock, CheckCircle, XCircle, AlertCircle, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { WithdrawalStatus } from '@prisma/client';

interface WithdrawalRequest {
  id: string;
  trackingNumber: string;
  status: WithdrawalStatus;
  amount: number;
  createdAt: string;
  client: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    portfolio: {
      totalValue: number;
    } | null;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    requests: WithdrawalRequest[];
  };
  error?: string;
}

export default function RMWithdrawalRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<WithdrawalStatus | 'ALL'>('ALL');

  // Redirect if not authenticated or not RM
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'RM') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch withdrawal requests
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'RM') {
      fetchRequests();
    }
  }, [status, session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rm/withdrawal-requests');
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
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    const configs: Record<
      WithdrawalStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }
    > = {
      [WithdrawalStatus.PENDING]: {
        variant: 'outline',
        label: 'Pending Review',
        icon: <Clock className="h-3 w-3" />,
      },
      [WithdrawalStatus.RM_REVIEW]: {
        variant: 'default',
        label: 'Under Review',
        icon: <AlertCircle className="h-3 w-3" />,
      },
      [WithdrawalStatus.RM_APPROVED]: {
        variant: 'default',
        label: 'RM Approved',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      [WithdrawalStatus.RM_REJECTED]: {
        variant: 'destructive',
        label: 'RM Rejected',
        icon: <XCircle className="h-3 w-3" />,
      },
      [WithdrawalStatus.ADMIN_REVIEW]: {
        variant: 'default',
        label: 'Admin Review',
        icon: <AlertCircle className="h-3 w-3" />,
      },
      [WithdrawalStatus.ADMIN_APPROVED]: {
        variant: 'default',
        label: 'Approved',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      [WithdrawalStatus.ADMIN_REJECTED]: {
        variant: 'destructive',
        label: 'Rejected',
        icon: <XCircle className="h-3 w-3" />,
      },
      [WithdrawalStatus.COMPLETED]: {
        variant: 'default',
        label: 'Completed',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      [WithdrawalStatus.CANCELLED]: {
        variant: 'secondary',
        label: 'Cancelled',
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = configs[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 font-medium">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const filteredRequests = selectedStatus === 'ALL'
    ? requests
    : requests.filter((req) => req.status === selectedStatus);

  const pendingCount = requests.filter((r) => r.status === WithdrawalStatus.PENDING).length;
  const reviewCount = requests.filter((r) => r.status === WithdrawalStatus.RM_REVIEW).length;
  const approvedCount = requests.filter((r) => r.status === WithdrawalStatus.RM_APPROVED).length;

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role === 'RM' && loading)) {
    return (
      <div className="container mx-auto py-4 md:py-6 lg:py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'RM')) {
    return null;
  }

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
          <p className="mt-2 text-muted-foreground">
            Review and process withdrawal requests from your assigned clients
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting RM action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewCount}</div>
            <p className="text-xs text-muted-foreground">Currently reviewing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommended for Approval</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('ALL')}
        >
          All ({requests.length})
        </Button>
        <Button
          variant={selectedStatus === WithdrawalStatus.PENDING ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus(WithdrawalStatus.PENDING)}
        >
          Pending ({requests.filter((r) => r.status === WithdrawalStatus.PENDING).length})
        </Button>
        <Button
          variant={selectedStatus === WithdrawalStatus.RM_REVIEW ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus(WithdrawalStatus.RM_REVIEW)}
        >
          Under Review ({requests.filter((r) => r.status === WithdrawalStatus.RM_REVIEW).length})
        </Button>
        <Button
          variant={selectedStatus === WithdrawalStatus.RM_APPROVED ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus(WithdrawalStatus.RM_APPROVED)}
        >
          Approved ({requests.filter((r) => r.status === WithdrawalStatus.RM_APPROVED).length})
        </Button>
      </div>

      {/* Requests Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">
                {selectedStatus === 'ALL'
                  ? 'No withdrawal requests found'
                  : `No ${selectedStatus.toLowerCase().replace('_', ' ')} requests`}
              </p>
              <p className="mt-2 text-muted-foreground">
                Requests from your assigned clients will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Portfolio Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">
                        {request.trackingNumber}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {request.client.user.firstName} {request.client.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.client.user.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${request.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        {request.client.portfolio ? (
                          <span className="text-sm">
                            ${request.client.portfolio.totalValue.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/rm/withdrawal-requests/${request.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
