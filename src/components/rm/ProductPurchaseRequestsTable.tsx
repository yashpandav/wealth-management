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
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  X,
  Eye,
} from 'lucide-react';
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
  product: {
    id: string;
    name: string;
    currency: string;
    minAmount: number;
    maxAmount: number | null;
  };
  productOption: {
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
  rmNotes?: string;
  rejectionReason?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`/api/rm/product-requests/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: params.action,
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

  const mutation = useMutation({
    mutationFn: updateProductRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || 'Request updated successfully');
        queryClient.invalidateQueries({ queryKey: ['rm-product-requests'] });
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
        return <Badge variant="outline" className="bg-brand-blue/10/10 text-brand-blue">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading product requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load product requests. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const requests = data?.data.requests || [];
  const pagination = data?.data.pagination;
  const summary = data?.data.summary;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summary && summary.byStatus.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          {summary.byStatus.map((s) => (
            <div key={s.status} className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">{s.status}</p>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs text-muted-foreground">
                Total: ${s.totalAmount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder="Search by tracking number, client, or product..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value === 'all' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
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
        <div className="text-sm text-muted-foreground">
          {pagination?.totalCount || 0} total requests
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
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
            {requests.length > 0 ? (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-sm">{req.trackingNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{req.client.firstName} {req.client.lastName}</p>
                      <p className="text-xs text-muted-foreground">{req.client.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">{req.product.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{req.productOption.duration}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.productOption.withdrawalFrequency} | {req.productOption.annualReturn}% Annual
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {req.product.currency} {req.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell>{format(new Date(req.createdAt), 'MMM dd, yyyy')}</TableCell>
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
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} requests
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
            <div className="text-sm">
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
                    ? `Approve the product purchase request for ${actionDialog.request.product.name}`
                    : `Reject the product purchase request for ${actionDialog.request.product.name}`}
                  {' '}- {actionDialog.request.product.currency} {actionDialog.request.amount.toLocaleString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.request && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Client:</strong> {actionDialog.request.client.firstName} {actionDialog.request.client.lastName}</p>
                <p><strong>Product:</strong> {actionDialog.request.product.name}</p>
                <p><strong>Amount:</strong> {actionDialog.request.product.currency} {actionDialog.request.amount.toLocaleString()}</p>
                <p><strong>Duration:</strong> {actionDialog.request.productOption.duration}</p>
                <p><strong>Annual Return:</strong> {actionDialog.request.productOption.annualReturn}%</p>
                {actionDialog.request.clientNotes && (
                  <p><strong>Client Notes:</strong> {actionDialog.request.clientNotes}</p>
                )}
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-mono">{detailDialog.request.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(detailDialog.request.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{detailDialog.request.client.firstName} {detailDialog.request.client.lastName}</p>
                <p className="text-sm text-muted-foreground">{detailDialog.request.client.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{detailDialog.request.product.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{detailDialog.request.product.currency} {detailDialog.request.amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p>{detailDialog.request.productOption.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Withdrawal Frequency</p>
                  <p>{detailDialog.request.productOption.withdrawalFrequency}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p>{detailDialog.request.productOption.roi}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Return</p>
                  <p className="text-green-600 font-medium">{detailDialog.request.productOption.annualReturn}%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p>{format(new Date(detailDialog.request.createdAt), 'PPp')}</p>
                </div>
                {detailDialog.request.processedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Processed</p>
                    <p>{format(new Date(detailDialog.request.processedAt), 'PPp')}</p>
                  </div>
                )}
              </div>
              {detailDialog.request.clientNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">Client Notes</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{detailDialog.request.clientNotes}</p>
                </div>
              )}
              {detailDialog.request.rmNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">RM Notes</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{detailDialog.request.rmNotes}</p>
                </div>
              )}
              {detailDialog.request.rejectionReason && (
                <div>
                  <p className="text-sm text-muted-foreground">Rejection Reason</p>
                  <p className="text-sm bg-red-50 text-red-700 p-2 rounded">{detailDialog.request.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, request: null })}>
              Close
            </Button>
            {detailDialog.request?.status === 'PENDING' && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    setDetailDialog({ open: false, request: null });
                    handleAction(detailDialog.request!, 'APPROVE');
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailDialog({ open: false, request: null });
                    handleAction(detailDialog.request!, 'REJECT');
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
