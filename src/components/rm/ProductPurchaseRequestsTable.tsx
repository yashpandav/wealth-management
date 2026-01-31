/**
 * RM - Product Purchase Requests Table Component
 * Displays product purchase requests with filtering, sorting, and actions
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
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  Eye,
  X,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';

import { toast } from 'react-hot-toast';

interface ProductRequest {
  id: string;
  trackingNumber: string;
  clientId: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  investment: {
    id: string;
    name: string;
    currency: string;
    minAmount: number;
    maxAmount: number | null;
  };
  investmentOption: {
    id: string;
    duration: string;
    withdrawalFrequency: string;
    roi: number;
    annualReturn: number;
  };
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  clientNotes: string | null;
  rmNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  processedAt: string | null;
}

interface ProductRequestsResponse {
  success: boolean;
  data: {
    requests: ProductRequest[];
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

async function fetchProductRequests(params: {
  page: number;
  search: string;
  status: string;
  sortBy: string;
  sortOrder: string;
}): Promise<ProductRequestsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);

  const response = await fetch(`/api/rm/product-requests?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product requests');
  }
  return response.json();
}

async function updateProductRequest(params: {
  id: string;
  action: 'APPROVE' | 'REJECT';
  payoutWindow?: '1-15' | '16-30';
  rmNotes?: string;
  rejectionReason?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`/api/rm/product-requests/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: params.action,
      payoutWindow: params.payoutWindow,
      rmNotes: params.rmNotes,
      rejectionReason: params.rejectionReason,
    }),
  });
  return response.json();
}

export function ProductPurchaseRequestsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    request: ProductRequest | null;
    action: 'APPROVE' | 'REJECT' | null;
  }>({
    open: false,
    request: null,
    action: null,
  });
  const [rmNotes, setRmNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [payoutWindow, setPayoutWindow] = useState<'1-15' | '16-30'>('1-15');

  // Detail view state
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    request: ProductRequest | null;
  }>({
    open: false,
    request: null,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['rm-product-requests', page, search, status, sortBy, sortOrder],
    queryFn: () => fetchProductRequests({ page, search, status, sortBy, sortOrder }),
  });

  // Separate query for global stats that doesn't change with search/filters
  const { data: globalStatsData } = useQuery({
    queryKey: ['rm-product-requests-stats'],
    queryFn: () => fetchProductRequests({ page: 1, search: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const mutation = useMutation({
    mutationFn: updateProductRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || 'Request updated successfully');
        queryClient.invalidateQueries({ queryKey: ['rm-product-requests'] });
        queryClient.invalidateQueries({ queryKey: ['rm-product-requests-stats'] });
        queryClient.invalidateQueries({ queryKey: ['rm-dashboard-stats'] });
        setActionDialog({ open: false, request: null, action: null });
        setRmNotes('');
        setRejectionReason('');
      } else {
        toast.error(result.error || 'Failed to update request');
      }
    },
    onError: () => {
      toast.error('Failed to update request');
    },
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleAction = (request: ProductRequest, action: 'APPROVE' | 'REJECT') => {
    setActionDialog({ open: true, request, action });
    setRmNotes('');
    setRejectionReason('');
    setPayoutWindow('1-15');
  };

  const confirmAction = () => {
    if (!actionDialog.request || !actionDialog.action) return;

    if (actionDialog.action === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    mutation.mutate({
      id: actionDialog.request.id,
      action: actionDialog.action,
      payoutWindow: actionDialog.action === 'APPROVE' ? payoutWindow : undefined,
      rmNotes: rmNotes.trim() || undefined,
      rejectionReason: rejectionReason.trim() || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700">Rejected</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-brand-blue/10 text-brand-blue">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };



  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load product requests. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const requests = data?.data.requests || [];
  const summary = globalStatsData?.data.summary;
  const pagination = data?.data.pagination;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summary && summary.byStatus.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-sm text-brand-grey font-medium">Total Requests</p>
            <p className="text-2xl font-bold text-brand-blue mt-1 font-nums">{summary.total}</p>
          </div>
          {summary.byStatus.map((s) => (
            <div key={s.status} className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-sm text-brand-grey font-medium capitalize">{s.status.toLowerCase()}</p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-2xl font-bold text-gray-900 font-nums">{s.count}</p>
                <div className="flex items-center text-xs text-brand-grey mb-1 font-nums">
                  <span className="mr-1 font-sans">Total:</span>
                  <DirhamIcon className="w-3 h-3 text-brand-grey mr-1" />
                  {s.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full sm:max-w-md flex-1">
            <Input
              placeholder="Search by tracking number, client, or product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value === 'all' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-brand-grey ml-auto whitespace-nowrap hidden md:block">
          <span className="font-nums">{pagination?.totalCount || 0}</span> total requests
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('trackingNumber')} className="h-8 px-2">
                    Tracking #
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('client')} className="h-8 px-2">
                    Client
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('product')} className="h-8 px-2">
                    Product
                  </Button>
                </TableHead>
                <TableHead>Plan Details</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('amount')} className="h-8 px-2">
                    Amount
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('createdAt')} className="h-8 px-2">
                    Date
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Searching...
                  </TableCell>
                </TableRow>
              ) : requests.length > 0 ? (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-sm font-nums">{req.trackingNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{req.client.firstName} {req.client.lastName}</p>
                        <p className="text-xs text-muted-foreground">{req.client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">{req.investment.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{req.investmentOption.duration}</p>
                        <p className="text-xs text-muted-foreground font-nums">
                          {req.investmentOption.withdrawalFrequency} | {req.investmentOption.annualReturn}% Annual
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end font-nums">
                        <span className="mr-1 text-xs text-muted-foreground font-sans">{req.investment.currency}</span>
                        {req.investment.currency === 'USD' ? <DirhamIcon className="w-3 h-3 mx-1" /> : null}
                        {req.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="font-nums">{format(new Date(req.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailDialog({ open: true, request: req })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {req.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleAction(req, 'APPROVE')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleAction(req, 'REJECT')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No product requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground font-nums">
            Showing {(pagination?.page - 1) * pagination?.limit + 1} to{' '}
            {Math.min(pagination?.page * pagination?.limit, pagination?.totalCount)} of{' '}
            {pagination?.totalCount} requests
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination?.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-nums">
              Page {pagination?.page || 1} of {pagination?.totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination?.hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setActionDialog({ open: false, request: null, action: null });
          setRmNotes('');
          setRejectionReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'APPROVE' ? 'Approve' : 'Reject'} Product Request
            </DialogTitle>
            <DialogDescription>
              {actionDialog.request && (
                <>
                  {actionDialog.action === 'APPROVE'
                    ? `Approve the investment request for ${actionDialog.request.investment.name}`
                    : `Reject the investment request for ${actionDialog.request.investment.name}`}
                  {' '}- {actionDialog.request.investment.currency !== 'USD' ? actionDialog.request.investment.currency : <span className="inline-flex items-center baseline"><DirhamIcon className="w-3 h-3 mx-1 self-center" /></span>} {actionDialog.request.amount.toLocaleString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.request && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Client:</strong> {actionDialog.request.client.firstName} {actionDialog.request.client.lastName}</p>
                <p><strong>Product:</strong> {actionDialog.request.investment.name}</p>
                <div className="flex items-center">
                  <strong className="mr-1">Amount:</strong>
                  {actionDialog.request.investment.currency !== 'USD' ? actionDialog.request.investment.currency : <DirhamIcon className="w-3 h-3 mx-1" />}
                  {actionDialog.request.amount.toLocaleString()}
                </div>
                <p><strong>Duration:</strong> {actionDialog.request.investmentOption.duration}</p>
                <p><strong>Withdrawal Frequency:</strong> {actionDialog.request.investmentOption.withdrawalFrequency}</p>
                <p><strong>Annual Return:</strong> {actionDialog.request.investmentOption.annualReturn}%</p>
                {actionDialog.request.clientNotes && (
                  <p><strong>Client Notes:</strong> {actionDialog.request.clientNotes}</p>
                )}
              </div>
            )}
            {actionDialog.action === 'APPROVE' && (
              <div className="space-y-3">
                <Label>Payout Window (Required)</Label>
                <p className="text-sm text-muted-foreground">
                  Select when interest payouts will be processed each period
                </p>
                <RadioGroup
                  value={payoutWindow}
                  onValueChange={(value) => setPayoutWindow(value as '1-15' | '16-30')}
                  className="space-y-3"
                >
                  <div
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setPayoutWindow('1-15')}
                  >
                    <RadioGroupItem value="1-15" id="window-1-15" />
                    <div className="flex-1">
                      <Label htmlFor="window-1-15" className="cursor-pointer font-medium">
                        1-15 (Payout on 15th)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Payouts will be processed on the 15th of each period
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setPayoutWindow('16-30')}
                  >
                    <RadioGroupItem value="16-30" id="window-16-30" />
                    <div className="flex-1">
                      <Label htmlFor="window-16-30" className="cursor-pointer font-medium">
                        16-30 (Payout on last day of month)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Payouts will be processed on the last day of each period
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rmNotes">Notes (Optional)</Label>
              <Textarea
                id="rmNotes"
                placeholder="Add any notes about this decision..."
                value={rmNotes}
                onChange={(e) => setRmNotes(e.target.value)}
              />
            </div>
            {actionDialog.action === 'REJECT' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason (Required)</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why this request is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, request: null, action: null })}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === 'APPROVE' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionDialog.action === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => {
        if (!open) setDetailDialog({ open: false, request: null });
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Product Request Details</DialogTitle>
          </DialogHeader>
          {detailDialog.request && (
            <div className="space-y-6">
              {/* Request Information */}
              <div className="bg-gray-50 p-5 rounded-lg space-y-3.5">
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <div className="text-sm font-medium text-gray-700">Tracking Number:</div>
                  <div className="text-sm text-gray-900 font-mono font-nums">{detailDialog.request.trackingNumber}</div>

                  <div className="text-sm font-medium text-gray-700">Status:</div>
                  <div className="text-sm text-gray-900">{getStatusBadge(detailDialog.request.status)}</div>

                  <div className="text-sm font-medium text-gray-700">Client:</div>
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">{detailDialog.request.client.firstName} {detailDialog.request.client.lastName}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{detailDialog.request.client.email}</div>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Product:</div>
                  <div className="text-sm text-gray-900 font-nums">{detailDialog.request.investment.name}</div>

                  <div className="text-sm font-medium text-gray-700">Amount:</div>
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    {detailDialog.request.investment.currency === 'USD' ? (
                      <DirhamIcon className="w-3 h-3" />
                    ) : (
                      <span className="font-nums">{detailDialog.request.investment.currency}</span>
                    )}
                    <span className="font-nums font-medium">{detailDialog.request.amount.toLocaleString()}</span>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Duration:</div>
                  <div className="text-sm text-gray-900">{detailDialog.request.investmentOption.duration}</div>

                  <div className="text-sm font-medium text-gray-700">Frequency:</div>
                  <div className="text-sm text-gray-900">{detailDialog.request.investmentOption.withdrawalFrequency}</div>

                  <div className="text-sm font-medium text-gray-700">ROI:</div>
                  <div className="text-sm text-gray-900 font-nums">{detailDialog.request.investmentOption.roi}%</div>

                  <div className="text-sm font-medium text-gray-700">Annual Return:</div>
                  <div className="text-sm text-green-600 font-medium font-nums">{detailDialog.request.investmentOption.annualReturn}%</div>

                  <div className="text-sm font-medium text-gray-700">Submitted:</div>
                  <div className="text-sm text-gray-900 font-nums">{format(new Date(detailDialog.request.createdAt), 'MMM dd, yyyy - h:mm a')}</div>

                  {detailDialog.request.processedAt && (
                    <>
                      <div className="text-sm font-medium text-gray-700">Processed:</div>
                      <div className="text-sm text-gray-900 font-nums">{format(new Date(detailDialog.request.processedAt), 'MMM dd, yyyy - h:mm a')}</div>
                    </>
                  )}

                  {detailDialog.request.clientNotes && (
                    <>
                      <div className="text-sm font-medium text-gray-700">Client Notes:</div>
                      <div className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200">{detailDialog.request.clientNotes}</div>
                    </>
                  )}

                  {detailDialog.request.rmNotes && (
                    <>
                      <div className="text-sm font-medium text-gray-700">RM Notes:</div>
                      <div className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200">{detailDialog.request.rmNotes}</div>
                    </>
                  )}

                  {detailDialog.request.rejectionReason && (
                    <>
                      <div className="text-sm font-medium text-gray-700">Rejection Reason:</div>
                      <div className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">{detailDialog.request.rejectionReason}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, request: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
