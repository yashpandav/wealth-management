/**
 * Client - Product Purchase Requests Page
 * View and track product purchase request status
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { RequestStatus } from '@prisma/client';
import { toast } from 'react-hot-toast';

interface ProductPurchaseRequest {
  id: string;
  trackingNumber: string;
  status: RequestStatus;
  amount: number;
  clientNotes: string | null;
  rmNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  contractDocumentId: string | null;
  contractDocument: {
    id: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
  } | null;
  investment: {
    id: string;
    name: string;
    currency: string;
  };
  investmentOption: {
    id: string;
    duration: string;
    withdrawalFrequency: string;
    roi: number;
    annualReturn: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    requests: ProductPurchaseRequest[];
  };
  error?: string;
}

function SearchParamsHandler({ router }: { router: ReturnType<typeof useRouter> }) {
  const searchParams = useSearchParams();

  // Check for new tracking number in URL
  useEffect(() => {
    const tracking = searchParams.get('tracking');
    if (tracking) {
      toast.success(`Request submitted! Tracking: ${tracking}`);
      // Remove the tracking param from URL
      router.replace('/client/product-requests');
    }
  }, [searchParams, router]);

  return null;
}

function ClientProductRequestsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ProductPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'ALL'>('ALL');

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch product purchase requests
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      fetchRequests();
    }
  }, [status, session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/product-requests');
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRequests(data.data.requests);
      } else {
        toast.error(data.error || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case RequestStatus.PROCESSING:
        return <RefreshCw className="h-5 w-5 text-brand-blue animate-spin" />;
      case RequestStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case RequestStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case RequestStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-700" />;
      case RequestStatus.CANCELLED:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants: Record<RequestStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      [RequestStatus.PENDING]: { variant: 'outline', label: 'Pending Review' },
      [RequestStatus.PROCESSING]: { variant: 'default', label: 'Processing' },
      [RequestStatus.APPROVED]: { variant: 'default', label: 'Approved' },
      [RequestStatus.REJECTED]: { variant: 'destructive', label: 'Rejected' },
      [RequestStatus.COMPLETED]: { variant: 'default', label: 'Completed' },
      [RequestStatus.CANCELLED]: { variant: 'secondary', label: 'Cancelled' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className="font-medium">
        {config.label}
      </Badge>
    );
  };

  const getStatusMessage = (request: ProductPurchaseRequest) => {
    switch (request.status) {
      case RequestStatus.PENDING:
        return 'Your request is awaiting review by your Relationship Manager.';
      case RequestStatus.PROCESSING:
        return 'Your request is being processed by your Relationship Manager.';
      case RequestStatus.APPROVED:
        return 'Your request has been approved! The investment will be processed shortly.';
      case RequestStatus.REJECTED:
        return request.rejectionReason
          ? `Request rejected: ${request.rejectionReason}`
          : 'Your request could not be approved. Please contact your Relationship Manager for details.';
      case RequestStatus.COMPLETED:
        return 'Your investment has been completed successfully.';
      case RequestStatus.CANCELLED:
        return 'This request was cancelled.';
      default:
        return '';
    }
  };

  const filteredRequests = selectedStatus === 'ALL'
    ? requests
    : requests.filter(req => req.status === selectedStatus);

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role === 'CLIENT' && loading)) {
    return (
      <div className="container mx-auto py-4 md:py-6 lg:py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'CLIENT')) {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler router={router} />
      </Suspense>
      <div className="container mx-auto py-4 md:py-6 lg:py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Plan Requests</h1>
            <p className="mt-2 text-muted-foreground">
              Track the status of your plan investment requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/client/products')} variant="default">
              Browse Plans
            </Button>
            <Button onClick={fetchRequests} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
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
            variant={selectedStatus === RequestStatus.PENDING ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(RequestStatus.PENDING)}
          >
            Pending ({requests.filter(r => r.status === RequestStatus.PENDING).length})
          </Button>
          <Button
            variant={selectedStatus === RequestStatus.PROCESSING ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(RequestStatus.PROCESSING)}
          >
            Processing ({requests.filter(r => r.status === RequestStatus.PROCESSING).length})
          </Button>
          <Button
            variant={selectedStatus === RequestStatus.APPROVED ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(RequestStatus.APPROVED)}
          >
            Approved ({requests.filter(r => r.status === RequestStatus.APPROVED).length})
          </Button>
          <Button
            variant={selectedStatus === RequestStatus.REJECTED ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(RequestStatus.REJECTED)}
          >
            Rejected ({requests.filter(r => r.status === RequestStatus.REJECTED).length})
          </Button>
        </div>

        {/* Requests List */}
        <div className="mt-8 space-y-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">
                  {selectedStatus === 'ALL'
                    ? 'No plan requests yet'
                    : `No ${selectedStatus.toLowerCase()} requests`}
                </p>
                <p className="mt-2 text-muted-foreground">
                  {selectedStatus === 'ALL'
                    ? 'Browse our plans and submit your first request'
                    : 'Try selecting a different status filter'}
                </p>
                {selectedStatus === 'ALL' && (
                  <Button
                    onClick={() => router.push('/client/products')}
                    className="mt-4"
                  >
                    Browse Plans
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <CardTitle className="text-xl">
                          {request.investment.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="font-mono">
                        Tracking: {request.trackingNumber}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Status Message */}
                  <div className={`rounded-lg p-4 mb-6 ${request.status === RequestStatus.APPROVED || request.status === RequestStatus.COMPLETED
                    ? 'bg-green-50 border border-green-200'
                    : request.status === RequestStatus.REJECTED
                      ? 'bg-red-50 border border-red-200'
                      : request.status === RequestStatus.PROCESSING
                        ? 'bg-brand-blue/10 border border-blue-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                    <p className={`text-sm font-medium ${request.status === RequestStatus.APPROVED || request.status === RequestStatus.COMPLETED
                      ? 'text-green-900'
                      : request.status === RequestStatus.REJECTED
                        ? 'text-red-900'
                        : request.status === RequestStatus.PROCESSING
                          ? 'text-blue-900'
                          : 'text-yellow-900'
                      }`}>
                      {getStatusMessage(request)}
                    </p>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Investment Amount</p>
                      <p className="mt-1 text-2xl font-bold">
                        {request.investment.currency} {request.amount.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <p className="mt-1 text-xl font-semibold">
                        {request.investmentOption.duration}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Withdrawal</p>
                      <p className="mt-1 text-xl font-semibold">
                        {request.investmentOption.withdrawalFrequency}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Annual Return</p>
                      <p className="mt-1 text-xl font-bold text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-5 w-5" />
                        {request.investmentOption.annualReturn}%
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* ROI Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">ROI per period:</span>
                    <Badge variant="secondary">{request.investmentOption.roi}%</Badge>
                  </div>

                  {/* Timeline */}
                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-medium">Request Timeline</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-brand-blue" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Submitted</p>
                          <p className="text-muted-foreground">
                            {new Date(request.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {request.processedAt && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <div className={`h-2 w-2 rounded-full ${request.status === RequestStatus.APPROVED || request.status === RequestStatus.COMPLETED
                              ? 'bg-green-600'
                              : request.status === RequestStatus.REJECTED
                                ? 'bg-red-600'
                                : 'bg-brand-blue'
                              }`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {request.status === RequestStatus.APPROVED || request.status === RequestStatus.COMPLETED
                                ? 'Approved'
                                : request.status === RequestStatus.REJECTED
                                  ? 'Rejected'
                                  : 'Processed'}
                            </p>
                            <p className="text-muted-foreground">
                              {new Date(request.processedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {request.status === RequestStatus.PENDING && (
                        <div className="flex items-start gap-3 opacity-50">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <div className="h-2 w-2 rounded-full border-2 border-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Awaiting RM Review</p>
                            <p className="text-muted-foreground">Pending</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Notes */}
                  {request.clientNotes && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <p className="text-sm font-medium mb-2">Your Notes</p>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {request.clientNotes}
                        </p>
                      </div>
                    </>
                  )}

                  {/* RM Notes (for rejected requests) */}
                  {request.rmNotes && request.status === RequestStatus.REJECTED && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <p className="text-sm font-medium mb-2">RM Feedback</p>
                        <p className="text-sm text-muted-foreground bg-red-50 border border-red-200 p-3 rounded-md">
                          {request.rmNotes}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function ClientProductRequestsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-4 md:py-6 lg:py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    }>
      <ClientProductRequestsContent />
    </Suspense>
  );
}
