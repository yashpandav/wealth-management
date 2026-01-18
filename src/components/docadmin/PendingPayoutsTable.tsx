/**
 * DocAdmin - Pending Payouts Table Component
 * Displays pending payouts with filtering and receipt upload
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Loader2,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { toast } from 'react-hot-toast';

interface Payout {
  id: string;
  clientId: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
  createdAt: string;
}

interface PayoutsResponse {
  success: boolean;
  data: {
    payouts: Payout[];
    summary: {
      total: number;
      byStatus: Array<{
        status: string;
        count: number;
        totalAmount: number;
      }>;
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
  search: string;
  dateFrom: string;
  dateTo: string;
}): Promise<PayoutsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
    status: 'PENDING',
  });

  if (params.search) queryParams.append('search', params.search);
  if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) queryParams.append('dateTo', params.dateTo);

  const response = await fetch(`/api/docadmin/payouts?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch payouts');
  }
  return response.json();
}

async function completePayout(data: {
  payoutId: string;
  file: File;
  notes: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('notes', data.notes);

  const response = await fetch(`/api/docadmin/payouts/${data.payoutId}/complete`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to complete payout');
  }

  return response.json();
}

export function PendingPayoutsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [uploadDialog, setUploadDialog] = useState<{
    open: boolean;
    payout: Payout | null;
  }>({ open: false, payout: null });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');

  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    payout: Payout | null;
  }>({ open: false, payout: null });

  const { data, isLoading, error } = useQuery({
    queryKey: ['docadmin-payouts', page, search, dateFrom, dateTo],
    queryFn: () => fetchPayouts({ page, search, dateFrom, dateTo }),
  });

  const uploadMutation = useMutation({
    mutationFn: completePayout,
    onSuccess: () => {
      toast.success('Payout completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['docadmin-payouts'] });
      setUploadDialog({ open: false, payout: null });
      setReceiptFile(null);
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleUploadReceipt = () => {
    if (!uploadDialog.payout || !receiptFile) {
      toast.error('Please select a receipt file');
      return;
    }

    uploadMutation.mutate({
      payoutId: uploadDialog.payout.id,
      file: receiptFile,
      notes,
    });
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
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-nums">{summary.total}</div>
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
                  {Number(s.totalAmount).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder="Search by client name or tracking number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-[150px]"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-[150px]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
                  <TableCell className="font-nums">{format(new Date(payout.scheduledDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payout.client.firstName} {payout.client.lastName}</p>
                      <p className="text-xs text-muted-foreground">{payout.client.email}</p>
                    </div>
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailDialog({ open: true, payout })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => setUploadDialog({ open: true, payout })}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No pending payouts found
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

      {/* Upload Receipt Dialog */}
      <Dialog
        open={uploadDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setUploadDialog({ open: false, payout: null });
            setReceiptFile(null);
            setNotes('');
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Payout Receipt</DialogTitle>
            <DialogDescription>
              Upload the payment receipt to complete this payout.
            </DialogDescription>
          </DialogHeader>

          {uploadDialog.payout && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <strong>Client:</strong> {uploadDialog.payout.client.firstName}{' '}
                  {uploadDialog.payout.client.lastName}
                </p>
                <p className="text-sm">
                  <strong>Product:</strong> {uploadDialog.payout.productPurchaseRequest.investment.name}
                </p>
                <p className="text-sm flex items-center">
                  <strong className="mr-1">Amount:</strong>
                  {uploadDialog.payout.productPurchaseRequest.investment.currency !== 'USD'
                    ? uploadDialog.payout.productPurchaseRequest.investment.currency
                    : <DirhamIcon className="w-3 h-3 mx-1" />}
                  <span className="font-nums">{uploadDialog.payout.amount.toLocaleString()}</span>
                </p>
                <p className="text-sm">
                  <strong>Period:</strong>{' '}
                  <span className="font-nums">
                    {format(new Date(uploadDialog.payout.periodStart), 'MMM dd, yyyy')} -{' '}
                    {format(new Date(uploadDialog.payout.periodEnd), 'MMM dd, yyyy')}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-file">Payment Receipt (PDF/Image) *</Label>
                <Input
                  id="receipt-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  disabled={uploadMutation.isPending}
                />
                {receiptFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {receiptFile.name} (<span className="font-nums">{(receiptFile.size / 1024).toFixed(2)}</span> KB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this payout..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={uploadMutation.isPending}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialog({ open: false, payout: null })}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadReceipt}
              disabled={!receiptFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                    {detailDialog.payout.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">
                  {detailDialog.payout.client.firstName} {detailDialog.payout.client.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{detailDialog.payout.client.email}</p>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, payout: null })}>
              Close
            </Button>
            <Button
              onClick={() => {
                setDetailDialog({ open: false, payout: null });
                setUploadDialog({ open: true, payout: detailDialog.payout });
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
