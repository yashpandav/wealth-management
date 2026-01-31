/**
 * DocAdmin Product Requests Client Component
 * Simple table view for managing product requests (no tabs)
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Upload, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface ProductRequest {
  id: string;
  trackingNumber: string;
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
  };
  investmentOption: {
    duration: string;
    roi: number;
    annualReturn: number;
  };
  amount: number;
  status: string;
  assignedRM: {
    id: string;
    name: string;
  } | null;
  clientNotes: string | null;
  rmNotes: string | null;
  createdAt: string;
}

interface RequestsResponse {
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
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

async function fetchProductRequests(params: {
  page: number;
  status: string;
  search: string;
}): Promise<RequestsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
  });

  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);

  const response = await fetch(`/api/docadmin/product-requests?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch product requests');
  return response.json();
}

async function uploadContract(data: {
  requestId: string;
  file: File;
  notes: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('notes', data.notes);

  const response = await fetch(`/api/docadmin/product-requests/${data.requestId}/upload-contract`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload contract');
  }

  return response.json();
}

interface ProductRequestsClientProps {
  statusFilter?: string;
  showUploadButton?: boolean;
}

export function ProductRequestsClient({
  statusFilter = '',
  showUploadButton = false
}: ProductRequestsClientProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(statusFilter);
  const [search, setSearch] = useState('');
  const [uploadDialog, setUploadDialog] = useState<{
    open: boolean;
    request: ProductRequest | null;
  }>({ open: false, request: null });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    request: ProductRequest | null;
  }>({ open: false, request: null });

  const { data, isLoading, error } = useQuery({
    queryKey: ['docadmin-product-requests', page, status, search],
    queryFn: () => fetchProductRequests({ page, status, search }),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadContract,
    onSuccess: () => {
      toast.success('Contract uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['docadmin-product-requests'] });
      setUploadDialog({ open: false, request: null });
      setContractFile(null);
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleUploadContract = () => {
    if (!uploadDialog.request || !contractFile) {
      toast.error('Please select a contract file');
      return;
    }

    uploadMutation.mutate({
      requestId: uploadDialog.request.id,
      file: contractFile,
      notes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-brand-blue/10/10 text-brand-blue">Approved</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700">Completed</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700">Rejected</Badge>;
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
  const pagination = data?.data.pagination;
  const summary = data?.data.summary;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && summary.byStatus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-nums">{summary.total}</div>
            </CardContent>
          </Card>
          {summary.byStatus.map((s) => (
            <Card key={s.status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground capitalize">{s.status.toLowerCase().replace(/_/g, ' ')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-nums">{s.count}</div>
                <p className="text-xs text-muted-foreground font-nums">
                  Total: ${Number(s.totalAmount).toLocaleString()}
                </p>
              </CardContent>
            </Card>
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
        {!statusFilter && (
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value === 'ALL' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Plan Details</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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
                  <TableCell className="font-mono text-sm">{req.trackingNumber}</TableCell>
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
                      <p className="text-xs text-muted-foreground">
                        <span className="font-nums">{req.investmentOption.annualReturn}</span>% Annual
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium font-nums">
                    {req.investment.currency} {Number(req.amount).toLocaleString()}
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
                      {showUploadButton && req.status === 'APPROVED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-brand-blue hover:text-brand-blue/80 hover:bg-brand-blue/5"
                          onClick={() => setUploadDialog({ open: true, request: req })}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
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
            Showing <span className="font-nums">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-nums">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-nums">{pagination.total}</span> requests
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

      {/* Upload Contract Dialog */}
      <Dialog open={uploadDialog.open} onOpenChange={(open) => {
        if (!open) {
          setUploadDialog({ open: false, request: null });
          setContractFile(null);
          setNotes('');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Contract</DialogTitle>
            <DialogDescription>
              Upload the signed contract to complete this product purchase request.
            </DialogDescription>
          </DialogHeader>

          {uploadDialog.request && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <strong>Client:</strong> {uploadDialog.request.client.firstName} {uploadDialog.request.client.lastName}
                </p>
                <p className="text-sm">
                  <strong>Product:</strong> {uploadDialog.request.investment.name}
                </p>
                <p className="text-sm">
                  <strong>Amount:</strong> {uploadDialog.request.investment.currency} {Number(uploadDialog.request.amount).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-file">Contract Document (PDF/Image) *</Label>
                <Input
                  id="contract-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                  disabled={uploadMutation.isPending}
                />
                {contractFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {contractFile.name} (<span className="font-nums">{(contractFile.size / 1024).toFixed(2)}</span> KB)
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Contract start date will be automatically set to the approval date.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about the contract..."
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
              onClick={() => setUploadDialog({ open: false, request: null })}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadContract}
              disabled={!contractFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload & Complete
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
            <DialogTitle>Plan Request Details</DialogTitle>
          </DialogHeader>
          {detailDialog.request && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{detailDialog.request.investment.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium font-nums">{detailDialog.request.investment.currency} {Number(detailDialog.request.amount).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p>{detailDialog.request.investmentOption.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Return</p>
                  <p className="text-green-600 font-medium"><span className="font-nums">{detailDialog.request.investmentOption.annualReturn}</span>%</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-nums">{format(new Date(detailDialog.request.createdAt), 'PPp')}</p>
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
              {detailDialog.request.assignedRM && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned RM</p>
                  <p className="font-medium">{detailDialog.request.assignedRM.name}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, request: null })}>
              Close
            </Button>
            {showUploadButton && detailDialog.request?.status === 'APPROVED' && (
              <Button
                onClick={() => {
                  setDetailDialog({ open: false, request: null });
                  setUploadDialog({ open: true, request: detailDialog.request });
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Contract
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
