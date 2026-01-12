/**
 * Admin - Investment Requests Dashboard
 * View and monitor all investment requests across the platform
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
import { RefreshCw, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RequestStatus } from '@prisma/client';

interface PurchaseRequest {
  id: string;
  trackingNumber: string;
  status: RequestStatus;
  amount: number;
  quantity: number | null;
  createdAt: string;
  processedAt: string | null;
  client: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    relationshipManager: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  };
  instrument: {
    symbol: string;
    name: string;
    type: string;
    currentPrice: number;
    currency: string;
  };
  processedBy: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

interface ApiResponse {
  success: boolean;
  data?: {
    requests: PurchaseRequest[];
  };
  error?: string;
}

export default function AdminPurchaseRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'ALL'>('ALL');

  // Redirect if not authenticated or not ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch purchase requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        selectedStatus === 'ALL'
          ? '/api/admin/purchase-requests'
          : `/api/admin/purchase-requests?status=${selectedStatus}`;

      const response = await fetch(url);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRequests(data.data.requests);
      } else {
        toast.error(data.error || 'Failed to fetch investment requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch investment requests');
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
  const StatusBadge = ({ status }: { status: RequestStatus }) => {
    const config: Record<RequestStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      PENDING: { variant: 'outline', icon: <Clock className="mr-1 h-3 w-3" /> },
      PROCESSING: { variant: 'secondary', icon: <AlertCircle className="mr-1 h-3 w-3" /> },
      APPROVED: { variant: 'default', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
      REJECTED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" /> },
      COMPLETED: { variant: 'default', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
      CANCELLED: { variant: 'outline', icon: <XCircle className="mr-1 h-3 w-3" /> },
    };

    const { variant, icon } = config[status];

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {status}
      </Badge>
    );
  };

  // Calculate summary statistics
  const pending = requests.filter((r) => r.status === RequestStatus.PENDING).length;
  const processing = requests.filter((r) => r.status === RequestStatus.PROCESSING).length;
  const approved = requests.filter((r) => r.status === RequestStatus.APPROVED).length;
  const rejected = requests.filter((r) => r.status === RequestStatus.REJECTED).length;



  return (
    <div className="container px-8 py-8">
      <div className="mb-8">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue mb-2">Investment Requests - Admin</h1>
        <p className="font-georgia text-brand-grey">
          Monitor all investment requests across the platform
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-yellow-600">{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-brand-blue">{processing}</CardTitle>
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
            {['ALL', 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED'].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                onClick={() => setSelectedStatus(status as RequestStatus | 'ALL')}
                size="sm"
              >
                {status}
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
            <CardTitle>All Investment Requests</CardTitle>
            <CardDescription>
              {selectedStatus === 'ALL' ? 'All statuses' : selectedStatus}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>RM</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Searching...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                      <p>No investment requests found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
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
                      <div>
                        <div className="font-medium">{request.instrument.symbol}</div>
                        <div className="text-sm text-gray-500">{request.instrument.name}</div>
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
                      {request.instrument.currency} {request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.quantity ? request.quantity.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/purchase-requests/${request.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
