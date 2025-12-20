/**
 * RM - Withdrawal Request Detail and Review Page
 * Review detailed withdrawal request and submit recommendation
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
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
  createdAt: string;
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
      totalGainLossPercent: number;
      holdings: Array<{
        instrument: {
          symbol: string;
          name: string;
        };
        quantity: number;
        currentValue: number;
      }>;
    } | null;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    request: WithdrawalRequest;
  };
  error?: string;
}

export default function RMWithdrawalRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [request, setRequest] = useState<WithdrawalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rmNotes, setRmNotes] = useState('');
  const [verificationChecks, setVerificationChecks] = useState({
    balanceVerified: false,
    accountVerified: false,
    clientContactConfirmed: false,
  });

  // Redirect if not authenticated or not RM
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'RM') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch request details
  const fetchRequestDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rm/withdrawal-requests/${params.id}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRequest(data.data.request);
      } else {
        toast.error(data.error || 'Failed to fetch request details');
        router.push('/rm/withdrawal-requests');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error('Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'RM') {
      fetchRequestDetails();
    }
  }, [status, session, params.id, fetchRequestDetails]);

  const handleApprove = async () => {
    if (!rmNotes || rmNotes.length < 10) {
      toast.error('Please provide notes (minimum 10 characters)');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/rm/withdrawal-requests/${params.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendation: 'APPROVE',
          rmNotes,
          verificationStatus: verificationChecks,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('Request recommended for approval and sent to admin');
        setShowApproveDialog(false);
        router.push('/rm/withdrawal-requests');
      } else {
        toast.error(data.error || 'Failed to submit recommendation');
      }
    } catch (error) {
      console.error('Error submitting approval:', error);
      toast.error('Failed to submit recommendation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rmNotes || rmNotes.length < 10) {
      toast.error('Please provide rejection reason (minimum 10 characters)');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/rm/withdrawal-requests/${params.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendation: 'REJECT',
          rmNotes,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('Request rejected successfully');
        setShowRejectDialog(false);
        router.push('/rm/withdrawal-requests');
      } else {
        toast.error(data.error || 'Failed to submit rejection');
      }
    } catch (error) {
      console.error('Error submitting rejection:', error);
      toast.error('Failed to submit rejection');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role === 'RM' && loading)) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!request || status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'RM')) {
    return null;
  }

  const availableBalance = request.client.portfolio?.totalValue || 0;
  const insufficientBalance = request.amount > availableBalance;
  const canReview = request.status === WithdrawalStatus.PENDING || request.status === WithdrawalStatus.RM_REVIEW;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => {
            router.push('/rm/withdrawal-requests');
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Withdrawal Request Review</h1>
        <p className="mt-2 text-muted-foreground font-mono">
          Tracking: {request.trackingNumber}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">
                {request.client.user.firstName} {request.client.user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{request.client.user.email}</p>
            </div>
            {request.client.user.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-sm">{request.client.user.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Portfolio Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">
                ${availableBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {request.client.portfolio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gain/Loss</p>
                <p className={`text-lg font-semibold ${
                  request.client.portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {request.client.portfolio.totalGainLoss >= 0 ? '+' : ''}
                  ${request.client.portfolio.totalGainLoss.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {' '}
                  ({request.client.portfolio.totalGainLossPercent >= 0 ? '+' : ''}
                  {request.client.portfolio.totalGainLossPercent.toFixed(2)}%)
                </p>
              </div>
            )}

            <Separator />

            {insufficientBalance && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Insufficient Balance</p>
                  <p className="text-xs text-red-700 mt-1">
                    Withdrawal amount exceeds available portfolio value
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Details */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Withdrawal Amount</p>
              <p className="text-3xl font-bold">
                ${request.amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
              <p className={`text-3xl font-bold ${insufficientBalance ? 'text-red-600' : ''}`}>
                ${(availableBalance - request.amount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Account Details
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Holder</p>
                <p className="text-sm font-semibold">{request.bankAccountName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                <p className="text-sm font-mono">****{request.bankAccountNumber.slice(-4)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                <p className="text-sm">{request.bankName}</p>
              </div>
              {request.bankBranch && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Branch</p>
                  <p className="text-sm">{request.bankBranch}</p>
                </div>
              )}
              {request.swiftCode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SWIFT Code</p>
                  <p className="text-sm font-mono">{request.swiftCode}</p>
                </div>
              )}
            </div>
          </div>

          {request.reason && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Withdrawal Reason</p>
                <p className="text-sm bg-muted p-3 rounded-md">{request.reason}</p>
              </div>
            </>
          )}

          {request.clientNotes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Client Notes</p>
                <p className="text-sm bg-muted p-3 rounded-md">{request.clientNotes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* RM Review Section */}
      {canReview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              RM Review & Verification
            </CardTitle>
            <CardDescription>
              Verify the request details and provide your recommendation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Verification Checklist */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Verification Checklist</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationChecks.balanceVerified}
                    onChange={(e) =>
                      setVerificationChecks((prev) => ({
                        ...prev,
                        balanceVerified: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Balance verified against portfolio value</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationChecks.accountVerified}
                    onChange={(e) =>
                      setVerificationChecks((prev) => ({
                        ...prev,
                        accountVerified: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Bank account details verified</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationChecks.clientContactConfirmed}
                    onChange={(e) =>
                      setVerificationChecks((prev) => ({
                        ...prev,
                        clientContactConfirmed: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Client contacted and withdrawal confirmed</span>
                </label>
              </div>
            </div>

            <Separator />

            {/* RM Notes */}
            <div>
              <Label htmlFor="rmNotes">RM Notes *</Label>
              <textarea
                id="rmNotes"
                rows={4}
                placeholder="Provide your review notes and recommendation justification (minimum 10 characters)..."
                className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={rmNotes}
                onChange={(e) => setRmNotes(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {rmNotes.length}/2000 characters
              </p>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={!rmNotes || rmNotes.length < 10}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Request
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
                disabled={!rmNotes || rmNotes.length < 10 || insufficientBalance}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Recommend for Approval
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recommend for Approval</DialogTitle>
            <DialogDescription>
              This request will be sent to an administrator for final approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Withdrawal Amount:</span>
                <span className="text-sm font-bold">
                  ${request.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Client:</span>
                <span className="text-sm">
                  {request.client.user.firstName} {request.client.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bank:</span>
                <span className="text-sm">{request.bankName}</span>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Your recommendation will be reviewed by an administrator who has final approval authority.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleApprove} disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Recommendation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal Request</DialogTitle>
            <DialogDescription>
              This request will be rejected and the client will be notified
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tracking #:</span>
                <span className="text-sm font-mono">{request.trackingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-bold">
                  ${request.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm text-yellow-900">
                <strong>Important:</strong> Your rejection notes will be sent to the client. Please ensure they are professional and clear.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
