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
  Clock,
  CheckCircle2,
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
  const [visualFilter, setVisualFilter] = useState('all');
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    payout: Payout | null;
  }>({ open: false, payout: null });

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-payouts', page, status],
    queryFn: () => fetchPayouts({ page, status }),
  });

  const getStatusBadge = (status: string, scheduledDate: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0); // Start of scheduled day

    switch (status) {
      case 'PENDING':
        if (scheduled < now) {
          // Missed - scheduled date has passed
          return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300">Missed</Badge>;
        } else if (scheduled.getTime() === now.getTime()) {
          // Today's payout
          return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300">Pending</Badge>;
        } else {
          // Future payout
          return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300">Scheduled</Badge>;
        }
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300">Failed</Badge>;
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

  // Filter payouts based on visual status
  const getVisualStatus = (payout: Payout) => {
    const now = new Date();
    const scheduled = new Date(payout.scheduledDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduledDate = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate());

    if (payout.status === 'COMPLETED') return 'completed';
    if (payout.status === 'PENDING') {
      if (scheduledDate < today) return 'missed';
      if (scheduledDate.getTime() === today.getTime()) return 'pending';
      return 'scheduled';
    }
    return 'other';
  };

  const filteredPayouts = visualFilter === 'all'
    ? payouts
    : payouts.filter(payout => getVisualStatus(payout) === visualFilter);

  // Calculate status-based counts
  const statusCounts = {
    missed: payouts.filter(p => getVisualStatus(p) === 'missed').length,
    pending: payouts.filter(p => getVisualStatus(p) === 'pending').length,
    scheduled: payouts.filter(p => getVisualStatus(p) === 'scheduled').length,
    completed: payouts.filter(p => getVisualStatus(p) === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Missed Card */}
          <Card className="border-gray-300 bg-white">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                Missed
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-nums text-gray-900">{statusCounts.missed}</div>
              <p className="text-xs text-gray-600 mt-1">Overdue payouts</p>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card className="border-gray-300 bg-white">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-nums text-gray-900">{statusCounts.pending}</div>
              <p className="text-xs text-gray-600 mt-1">Due today</p>
            </CardContent>
          </Card>

          {/* Scheduled Card */}
          <Card className="border-gray-300 bg-white">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-600" />
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-nums text-gray-900">{statusCounts.scheduled}</div>
              <p className="text-xs text-gray-600 mt-1">Upcoming payouts</p>
            </CardContent>
          </Card>

          {/* Completed Card */}
          <Card className="border-gray-300 bg-white">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-gray-600" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-nums text-gray-900">{statusCounts.completed}</div>
              <p className="text-xs text-gray-600 mt-1">Processed payouts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select
          value={visualFilter}
          onValueChange={(value) => {
            setVisualFilter(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Payouts">
              {visualFilter === 'all' && 'All Payouts'}
              {visualFilter === 'missed' && 'Missed'}
              {visualFilter === 'pending' && 'Pending'}
              {visualFilter === 'scheduled' && 'Scheduled'}
              {visualFilter === 'completed' && 'Completed'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payouts</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
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
            ) : filteredPayouts.length > 0 ? (
              filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-nums">
                    {format(new Date(payout.scheduledDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {payout.productPurchaseRequest.investment.name}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 font-nums">
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
                  <TableCell>{getStatusBadge(payout.status, payout.scheduledDate)}</TableCell>
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
                  {getStatusBadge(detailDialog.payout.status, detailDialog.payout.scheduledDate)}
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
