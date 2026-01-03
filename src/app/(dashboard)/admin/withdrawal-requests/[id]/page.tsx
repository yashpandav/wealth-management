/**
 * Admin - Withdrawal Request Detail and Approval Page
 * Review comprehensive request details with RM recommendation and make final approval decision
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  RefreshCw,
  User,
  Wallet,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Clock,
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
  paymentReference: string | null;
  createdAt: string;
  rmProcessedAt: string | null;
  adminProcessedAt: string | null;
  client: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
    portfolio: {
      totalValue: number;
      totalGainLoss: number;
      totalInvested: number;
    } | null;
    relationshipManager: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
      };
    } | null;
  };
  processedByRM: {
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
    request: WithdrawalRequest;
  };
  error?: string;
}

export default function AdminWithdrawalRequestDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [request, setRequest] = useState<WithdrawalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Redirect if not authenticated or not ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  const fetchRequestDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawal-requests/${params.id}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRequest(data.data.request);
        // Pre-fill admin notes if already exists
        if (data.data.request.adminNotes) {
          setAdminNotes(data.data.request.adminNotes);
        }
        if (data.data.request.paymentReference) {
          setPaymentReference(data.data.request.paymentReference);
        }
      } else {
        toast.error(data.error || 'Failed to fetch request details');
        router.push('/admin/withdrawal-requests');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error('Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  // Fetch request details
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchRequestDetails();
    }
  }, [status, session, params.id, fetchRequestDetails]);

  const handleApprove = async () => {
    if (!adminNotes || adminNotes.length < 10) {
      toast.error('Please provide admin notes (minimum 10 characters)');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawal-requests/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'APPROVE',
          adminNotes,
          paymentReference: paymentReference || undefined,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('Withdrawal request approved and processed successfully');
        setShowApproveDialog(false);
        router.push('/admin/withdrawal-requests');
      } else {
        toast.error(data.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes || adminNotes.length < 10) {
      toast.error('Please provide admin notes (minimum 10 characters)');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawal-requests/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'REJECT',
          adminNotes,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('Withdrawal request rejected');
        setShowRejectDialog(false);
        router.push('/admin/withdrawal-requests');
      } else {
        toast.error(data.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const availableBalance = request.client.portfolio?.totalValue || 0;
  const insufficientBalance = request.amount > availableBalance;
  const canApprove =
    request.status === WithdrawalStatus.RM_APPROVED ||
    request.status === WithdrawalStatus.ADMIN_REVIEW;

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => {
            router.push('/admin/withdrawal-requests');
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-blue" />
          <span className="text-sm font-medium text-gray-600">Admin Review</span>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2">Withdrawal Request Review</h1>
      <p className="text-gray-600 mb-6">Tracking Number: {request.trackingNumber}</p>

      {/* Client Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-600">Name</Label>
            <p className="font-medium">
              {request.client.user.firstName} {request.client.user.lastName}
            </p>
          </div>
          <div>
            <Label className="text-gray-600">Email</Label>
            <p className="font-medium">{request.client.user.email}</p>
          </div>
          {request.client.user.phone && (
            <div>
              <Label className="text-gray-600">Phone</Label>
              <p className="font-medium">{request.client.user.phone}</p>
            </div>
          )}
          {request.client.relationshipManager && (
            <div>
              <Label className="text-gray-600">Relationship Manager</Label>
              <p className="font-medium">
                {request.client.relationshipManager.user.firstName}{' '}
                {request.client.relationshipManager.user.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {request.client.relationshipManager.user.email}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Balance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Portfolio Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {request.client.portfolio ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-600">Available Balance</Label>
                <p className="text-2xl font-bold">
                  ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Total Invested</Label>
                <p className="text-2xl font-bold">
                  ${Number(request.client.portfolio.totalInvested).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Total Gain/Loss</Label>
                <p
                  className={`text-2xl font-bold ${
                    Number(request.client.portfolio.totalGainLoss) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  ${Number(request.client.portfolio.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No portfolio information available</p>
          )}

          {insufficientBalance && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Insufficient Balance</p>
                <p className="text-sm text-red-700">
                  The withdrawal amount exceeds the available portfolio balance. This request cannot
                  be approved.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Withdrawal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-600">Withdrawal Amount</Label>
            <p className="text-2xl md:text-3xl font-bold text-brand-blue">
              ${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            {request.client.portfolio && (
              <p className="text-sm text-gray-500 mt-1">
                Remaining balance after withdrawal:{' '}
                <span className="font-medium">
                  ${(availableBalance - request.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </div>

          <Separator />

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
                <Label className="text-gray-600">Client Notes</Label>
                <p className="text-sm mt-1">{request.clientNotes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* RM Recommendation */}
      {request.processedByRM && (
        <Card className="mb-6 border-2 border-blue-200 bg-brand-blue/10/30">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Shield className="mr-2 h-5 w-5" />
              RM Recommendation
            </CardTitle>
            <CardDescription>
              Processed by {request.processedByRM.user.firstName}{' '}
              {request.processedByRM.user.lastName} on{' '}
              {request.rmProcessedAt && new Date(request.rmProcessedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {request.rmNotes ? (
              <div className="bg-white p-4 rounded-lg border">
                <Label className="text-gray-600">RM Notes</Label>
                <p className="mt-2 text-sm whitespace-pre-wrap">{request.rmNotes}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No RM notes provided</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Decision Section */}
      {canApprove && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-orange-600" />
              Admin Decision
            </CardTitle>
            <CardDescription>
              Provide your decision and notes for this withdrawal request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminNotes">
                Admin Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Provide detailed notes for your decision (minimum 10 characters)"
                className="mt-1 min-h-[120px]"
                maxLength={2000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {adminNotes.length}/2000 characters
              </p>
            </div>

            <div>
              <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter payment reference number or transaction ID"
                className="mt-1"
                maxLength={100}
              />
              <p className="text-sm text-gray-500 mt-1">
                Bank transaction reference for approved withdrawals
              </p>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={!adminNotes || adminNotes.length < 10 || processing}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Request
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
                disabled={!adminNotes || adminNotes.length < 10 || insufficientBalance || processing}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Process
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status if already processed */}
      {!canApprove && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {request.status === WithdrawalStatus.ADMIN_APPROVED ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Request Approved</p>
                    <p className="text-sm text-gray-600">
                      This request has been approved and processed
                    </p>
                  </div>
                </>
              ) : request.status === WithdrawalStatus.ADMIN_REJECTED ? (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Request Rejected</p>
                    <p className="text-sm text-gray-600">This request has been rejected</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-6 w-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Status: {request.status.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600">This request is not ready for admin review</p>
                  </div>
                </>
              )}
            </div>

            {request.adminNotes && (
              <div className="mt-4">
                <Label className="text-gray-600">Admin Notes</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <p className="text-sm whitespace-pre-wrap">{request.adminNotes}</p>
                </div>
              </div>
            )}

            {request.paymentReference && (
              <div className="mt-4">
                <Label className="text-gray-600">Payment Reference</Label>
                <p className="mt-1 font-mono text-sm">{request.paymentReference}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal Approval</DialogTitle>
            <DialogDescription>
              You are about to approve this withdrawal request. This action will:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-4 bg-brand-blue/10 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900">
                Withdraw ${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-brand-blue mt-1">
                From {request.client.user.firstName} {request.client.user.lastName}&apos;s portfolio
              </p>
              <p className="text-sm text-brand-blue">To {request.bankName}</p>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Deduct the amount from the client&apos;s portfolio</li>
              <li>Create a completed withdrawal transaction</li>
              <li>Send notification to client and RM</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal Rejection</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this withdrawal request?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="font-semibold text-yellow-900">Request: {request.trackingNumber}</p>
              <p className="text-sm text-yellow-700 mt-1">
                Amount: ${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-sm text-gray-700">
              Your admin notes will be sent to the client and RM. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
