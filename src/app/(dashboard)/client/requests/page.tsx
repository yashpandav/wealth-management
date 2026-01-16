/**
 * Client - Investment Requests Page
 * View and track purchase request status
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  Hourglass,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RequestStatus } from '@prisma/client';
import { toast } from 'react-hot-toast';

interface PurchaseRequest {
  type: 'INSTRUMENT';
  id: string;
  trackingNumber: string;
  status: RequestStatus;
  amount: number;
  quantity: number | null;
  requestedPrice: number | null;
  clientNotes: string | null;
  rmNotes: string | null;
  bankStatementRef: string | null;
  paymentProof: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  instrument: {
    id: string;
    symbol: string;
    name: string;
    type: string;
    currency: string;
    currentPrice: number;
  };
}

interface ProductPurchaseRequest {
  type: 'PRODUCT';
  id: string;
  trackingNumber: string;
  status: RequestStatus;
  amount: number;
  clientNotes: string | null;
  rmNotes: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  contractDocumentId: string | null;
  isWaitingForContract?: boolean;
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

type AnyRequest = PurchaseRequest | ProductPurchaseRequest;

export default function ClientRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<AnyRequest[]>([]);
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

  // Fetch purchase requests
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      fetchRequests();
    }
  }, [status, session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [purchaseRes, productRes] = await Promise.all([
        fetch('/api/client/purchase-requests'),
        fetch('/api/client/product-requests')
      ]);

      const purchaseData = await purchaseRes.json();
      const productData = await productRes.json();

      let allRequests: AnyRequest[] = [];

      if (purchaseData.success && purchaseData.data?.requests) {
        const instrumentRequests = purchaseData.data.requests.map((req: Omit<PurchaseRequest, 'type'>) => ({
          ...req,
          type: 'INSTRUMENT' as const,
        }));
        allRequests = [...allRequests, ...instrumentRequests];
      }

      if (productData.success && productData.data?.requests) {
        const productRequests = productData.data.requests.map((req: Omit<ProductPurchaseRequest, 'type' | 'isWaitingForContract'>) => {
          let requestStatus = req.status;
          let isWaitingForContract = false;

          // If request is approved but no contract document yet, show as PROCESSING
          if (requestStatus === 'APPROVED' && !req.contractDocumentId) {
            requestStatus = 'PROCESSING' as RequestStatus;
            isWaitingForContract = true;
          }

          return {
            ...req,
            type: 'PRODUCT' as const,
            status: requestStatus,
            isWaitingForContract
          };
        });
        allRequests = [...allRequests, ...productRequests];
      }

      // Sort by createdAt desc
      allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRequests(allRequests);

      if (!purchaseData.success && !productData.success) {
        toast.error('Failed to fetch requests');
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
        return <Hourglass className="h-5 w-5 text-brand-blue" />;
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

  const getStatusMessage = (request: AnyRequest) => {
    switch (request.status) {
      case RequestStatus.PENDING:
        return 'Your request is awaiting review by your Relationship Manager.';
      case RequestStatus.PROCESSING:
        if (request.type === 'PRODUCT' && request.isWaitingForContract) {
          return 'Your request has been approved by your Relationship Manager. Initial contract is being prepared.';
        }
        return 'Your request is being processed by your Relationship Manager.';
      case RequestStatus.APPROVED:
        return 'Your request has been approved! The transaction will be completed shortly.';
      case RequestStatus.REJECTED:
        return request.rmNotes
          ? `Request rejected: ${request.rmNotes}`
          : 'Your request could not be approved. Please contact your Relationship Manager for details.';
      case RequestStatus.COMPLETED:
        return 'Transaction completed successfully. Check your portfolio for updated holdings.';
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
    return <LoadingSpinner text="Loading purchase requests..." className="min-h-screen" />;
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'CLIENT')) {
    return null;
  }

  return (
    <div className="container px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">My Investment Requests</h1>
          <p className="font-georgia text-brand-grey mt-2">
            Track the status of your investment requests
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm" className="font-optima">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
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
      <div className="space-y-5">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">
                {selectedStatus === 'ALL'
                  ? 'No investment requests yet'
                  : `No ${selectedStatus.toLowerCase()} requests`}
              </p>
              <p className="mt-2 text-muted-foreground">
                {selectedStatus === 'ALL'
                  ? 'Submit your first investment request to start investing'
                  : 'Try selecting a different status filter'}
              </p>
              {selectedStatus === 'ALL' && (
                <div className="flex justify-center gap-4 mt-4">

                  <Button onClick={() => router.push('/client/products')}>
                    Browse Plans
                  </Button>
                </div>
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
                        {request.type === 'INSTRUMENT'
                          ? `${request.instrument.symbol} - ${request.instrument.name}`
                          : `${request.investment.name}`
                        }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Investment Amount</p>
                    <p className="mt-1 text-2xl font-bold font-nums">
                      {request.type === 'INSTRUMENT' ? request.instrument.currency : request.investment.currency} {request.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {request.type === 'INSTRUMENT' && request.quantity && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                      <p className="mt-1 text-2xl font-bold">
                        {request.quantity.toLocaleString('en-US', {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        })}
                      </p>
                    </div>
                  )}

                  {request.type === 'INSTRUMENT' && request.requestedPrice && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Requested Price</p>
                      <p className="mt-1 text-2xl font-bold">
                        {request.instrument.currency} {request.requestedPrice.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}

                  {request.type === 'PRODUCT' && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Plan Details</p>
                        <div className="mt-1">
                          <Badge variant="outline" className="mr-2">{request.investmentOption.duration}</Badge>
                          <Badge variant="outline">{request.investmentOption.withdrawalFrequency}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Projected Return</p>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-xl font-bold text-green-600 font-nums">{request.investmentOption.annualReturn}%</span>
                          <span className="text-sm text-muted-foreground ml-1">Annual</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Timeline */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Request Timeline</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-brand-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Submitted</p>
                        <p className="text-muted-foreground font-nums">
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
                          <p className="text-muted-foreground font-nums">
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
  );
}
