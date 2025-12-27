/**
 * Client - Withdrawal Request Page
 * Submit withdrawal requests with balance validation
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, DollarSign, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createWithdrawalRequestSchema, type CreateWithdrawalRequestInput } from '@/lib/validation/withdrawal-request.validation';
import { ClientStatusBannerClient } from '@/components/client/ClientStatusBannerClient';
import { checkTransactionEligibility } from '@/lib/utils/client-utils';

interface PortfolioData {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

interface ApiResponse {
  success: boolean;
  data?: {
    id: string;
    trackingNumber: string;
    status: string;
    amount: number;
    createdAt: string;
  };
  error?: string;
  details?: unknown;
}

/**
 * Renders the client withdrawal request page and manages its full UI and interaction flow.
 *
 * The component fetches the client's portfolio and RM assignment, derives transaction eligibility,
 * provides a validated withdrawal form with bank details, shows a confirmation dialog, and submits
 * withdrawal requests to the API. It also enforces routing rules (redirects unauthenticated users
 * to login and non-client users to the dashboard) and disables submission when the user is not
 * eligible, the amount is invalid, or the balance is insufficient.
 *
 * @returns The React element for the Withdraw Funds page.
 */
export default function WithdrawPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState<CreateWithdrawalRequestInput | null>(null);
  const [hasRM, setHasRM] = useState<boolean | null>(null);
  const [canTransact, setCanTransact] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateWithdrawalRequestInput>({
    resolver: zodResolver(createWithdrawalRequestSchema),
  });

  const amount = watch('amount');

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Check client eligibility for transactions
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      const fetchClientStatus = async () => {
        try {
          const response = await fetch('/api/client/my-rm');
          const data = await response.json();
          setHasRM(!!data.data);
        } catch (error) {
          console.error('Error fetching client RM status:', error);
          setHasRM(false);
        }
      };

      fetchClientStatus();
    }
  }, [status, session]);

  // Update canTransact based on RM assignment and verification status
  useEffect(() => {
    if (hasRM !== null && session?.user?.verificationStatus) {
      const eligibility = checkTransactionEligibility(hasRM, session.user.verificationStatus);
      setCanTransact(eligibility.canTransact);
    }
  }, [hasRM, session?.user?.verificationStatus]);

  // Fetch portfolio data
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      fetchPortfolio();
    }
  }, [status, session]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/portfolio');
      const data = await response.json();

      if (data.success && data.data) {
        setPortfolio(data.data.portfolio);
      } else {
        toast.error(data.error || 'Failed to fetch portfolio');
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: CreateWithdrawalRequestInput) => {
    // Show confirmation dialog
    setFormData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!formData) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/client/withdrawal-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        toast.success(`Withdrawal request submitted! Tracking: ${data.data.trackingNumber}`);
        reset();
        setShowConfirmDialog(false);
        // Redirect to requests page
        // @ts-expect-error - Next.js typed routes limitation with dynamic routes
        router.push('/client/withdrawals');
      } else {
        toast.error(data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const availableBalance = portfolio?.totalValue || 0;
  const requestedAmount = Number(amount) || 0;
  const insufficientBalance = requestedAmount > availableBalance;

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role === 'CLIENT' && loading)) {
    return (
      <div className="container mx-auto py-8">
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
    <div className="container mx-auto py-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Withdraw Funds</h1>
        <p className="mt-2 text-muted-foreground">
          Submit a withdrawal request from your portfolio
        </p>
      </div>

      {/* Show status banner if client cannot transact */}
      <ClientStatusBannerClient className="mt-6" />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Portfolio Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <p className="text-3xl font-bold">
                  ${availableBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              {portfolio && (
                <div>
                  <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                  <p className={`text-lg font-semibold ${
                    portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {portfolio.totalGainLoss >= 0 ? '+' : ''}
                    ${portfolio.totalGainLoss.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    {' '}
                    ({portfolio.totalGainLossPercent >= 0 ? '+' : ''}
                    {portfolio.totalGainLossPercent.toFixed(2)}%)
                  </p>
                </div>
              )}

              <Separator />

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Withdrawals require two-tier approval (RM review + Admin approval) and may take 3-5 business days to process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Request Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Withdrawal Amount</p>
                <p className="text-3xl font-bold">
                  ${requestedAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                <p className={`text-lg font-semibold ${
                  insufficientBalance ? 'text-red-600' : 'text-foreground'
                }`}>
                  ${(availableBalance - requestedAmount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              {insufficientBalance && requestedAmount > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-900">
                    Insufficient balance. You can withdraw up to ${availableBalance.toFixed(2)}.
                  </p>
                </div>
              )}

              {requestedAmount > 0 && !insufficientBalance && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-900">
                    Amount is within available balance.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Details</CardTitle>
            <CardDescription>
              Please provide your withdrawal information and bank details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Minimum: $100.00 | Available: ${availableBalance.toFixed(2)}
              </p>
            </div>

            <Separator />

            {/* Bank Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bank Account Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountName">Account Holder Name *</Label>
                  <Input
                    id="bankAccountName"
                    placeholder="John Doe"
                    {...register('bankAccountName')}
                  />
                  {errors.bankAccountName && (
                    <p className="text-sm text-red-600">{errors.bankAccountName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number *</Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="123456789"
                    {...register('bankAccountNumber')}
                  />
                  {errors.bankAccountNumber && (
                    <p className="text-sm text-red-600">{errors.bankAccountNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    placeholder="Chase Bank"
                    {...register('bankName')}
                  />
                  {errors.bankName && (
                    <p className="text-sm text-red-600">{errors.bankName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankBranch">Bank Branch / Routing Number</Label>
                  <Input
                    id="bankBranch"
                    placeholder="123456789"
                    {...register('bankBranch')}
                  />
                  {errors.bankBranch && (
                    <p className="text-sm text-red-600">{errors.bankBranch.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="swiftCode">SWIFT Code (for international transfers)</Label>
                  <Input
                    id="swiftCode"
                    placeholder="CHASUS33"
                    {...register('swiftCode')}
                  />
                  {errors.swiftCode && (
                    <p className="text-sm text-red-600">{errors.swiftCode.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Withdrawal Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Withdrawal Reason *</Label>
              <textarea
                id="reason"
                rows={4}
                placeholder="Please provide a reason for this withdrawal (minimum 10 characters)..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            {/* Client Notes */}
            <div className="space-y-2">
              <Label htmlFor="clientNotes">Additional Notes (Optional)</Label>
              <textarea
                id="clientNotes"
                rows={3}
                placeholder="Any additional information you'd like to provide..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('clientNotes')}
              />
              {errors.clientNotes && (
                <p className="text-sm text-red-600">{errors.clientNotes.message}</p>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // @ts-expect-error - Next.js typed routes limitation with dynamic routes
                  router.push('/client/withdrawals');
                }}
              >
                View My Requests
              </Button>
              <Button
                type="submit"
                disabled={!canTransact || insufficientBalance || requestedAmount <= 0}
                title={!canTransact ? 'You must have an assigned RM and verified KYC to submit withdrawal requests' : undefined}
              >
                Submit Withdrawal Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal Request</DialogTitle>
            <DialogDescription>
              Please review your withdrawal request before submitting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Withdrawal Amount:</span>
                <span className="text-sm font-bold">
                  ${formData?.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Holder:</span>
                <span className="text-sm">{formData?.bankAccountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bank Name:</span>
                <span className="text-sm">{formData?.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Number:</span>
                <span className="text-sm font-mono">
                  ****{formData?.bankAccountNumber.slice(-4)}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm text-yellow-900">
                <strong>Important:</strong> This request will be reviewed by your Relationship Manager and requires final approval from an administrator. Processing typically takes 3-5 business days.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmedSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm & Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}