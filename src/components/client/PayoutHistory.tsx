/**
 * Client - Payout History Component
 * Read-only view of client's payout history
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';

interface Payout {
  id: string;
  productPurchaseRequest: {
    id: string;
    trackingNumber: string;
    investment: {
      id: string;
      name: string;
      currency: string;
    };
    investmentOption: {
      duration: string;
      withdrawalFrequency: string;
      roi: number;
      annualReturn: number;
    };
  };
  amount: number;
  periodStart: string;
  periodEnd: string;
  scheduledDate: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  processedBy: {
    id: string;
    name: string;
  } | null;
  processedAt: string | null;
  receiptDocument: {
    id: string;
    fileName: string;
    filePath: string;
  } | null;
  createdAt: string;
}

interface PayoutsResponse {
  success: boolean;
  data: {
    payouts: Payout[];
    summary: {
      total: number;
      totalEarned: number;
      byStatus: Array<{
        status: string;
        count: number;
        totalAmount: number;
      }>;
      nextPayout: {
        id: string;
        scheduledDate: string;
        amount: number;
        investment: string;
        currency: string;
      } | null;
    };
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  error?: string;
}

async function fetchPayouts(params: {
  page: number;
  status: string;
}): Promise<PayoutsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
  });

  if (params.status && params.status !== 'all') {
    queryParams.append('status', params.status);
  }

  const response = await fetch(`/api/client/payouts?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch payouts');
  }
  return response.json();
}

export function PayoutHistory() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');

  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    payout: Payout | null;
  }>({ open: false, payout: null });

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-payouts', page, status],
    queryFn: () => fetchPayouts({ page, status }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">Pending</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadReceipt = (filePath: string, fileName: string) => {
    // Create a temporary link to download the receipt
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load payouts. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const payouts = data?.data.payouts || [];
  const pagination = data?.data.pagination;
  const summary = data?.data.summary;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <DirhamIcon className="w-4 h-4 text-green-700 self-center" />
                <span className="text-2xl font-bold text-green-900 font-nums">
                  {summary.totalEarned.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                From <span className="font-nums">{summary.byStatus.find(s => s.status === 'COMPLETED')?.count || 0}</span> completed payouts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Next Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.nextPayout ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-blue-900 font-nums">
                      {summary.nextPayout.currency === 'USD' ? <DirhamIcon className="w-4 h-4 inline mr-1" /> : summary.nextPayout.currency + ' '}
                      {summary.nextPayout.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1 font-nums">
                    {format(new Date(summary.nextPayout.scheduledDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5 truncate">
                    {summary.nextPayout.investment}
                  </p>
                </>
              ) : (
                <p className="text-sm text-blue-700">No upcoming payouts</p>
              )}
            </CardContent>
          </Card>

          {summary.byStatus.map((s) => (
            <Card key={s.status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                  {s.status.toLowerCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-nums">{s.count}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1 font-nums">
                  <span className="mr-1 font-sans">Total:</span>
                  <DirhamIcon className="w-3 h-3 mx-1" />
                  {s.totalAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payouts</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : payouts.length > 0 ? (
              payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-nums">
                    {format(new Date(payout.scheduledDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {payout.productPurchaseRequest.investment.name}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {payout.productPurchaseRequest.trackingNumber}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-nums">
                      {format(new Date(payout.periodStart), 'MMM dd')} -{' '}
                      {format(new Date(payout.periodEnd), 'MMM dd, yyyy')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {payout.productPurchaseRequest.investmentOption.withdrawalFrequency}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="flex items-center justify-end font-nums">
                      <span className="mr-1 text-xs text-muted-foreground font-sans">
                        {payout.productPurchaseRequest.investment.currency}
                      </span>
                      {payout.productPurchaseRequest.investment.currency === 'USD' ? (
                        <DirhamIcon className="w-3 h-3 mx-1" />
                      ) : null}
                      {payout.amount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailDialog({ open: true, payout })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payout.status === 'COMPLETED' && payout.receiptDocument && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-brand-blue hover:text-brand-blue/80 hover:bg-brand-blue/5"
                          onClick={() =>
                            handleDownloadReceipt(
                              payout.receiptDocument!.filePath,
                              payout.receiptDocument!.fileName
                            )
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No payouts found</p>
                    <p className="text-sm text-muted-foreground">
                      Payouts will appear here once your investments start generating interest
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-nums">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-nums">{Math.min(pagination.page * pagination.limit, pagination.totalCount)}</span> of{' '}
            <span className="font-nums">{pagination.totalCount}</span> payouts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-nums">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => {
          if (!open) setDetailDialog({ open: false, payout: null });
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>View detailed information about this payout</DialogDescription>
          </DialogHeader>
          {detailDialog.payout && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-mono">
                    {detailDialog.payout.productPurchaseRequest.trackingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(detailDialog.payout.status)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">
                    {detailDialog.payout.productPurchaseRequest.investment.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium flex items-center font-nums">
                    {detailDialog.payout.productPurchaseRequest.investment.currency !== 'USD'
                      ? detailDialog.payout.productPurchaseRequest.investment.currency
                      : <DirhamIcon className="w-3 h-3 mr-1" />}
                    {detailDialog.payout.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Period Start</p>
                  <p className="font-nums">
                    {format(new Date(detailDialog.payout.periodStart), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period End</p>
                  <p className="font-nums">
                    {format(new Date(detailDialog.payout.periodEnd), 'PPP')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p className="font-nums">
                    {format(new Date(detailDialog.payout.scheduledDate), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p>
                    {detailDialog.payout.productPurchaseRequest.investmentOption.withdrawalFrequency}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p>{detailDialog.payout.productPurchaseRequest.investmentOption.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Return</p>
                  <p className="text-green-600 font-medium">
                    <span className="font-nums">
                      {detailDialog.payout.productPurchaseRequest.investmentOption.annualReturn}
                    </span>
                    %
                  </p>
                </div>
              </div>
              {detailDialog.payout.status === 'COMPLETED' && detailDialog.payout.processedAt && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Processed Date</p>
                    <p className="font-nums">
                      {format(new Date(detailDialog.payout.processedAt), 'PPP')}
                    </p>
                  </div>
                  {detailDialog.payout.receiptDocument && (
                    <div>
                      <p className="text-sm text-muted-foreground">Receipt</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-brand-blue"
                        onClick={() =>
                          handleDownloadReceipt(
                            detailDialog.payout!.receiptDocument!.filePath,
                            detailDialog.payout!.receiptDocument!.fileName
                          )
                        }
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Receipt
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, payout: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
