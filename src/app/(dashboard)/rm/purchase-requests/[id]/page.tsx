'use client';

/**
 * Purchase Request Detail Page for RMs
 * Displays comprehensive information about a specific purchase request
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import Link from 'next/link';
import { RequestStatus, TransactionType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  UserIcon,
  CreditCardIcon,
  TrendingUpIcon,
  FileTextIcon,
  ClockIcon,
  DollarSignIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';

interface PurchaseRequestDetail {
  id: string;
  trackingNumber: string;
  amount: number;
  quantity: number | null;
  requestedPrice: number | null;
  status: RequestStatus;
  clientNotes: string | null;
  rmNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  processedAt: string | null;
  client: {
    id: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      createdAt: string;
    };
    portfolio: {
      id: string;
      totalValue: number;
      totalGainLoss: number;
      totalGainLossPercent: number;
      holdings: Array<{
        id: string;
        quantity: number;
        averagePurchasePrice: number;
        currentValue: number;
        gainLoss: number;
        gainLossPercent: number;
        instrument: {
          id: string;
          symbol: string;
          name: string;
          type: string;
          currentPrice: number;
          currency: string;
        };
      }>;
    } | null;
  };
  instrument: {
    id: string;
    symbol: string;
    name: string;
    type: string;
    description: string | null;
    currentPrice: number;
    currency: string;
    riskRating: string | null;
    minimumInvestment: number | null;
    isActive: boolean;
    isPublic: boolean;
    performanceData: Record<string, unknown> | null;
  };
  processedBy: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
}

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  quantity: number | null;
  price: number | null;
  total: number;
  fees: number;
  netAmount: number;
  status: string;
  createdAt: string;
  instrument: {
    symbol: string;
    name: string;
    type: string;
  } | null;
}

interface OtherRequest {
  id: string;
  trackingNumber: string;
  amount: number;
  quantity: number | null;
  requestedPrice: number | null;
  status: RequestStatus;
  createdAt: string;
  instrument: {
    symbol: string;
    name: string;
  };
}

export default function PurchaseRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PurchaseRequestDetail | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [otherRequests, setOtherRequests] = useState<OtherRequest[]>([]);

  // Verification state
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationChecks, setVerificationChecks] = useState({
    amountMatch: false,
    accountVerified: false,
    dateValid: false,
  });
  const [updatingVerification, setUpdatingVerification] = useState(false);

  // Confirmation dialog state
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const requestId = params?.id as string;

  const fetchRequestDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rm/purchase-requests/${requestId}`);
      const result = await response.json();

      if (result.success) {
        setRequest(result.data.request);
        setTransactionHistory(result.data.transactionHistory || []);
        setOtherRequests(result.data.otherPendingRequests || []);

        // Initialize verification state from existing data
        if (result.data.request.rmNotes) {
          setVerificationNotes(result.data.request.rmNotes);
        }
      } else {
        toast.error(result.error || 'Failed to load request details');
        router.push('/rm/purchase-requests');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  }, [requestId, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'RM') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchRequestDetails();
    }
  }, [status, session, requestId, router, fetchRequestDetails]);

  const handleUpdateVerification = async (newStatus?: RequestStatus, notes?: string) => {
    try {
      setUpdatingVerification(true);

      const response = await fetch(`/api/rm/purchase-requests/${requestId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rmNotes: notes || verificationNotes,
          verificationChecks,
          updateStatus: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.data.message || 'Verification updated successfully');

        // Show email notification status if applicable
        if (result.data.emailSent !== undefined) {
          if (result.data.emailSent) {
            toast.success('Email notification sent to client');
          } else {
            toast.error('Failed to send email notification');
          }
        }

        // Close dialogs
        setShowApproveDialog(false);
        setShowRejectDialog(false);
        setRejectionReason('');

        // Refresh request details
        await fetchRequestDetails();
      } else {
        toast.error(result.error || 'Failed to update verification');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    } finally {
      setUpdatingVerification(false);
    }
  };

  const handleStartVerification = () => {
    handleUpdateVerification(RequestStatus.PROCESSING);
  };

  const handleApproveRequest = () => {
    handleUpdateVerification(RequestStatus.APPROVED);
  };

  const handleRejectRequest = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    const combinedNotes = verificationNotes
      ? `${verificationNotes}\n\nRejection Reason:\n${rejectionReason}`
      : `Rejection Reason:\n${rejectionReason}`;
    handleUpdateVerification(RequestStatus.REJECTED, combinedNotes);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case RequestStatus.PROCESSING:
        return <Badge className="bg-blue-600">Processing</Badge>;
      case RequestStatus.APPROVED:
        return <Badge className="bg-green-600">Approved</Badge>;
      case RequestStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case RequestStatus.COMPLETED:
        return <Badge className="bg-gray-600">Completed</Badge>;
      case RequestStatus.CANCELLED:
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskRating: string | null) => {
    if (!riskRating) return null;

    switch (riskRating.toUpperCase()) {
      case 'LOW':
        return <Badge className="bg-green-600">Low Risk</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-600">Medium Risk</Badge>;
      case 'HIGH':
        return <Badge variant="destructive">High Risk</Badge>;
      default:
        return <Badge variant="outline">{riskRating}</Badge>;
    }
  };

  if (loading || !request) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading request details...</p>
          </div>
        </div>
      </div>
    );
  }

  const client = request.client;
  const clientName = `${client.user.firstName} ${client.user.lastName}`;
  const portfolio = client.portfolio;

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          href="/rm/purchase-requests"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Purchase Requests
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Request Details</h1>
            <p className="text-muted-foreground mt-2">
              Tracking: <span className="font-mono font-semibold">{request.trackingNumber}</span>
            </p>
          </div>
          <div>{getStatusBadge(request.status)}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              <CardTitle>Client Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-mono text-sm">{client.user.email}</p>
            </div>
            {client.user.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p>{client.user.phone}</p>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Client Since</p>
              <p>{format(new Date(client.user.createdAt), 'MMMM d, yyyy')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Request Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              <CardTitle>Request Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                <p>{format(new Date(request.createdAt), 'MMMM d, yyyy h:mm a')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Investment Amount</p>
              <p className="text-2xl font-bold">
                {request.instrument.currency} {request.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {request.quantity && (
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-semibold">{request.quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} units</p>
              </div>
            )}
            {request.requestedPrice && (
              <div>
                <p className="text-sm text-muted-foreground">Price at Request</p>
                <p>{request.instrument.currency} {request.requestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instrument Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              <CardTitle>Instrument Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Symbol</p>
                  <p className="text-xl font-bold font-mono">{request.instrument.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{request.instrument.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">{request.instrument.type}</Badge>
                </div>
                {request.instrument.riskRating && (
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    {getRiskBadge(request.instrument.riskRating)}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-xl font-bold">
                    {request.instrument.currency} {request.instrument.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </p>
                </div>
                {request.instrument.minimumInvestment && (
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum Investment</p>
                    <p>
                      {request.instrument.currency} {request.instrument.minimumInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex gap-2">
                    {request.instrument.isActive && <Badge className="bg-green-600">Active</Badge>}
                    {request.instrument.isPublic && <Badge className="bg-blue-600">Public</Badge>}
                  </div>
                </div>
              </div>
            </div>
            {request.instrument.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{request.instrument.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Client Notes */}
        {request.clientNotes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Client Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.clientNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Overview */}
        {portfolio && (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5" />
                <CardTitle>Client Portfolio Overview</CardTitle>
              </div>
              <CardDescription>Current holdings and portfolio performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3 mb-6">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
                  <p className="text-2xl font-bold">
                    {request.instrument.currency} {portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Gain/Loss</p>
                  <p className={`text-2xl font-bold ${portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.totalGainLoss >= 0 ? '+' : ''}{request.instrument.currency} {portfolio.totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Percentage Change</p>
                  <p className={`text-2xl font-bold ${portfolio.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.totalGainLossPercent >= 0 ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {portfolio.holdings.length > 0 && (
                <>
                  <h3 className="font-semibold mb-3">Current Holdings</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Instrument</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Cost</TableHead>
                          <TableHead className="text-right">Current Value</TableHead>
                          <TableHead className="text-right">Gain/Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolio.holdings.map((holding) => (
                          <TableRow key={holding.id}>
                            <TableCell>
                              <div>
                                <p className="font-semibold">{holding.instrument.symbol}</p>
                                <p className="text-xs text-muted-foreground">{holding.instrument.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{holding.quantity.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {holding.instrument.currency} {holding.averagePurchasePrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {holding.instrument.currency} {holding.currentValue.toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-right ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {holding.gainLoss >= 0 ? '+' : ''}{holding.instrument.currency} {holding.gainLoss.toFixed(2)}
                              <span className="text-xs ml-1">({holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%)</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        {transactionHistory.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-5 w-5" />
                <CardTitle>Recent Transaction History</CardTitle>
              </div>
              <CardDescription>Last 10 transactions from this client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price/Unit</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionHistory.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{format(new Date(txn.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={txn.type === TransactionType.PURCHASE ? 'default' : 'outline'}>
                            {txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {txn.instrument ? (
                            <div>
                              <p className="font-semibold text-sm">{txn.instrument.symbol}</p>
                              <p className="text-xs text-muted-foreground">{txn.instrument.name}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{txn.quantity ? txn.quantity.toFixed(2) : '-'}</TableCell>
                        <TableCell className="text-right">{txn.price ? txn.price.toFixed(2) : '-'}</TableCell>
                        <TableCell className="text-right font-semibold">{txn.netAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{txn.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase Request Verification Section */}
        {request.status === RequestStatus.PENDING || request.status === RequestStatus.PROCESSING ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  <CardTitle>Purchase Request Verification</CardTitle>
                </div>
                {request.status === RequestStatus.PENDING && (
                  <Button
                    size="sm"
                    onClick={handleStartVerification}
                    disabled={updatingVerification}
                  >
                    Start Verification
                  </Button>
                )}
              </div>
              <CardDescription>
                Verify purchase request details and provide your approval decision
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Verification Checklist */}
              <div className="space-y-3">
                <Label>Verification Checklist</Label>
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="amountMatch"
                      checked={verificationChecks.amountMatch}
                      onChange={(e) =>
                        setVerificationChecks((prev) => ({
                          ...prev,
                          amountMatch: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor="amountMatch" className="text-sm cursor-pointer flex-1">
                      <span className="font-medium">Amount Match:</span> Verify that the transaction amount in the bank statement matches the requested amount ({request.instrument.currency} {request.amount.toLocaleString()})
                    </label>
                    {verificationChecks.amountMatch && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="accountVerified"
                      checked={verificationChecks.accountVerified}
                      onChange={(e) =>
                        setVerificationChecks((prev) => ({
                          ...prev,
                          accountVerified: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor="accountVerified" className="text-sm cursor-pointer flex-1">
                      <span className="font-medium">Account Verified:</span> Confirm the bank account details match client records
                    </label>
                    {verificationChecks.accountVerified && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="dateValid"
                      checked={verificationChecks.dateValid}
                      onChange={(e) =>
                        setVerificationChecks((prev) => ({
                          ...prev,
                          dateValid: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor="dateValid" className="text-sm cursor-pointer flex-1">
                      <span className="font-medium">Date Valid:</span> Verify transaction date is within acceptable range (submitted {format(new Date(request.createdAt), 'MMM d, yyyy')})
                    </label>
                    {verificationChecks.dateValid && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Verification Notes */}
              <div className="space-y-3">
                <Label htmlFor="verificationNotes">Verification Notes</Label>
                <textarea
                  id="verificationNotes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add notes about the verification process, bank statement details, or any issues found..."
                  rows={4}
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateVerification()}
                  disabled={updatingVerification}
                >
                  Save Verification
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowApproveDialog(true)}
                  disabled={
                    !verificationChecks.amountMatch ||
                    !verificationChecks.accountVerified ||
                    !verificationChecks.dateValid ||
                    updatingVerification
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="mr-2 h-4 w-4" />
                  Approve Request
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={updatingVerification}
                >
                  <XCircleIcon className="mr-2 h-4 w-4" />
                  Reject Request
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* RM Notes Display (for completed requests) */}
        {request.rmNotes && (request.status === RequestStatus.APPROVED || request.status === RequestStatus.REJECTED || request.status === RequestStatus.COMPLETED) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>RM Verification Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.rmNotes}</p>
              {request.processedAt && (
                <p className="text-sm text-muted-foreground mt-4">
                  Processed on {format(new Date(request.processedAt), 'MMMM d, yyyy h:mm a')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Other Pending Requests */}
        {otherRequests.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Other Pending Requests from {clientName}</CardTitle>
              <CardDescription>Other active purchase requests from this client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {otherRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/rm/purchase-requests/${req.id}` as `/rm/purchase-requests/${string}`)}
                  >
                    <div>
                      <p className="font-semibold">{req.instrument.symbol} - {req.instrument.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.trackingNumber} • {format(new Date(req.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${req.amount.toLocaleString()}</p>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8">
        <Button
          variant="outline"
          onClick={() => router.push('/rm/purchase-requests')}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this purchase request? This action will:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Update request status to APPROVED</p>
                <p className="text-sm text-muted-foreground">
                  The request will be marked as approved in the system
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Send email notification to client</p>
                <p className="text-sm text-muted-foreground">
                  The client will receive an email confirmation at {request?.client.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Create audit log entry</p>
                <p className="text-sm text-muted-foreground">
                  This action will be logged for compliance and auditing
                </p>
              </div>
            </div>

            {request && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Request Summary:</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Tracking:</strong> {request.trackingNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Client:</strong> {request.client.user.firstName} {request.client.user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Instrument:</strong> {request.instrument.symbol} - {request.instrument.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Amount:</strong> {request.instrument.currency} {request.amount.toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={updatingVerification}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveRequest}
              disabled={updatingVerification}
              className="bg-green-600 hover:bg-green-700"
            >
              {updatingVerification ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Purchase Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this purchase request. The client will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {request && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Request Summary:</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Tracking:</strong> {request.trackingNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Client:</strong> {request.client.user.firstName} {request.client.user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Instrument:</strong> {request.instrument.symbol} - {request.instrument.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Amount:</strong> {request.instrument.currency} {request.amount.toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected (e.g., insufficient funds, documentation issues, compliance concerns...)"
                rows={4}
                className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-sm text-muted-foreground">
                This reason will be included in the email notification sent to the client
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">This action will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Update request status to REJECTED</li>
                <li>Send email notification to client with rejection reason</li>
                <li>Create audit log entry</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={updatingVerification}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRequest}
              disabled={updatingVerification || !rejectionReason.trim()}
            >
              {updatingVerification ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
