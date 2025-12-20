/**
 * Client - Withdrawal Request Detail Page
 * View detailed information and status timeline of a specific withdrawal request
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  ArrowLeft,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  FileText,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { WithdrawalStatus } from '@prisma/client';

interface WithdrawalRequest {
  id: string;
  trackingNumber: string;
  status: WithdrawalStatus;
  amount: number;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string | null;
  swiftCode: string | null;
  reason: string | null;
  clientNotes: string | null;
  rmNotes: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  rmProcessedAt: string | null;
  adminProcessedAt: string | null;
}

interface ApiResponse {
  success: boolean;
  data?: {
    request: WithdrawalRequest;
  };
  error?: string;
}

export default function ClientWithdrawalRequestDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [request, setRequest] = useState<WithdrawalRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or not CLIENT
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch request details
  const fetchRequestDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/client/withdrawal-requests/${params.id}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRequest(data.data.request);
      } else {
        toast.error(data.error || 'Failed to fetch request details');
        router.push('/client/withdrawal-requests');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error('Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      fetchRequestDetails();
    }
  }, [status, session, params.id, fetchRequestDetails]);

  // Status Timeline Component
  const StatusTimeline = ({ status, createdAt, rmProcessedAt, adminProcessedAt }: {
    status: WithdrawalStatus;
    createdAt: string;
    rmProcessedAt: string | null;
    adminProcessedAt: string | null;
  }) => {
    const timeline = [
      {
        stage: 'Submitted',
        status: 'PENDING',
        timestamp: createdAt,
        icon: <FileText className="h-4 w-4" />,
        color: 'blue',
        isCompleted: true,
      },
      {
        stage: 'RM Review',
        status: ['RM_REVIEW', 'RM_APPROVED', 'RM_REJECTED'],
        timestamp: rmProcessedAt,
        icon: <User className="h-4 w-4" />,
        color: status === 'RM_REJECTED' ? 'red' : rmProcessedAt ? 'green' : 'gray',
        isCompleted: rmProcessedAt !== null,
        isCurrent: status === 'RM_REVIEW',
        isRejected: status === 'RM_REJECTED',
      },
      {
        stage: 'Admin Approval',
        status: ['ADMIN_REVIEW', 'ADMIN_APPROVED', 'ADMIN_REJECTED'],
        timestamp: adminProcessedAt,
        icon: <CheckCircle className="h-4 w-4" />,
        color: status === 'ADMIN_REJECTED' ? 'red' : adminProcessedAt ? 'green' : 'gray',
        isCompleted: adminProcessedAt !== null,
        isCurrent: status === 'ADMIN_REVIEW' || status === 'RM_APPROVED',
        isRejected: status === 'ADMIN_REJECTED',
      },
      {
        stage: 'Completed',
        status: ['COMPLETED', 'ADMIN_APPROVED'],
        timestamp: status === 'ADMIN_APPROVED' || status === 'COMPLETED' ? adminProcessedAt : null,
        icon: <CheckCircle className="h-4 w-4" />,
        color: status === 'ADMIN_APPROVED' || status === 'COMPLETED' ? 'green' : 'gray',
        isCompleted: status === 'ADMIN_APPROVED' || status === 'COMPLETED',
        isCurrent: false,
        isRejected: false,
      },
    ];

    return (
      <div className="relative">
        {timeline.map((item, index) => (
          <div key={index} className="flex gap-4 pb-8 last:pb-0">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.isRejected
                    ? 'bg-red-500 text-white'
                    : item.isCompleted
                    ? 'bg-green-500 text-white'
                    : item.isCurrent
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {item.isCompleted ? (
                  item.isRejected ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )
                ) : item.isCurrent ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  item.icon
                )}
              </div>
              {index < timeline.length - 1 && (
                <div
                  className={`w-0.5 flex-1 mt-2 ${
                    item.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ minHeight: '40px' }}
                />
              )}
            </div>

            {/* Timeline Content */}
            <div className="flex-1 pt-1">
              <h3
                className={`font-semibold ${
                  item.isRejected
                    ? 'text-red-700'
                    : item.isCompleted
                    ? 'text-green-700'
                    : item.isCurrent
                    ? 'text-blue-700'
                    : 'text-gray-500'
                }`}
              >
                {item.stage}
                {item.isRejected && ' - Rejected'}
                {item.isCurrent && ' - In Progress'}
              </h3>
              {item.timestamp && (
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              )}
              {!item.timestamp && !item.isCompleted && (
                <p className="text-sm text-gray-400 mt-1">Pending</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading || !request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const isRejected = request.status.includes('REJECTED');
  const isApproved = request.status === 'ADMIN_APPROVED' || request.status === 'COMPLETED';
  const isPending = !isRejected && !isApproved;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => {
            router.push('/client/withdrawal-requests');
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
        <Button variant="outline" onClick={fetchRequestDetails} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">Withdrawal Request Details</h1>
      <p className="text-gray-600 mb-6">Tracking Number: {request.trackingNumber}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Status Timeline */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Status Timeline
              </CardTitle>
              <CardDescription>Track your request progress</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                status={request.status}
                createdAt={request.createdAt}
                rmProcessedAt={request.rmProcessedAt}
                adminProcessedAt={request.adminProcessedAt}
              />
            </CardContent>
          </Card>

          {/* Current Status Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`p-4 rounded-lg ${
                  isRejected
                    ? 'bg-red-50 border border-red-200'
                    : isApproved
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isRejected ? (
                    <XCircle className="h-8 w-8 text-red-600" />
                  ) : isApproved ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <Clock className="h-8 w-8 text-blue-600" />
                  )}
                  <div>
                    <p
                      className={`font-semibold ${
                        isRejected
                          ? 'text-red-900'
                          : isApproved
                          ? 'text-green-900'
                          : 'text-blue-900'
                      }`}
                    >
                      {request.status.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {isRejected
                        ? 'Your request has been rejected'
                        : isApproved
                        ? 'Your withdrawal has been approved'
                        : 'Your request is being processed'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Withdrawal Amount */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">
                ${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Bank Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Account Holder Name</Label>
                  <p className="font-medium">{request.bankAccountName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Account Number</Label>
                  <p className="font-mono">
                    {request.bankAccountNumber.slice(0, -4).replace(/./g, '*')}
                    {request.bankAccountNumber.slice(-4)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Bank Name</Label>
                  <p className="font-medium">{request.bankName}</p>
                </div>
                {request.bankBranch && (
                  <div>
                    <Label className="text-gray-600">Branch</Label>
                    <p className="font-medium">{request.bankBranch}</p>
                  </div>
                )}
                {request.swiftCode && (
                  <div>
                    <Label className="text-gray-600">SWIFT Code</Label>
                    <p className="font-mono">{request.swiftCode}</p>
                  </div>
                )}
              </div>

              {request.reason && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-600">Withdrawal Reason</Label>
                    <p className="text-sm mt-1">{request.reason}</p>
                  </div>
                </>
              )}

              {request.clientNotes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-600">Your Notes</Label>
                    <p className="text-sm mt-1">{request.clientNotes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* RM Notes (if available) */}
          {request.rmNotes && (
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-blue-900">
                  Relationship Manager Notes
                </CardTitle>
                <CardDescription>
                  {request.rmProcessedAt &&
                    `Processed on ${new Date(request.rmProcessedAt).toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">{request.rmNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes (if available) */}
          {request.adminNotes && (
            <Card className="border-2 border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="text-green-900">Administrator Notes</CardTitle>
                <CardDescription>
                  {request.adminProcessedAt &&
                    `Processed on ${new Date(request.adminProcessedAt).toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">{request.adminNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason (if rejected) */}
          {request.rejectionReason && (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-900">
                  <XCircle className="mr-2 h-5 w-5" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 whitespace-pre-wrap">
                    {request.rejectionReason}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Information */}
          {isPending && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-blue-600" />
                  What&apos;s Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-2">
                <p>
                  Your withdrawal request is currently being reviewed. Here&apos;s what happens next:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Your Relationship Manager will review your request</li>
                  <li>If approved by RM, it will be sent to Admin for final approval</li>
                  <li>Once fully approved, funds will be transferred to your bank account</li>
                  <li>You&apos;ll receive notifications at each stage of the process</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
