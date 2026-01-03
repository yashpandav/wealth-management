/**
 * Admin - Purchase Request Detail Page
 * View detailed information about a specific purchase request
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Package,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RequestStatus } from '@prisma/client';

interface PurchaseRequestDetail {
  id: string;
  trackingNumber: string;
  status: RequestStatus;
  amount: number;
  quantity: number | null;
  requestedPrice: number | null;
  bankStatementRef: string | null;
  paymentProof: string | null;
  rmNotes: string | null;
  clientNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  processedAt: string | null;
  client: {
    id: string;
    kycVerified: boolean;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
    portfolio: {
      totalValue: number;
      totalInvested: number;
    } | null;
    relationshipManager: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    } | null;
  };
  instrument: {
    symbol: string;
    name: string;
    type: string;
    currentPrice: number;
    currency: string;
    description: string | null;
    riskRating: string | null;
  };
  processedBy: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
}

interface ApiResponse {
  success: boolean;
  data?: {
    request: PurchaseRequestDetail;
  };
  error?: string;
}

export default function AdminPurchaseRequestDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<PurchaseRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or not ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch request details
  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/purchase-requests/${requestId}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRequest(data.data.request);
      } else {
        toast.error(data.error || 'Failed to fetch request details');
        router.push('/admin/purchase-requests');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to fetch request details');
      router.push('/admin/purchase-requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN' && requestId) {
      fetchRequestDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, requestId]);

  // Status badge component
  const StatusBadge = ({ status }: { status: RequestStatus }) => {
    const config: Record<RequestStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      PENDING: { variant: 'outline', icon: <Clock className="mr-1 h-3 w-3" /> },
      PROCESSING: { variant: 'secondary', icon: <Shield className="mr-1 h-3 w-3" /> },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const totalCost = request.quantity && request.requestedPrice
    ? request.quantity * request.requestedPrice
    : request.amount;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Requests
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Request Details</h1>
            <p className="text-gray-600">Tracking Number: {request.trackingNumber}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client & Instrument Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instrument Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Instrument Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Symbol</p>
                  <p className="text-lg font-semibold">{request.instrument.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-semibold">{request.instrument.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-lg">{request.instrument.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="text-lg font-semibold">
                    {request.instrument.currency} {request.instrument.currentPrice.toFixed(2)}
                  </p>
                </div>
                {request.instrument.riskRating && (
                  <div>
                    <p className="text-sm text-gray-600">Risk Rating</p>
                    <Badge variant={request.instrument.riskRating === 'HIGH' ? 'destructive' : 'default'}>
                      {request.instrument.riskRating}
                    </Badge>
                  </div>
                )}
              </div>
              {request.instrument.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-sm mt-1">{request.instrument.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Purchase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Purchase Amount</p>
                  <p className="text-2xl font-bold">
                    {request.instrument.currency} {request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {request.quantity && (
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="text-2xl font-bold">{request.quantity.toLocaleString()}</p>
                  </div>
                )}
                {request.requestedPrice && (
                  <div>
                    <p className="text-sm text-gray-600">Requested Price</p>
                    <p className="text-lg font-semibold">
                      {request.instrument.currency} {request.requestedPrice.toFixed(2)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-lg font-semibold">
                    {request.instrument.currency} {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Client Notes */}
              {request.clientNotes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-1">Client Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{request.clientNotes}</p>
                </div>
              )}

              {/* RM Notes */}
              {request.rmNotes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-1">RM Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{request.rmNotes}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {request.rejectionReason && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-red-700 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{request.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Details */}
          {(request.bankStatementRef || request.paymentProof) && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.bankStatementRef && (
                  <div>
                    <p className="text-sm text-gray-600">Bank Statement Reference</p>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{request.bankStatementRef}</p>
                  </div>
                )}
                {request.paymentProof && (
                  <div>
                    <p className="text-sm text-gray-600">Payment Proof</p>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{request.paymentProof}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Client & Timeline */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold">
                  {request.client.user.firstName} {request.client.user.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${request.client.user.email}`} className="text-brand-blue hover:underline">
                  {request.client.user.email}
                </a>
              </div>
              {request.client.user.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <a href={`tel:${request.client.user.phone}`} className="text-brand-blue hover:underline">
                    {request.client.user.phone}
                  </a>
                </div>
              )}
              <div className="pt-3 border-t">
                <Badge variant={request.client.kycVerified ? 'default' : 'secondary'}>
                  {request.client.kycVerified ? 'KYC Verified' : 'KYC Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Info */}
          {request.client.portfolio && (
            <Card>
              <CardHeader>
                <CardTitle>Client Portfolio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-bold">
                    ${request.client.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Invested</p>
                  <p className="text-lg font-semibold">
                    ${request.client.portfolio.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RM Info */}
          {request.client.relationshipManager && (
            <Card>
              <CardHeader>
                <CardTitle>Relationship Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">
                  {request.client.relationshipManager.user.firstName}{' '}
                  {request.client.relationshipManager.user.lastName}
                </p>
                <p className="text-sm text-gray-600">{request.client.relationshipManager.user.email}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-sm font-medium">{format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              {request.processedAt && (
                <div>
                  <p className="text-sm text-gray-600">Processed</p>
                  <p className="text-sm font-medium">{format(new Date(request.processedAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}
              {request.processedBy && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Processed By</p>
                  <p className="text-sm font-medium">
                    {request.processedBy.user.firstName} {request.processedBy.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{request.processedBy.user.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
