/**
 * Client - Investment Requests Page
 * View and track purchase request status
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  TrendingUp,
  Hourglass,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RequestStatus } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { DirhamIcon } from '@/components/ui/dirham-icon';

interface ProductPurchaseRequest {
  id: string;
  trackingNumber: string;
  status: RequestStatus;
  amount: number;
  clientNotes: string | null;
  rmNotes: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  contractDocumentId: string | null;
  isWaitingForContract?: boolean;
  investment: {
    id: string;
    name: string;
    currency: string;
  };
  investmentOption: {
    id: string;
    duration: string;
    withdrawalFrequency: string;
    roi: number;
    annualReturn: number;
  };
}

export default function ClientRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ProductPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    request: ProductPurchaseRequest | null;
  }>({
    open: false,
    request: null,
  });
  const itemsPerPage = 10;

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch purchase requests
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      fetchRequests();
    }
  }, [status, session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const productRes = await fetch('/api/client/product-requests');
      const productData = await productRes.json();

      let allRequests: ProductPurchaseRequest[] = [];

      if (productData.success && productData.data?.requests) {
        const productRequests = productData.data.requests.map((req: Omit<ProductPurchaseRequest, 'isWaitingForContract'>) => {
          let requestStatus = req.status;
          let isWaitingForContract = false;

          // If request is approved but no contract document yet, show as PROCESSING
          if (requestStatus === 'APPROVED' && !req.contractDocumentId) {
            requestStatus = 'PROCESSING' as RequestStatus;
            isWaitingForContract = true;
          }

          return {
            ...req,
            status: requestStatus,
            isWaitingForContract
          };
        });
        allRequests = productRequests;
      }

      // Sort by createdAt desc
      allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRequests(allRequests);

      if (!productData.success) {
        toast.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case RequestStatus.PROCESSING:
        return <Hourglass className="h-5 w-5 text-brand-blue" />;
      case RequestStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case RequestStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case RequestStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-700" />;
      case RequestStatus.CANCELLED:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants: Record<RequestStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      [RequestStatus.PENDING]: { variant: 'outline', label: 'Pending Review' },
      [RequestStatus.PROCESSING]: { variant: 'default', label: 'Processing' },
      [RequestStatus.APPROVED]: { variant: 'default', label: 'Approved' },
      [RequestStatus.REJECTED]: { variant: 'destructive', label: 'Rejected' },
      [RequestStatus.COMPLETED]: { variant: 'default', label: 'Completed' },
      [RequestStatus.CANCELLED]: { variant: 'secondary', label: 'Cancelled' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className="font-medium">
        {config.label}
      </Badge>
    );
  };

  const getStatusMessage = (request: ProductPurchaseRequest) => {
    switch (request.status) {
      case RequestStatus.PENDING:
        return 'Your request is awaiting review by your Relationship Manager.';
      case RequestStatus.PROCESSING:
        if (request.isWaitingForContract) {
          return 'Your request has been approved by your Relationship Manager. Initial contract is being prepared.';
        }
        return 'Your request is being processed by your Relationship Manager.';
      case RequestStatus.APPROVED:
        return 'Your request has been approved! The transaction will be completed shortly.';
      case RequestStatus.REJECTED:
        return request.rmNotes
          ? `Request rejected: ${request.rmNotes}`
          : 'Your request could not be approved. Please contact your Relationship Manager for details.';
      case RequestStatus.COMPLETED:
        return 'Transaction completed successfully. Check your portfolio for details.';
      case RequestStatus.CANCELLED:
        return 'This request was cancelled.';
      default:
        return '';
    }
  };

  // Filter and search
  const filteredRequests = requests
    .filter(req => selectedStatus === 'ALL' || req.status === selectedStatus)
    .filter(req => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        req.trackingNumber.toLowerCase().includes(query) ||
        req.investment.name.toLowerCase().includes(query) ||
        req.status.toLowerCase().includes(query)
      );
    });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary stats
  const summaryStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === RequestStatus.PENDING).length,
    processing: requests.filter(r => r.status === RequestStatus.PROCESSING).length,
    approved: requests.filter(r => r.status === RequestStatus.APPROVED).length,
    rejected: requests.filter(r => r.status === RequestStatus.REJECTED).length,
    completed: requests.filter(r => r.status === RequestStatus.COMPLETED).length,
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchQuery]);

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role === 'CLIENT' && loading)) {
    return <LoadingSpinner text="Loading purchase requests..." className="min-h-screen" />;
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'CLIENT')) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">My Investment Requests</h1>
          <p className="font-georgia text-brand-grey mt-2">
            Track the status of your investment requests
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm" className="font-optima">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-brand-grey font-medium">Total</p>
          <p className="text-2xl font-bold text-brand-blue mt-1 font-nums">{summaryStats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-brand-grey font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1 font-nums">{summaryStats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-brand-grey font-medium">Processing</p>
          <p className="text-2xl font-bold text-blue-600 mt-1 font-nums">{summaryStats.processing}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-brand-grey font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1 font-nums">{summaryStats.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-brand-grey font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-700 mt-1 font-nums">{summaryStats.completed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-brand-grey font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1 font-nums">{summaryStats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full sm:max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tracking number, plan, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select
            value={selectedStatus === 'ALL' ? 'all' : selectedStatus}
            onValueChange={(value) => setSelectedStatus(value === 'all' ? 'ALL' : value as RequestStatus)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={RequestStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={RequestStatus.PROCESSING}>Processing</SelectItem>
              <SelectItem value={RequestStatus.APPROVED}>Approved</SelectItem>
              <SelectItem value={RequestStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={RequestStatus.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-brand-grey ml-auto whitespace-nowrap hidden md:block">
          <span className="font-nums">{filteredRequests.length}</span> {filteredRequests.length === 1 ? 'request' : 'requests'}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white mb-6">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {selectedStatus === 'ALL'
                ? 'No investment requests yet'
                : `No ${selectedStatus.toLowerCase()} requests`}
            </p>
            <p className="text-muted-foreground mb-4">
              {selectedStatus === 'ALL'
                ? 'Submit your first investment request to start investing'
                : 'Try selecting a different status filter'}
            </p>
            {selectedStatus === 'ALL' && (
              <Button onClick={() => router.push('/client/products')}>
                Browse Plans
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm font-nums">
                      {request.trackingNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {request.investment.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{request.investmentOption.duration}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.investmentOption.withdrawalFrequency}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end font-nums">
                        {request.investment.currency === 'USD' ? (
                          <DirhamIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <span className="mr-1 text-xs text-muted-foreground font-sans">
                            {request.investment.currency}
                          </span>
                        )}
                        {request.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                        <span className="text-sm font-medium text-green-600 font-nums">
                          {request.investmentOption.annualReturn}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="font-nums text-sm">
                      {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailDialog({ open: true, request })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground font-nums">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{' '}
            {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-nums">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => {
        if (!open) setDetailDialog({ open: false, request: null });
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-optima">Request Details</DialogTitle>
            <DialogDescription className="font-mono font-nums">
              {detailDialog.request?.trackingNumber}
            </DialogDescription>
          </DialogHeader>
          {detailDialog.request && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 ${
                detailDialog.request.status === RequestStatus.APPROVED || detailDialog.request.status === RequestStatus.COMPLETED
                  ? 'bg-green-50 border border-green-200'
                  : detailDialog.request.status === RequestStatus.REJECTED
                    ? 'bg-red-50 border border-red-200'
                    : detailDialog.request.status === RequestStatus.PROCESSING
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(detailDialog.request.status)}
                  <span className="font-medium">{getStatusBadge(detailDialog.request.status)}</span>
                </div>
                <p className={`text-sm ${
                  detailDialog.request.status === RequestStatus.APPROVED || detailDialog.request.status === RequestStatus.COMPLETED
                    ? 'text-green-900'
                    : detailDialog.request.status === RequestStatus.REJECTED
                      ? 'text-red-900'
                      : detailDialog.request.status === RequestStatus.PROCESSING
                        ? 'text-blue-900'
                        : 'text-yellow-900'
                }`}>
                  {getStatusMessage(detailDialog.request)}
                </p>
              </div>

              {/* Investment Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-medium text-brand-blue font-optima">Investment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plan</p>
                    <p className="font-medium">{detailDialog.request.investment.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium flex items-center font-nums">
                      {detailDialog.request.investment.currency === 'USD' ? (
                        <DirhamIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <span className="mr-1 text-xs">{detailDialog.request.investment.currency}</span>
                      )}
                      {detailDialog.request.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{detailDialog.request.investmentOption.duration}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Withdrawal Frequency</p>
                    <p className="font-medium">{detailDialog.request.investmentOption.withdrawalFrequency}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROI</p>
                    <p className="font-medium text-green-600 font-nums">{detailDialog.request.investmentOption.roi}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Annual Return</p>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <p className="font-medium text-green-600 font-nums">{detailDialog.request.investmentOption.annualReturn}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <h3 className="font-medium text-brand-blue font-optima">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-brand-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Submitted</p>
                      <p className="text-muted-foreground font-nums">
                        {format(new Date(detailDialog.request.createdAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                  {detailDialog.request.processedAt && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 items-center justify-center">
                        <div className={`h-2 w-2 rounded-full ${
                          detailDialog.request.status === RequestStatus.APPROVED || detailDialog.request.status === RequestStatus.COMPLETED
                            ? 'bg-green-600'
                            : detailDialog.request.status === RequestStatus.REJECTED
                              ? 'bg-red-600'
                              : 'bg-brand-blue'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {detailDialog.request.status === RequestStatus.APPROVED || detailDialog.request.status === RequestStatus.COMPLETED
                            ? 'Approved'
                            : detailDialog.request.status === RequestStatus.REJECTED
                              ? 'Rejected'
                              : 'Processed'}
                        </p>
                        <p className="text-muted-foreground font-nums">
                          {format(new Date(detailDialog.request.processedAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Notes */}
              {detailDialog.request.clientNotes && (
                <div>
                  <h3 className="font-medium text-brand-blue font-optima mb-2">Your Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {detailDialog.request.clientNotes}
                  </p>
                </div>
              )}

              {/* RM Feedback */}
              {detailDialog.request.rmNotes && (
                <div>
                  <h3 className="font-medium text-brand-blue font-optima mb-2">RM Feedback</h3>
                  <p className={`text-sm p-3 rounded-md ${
                    detailDialog.request.status === RequestStatus.REJECTED
                      ? 'bg-red-50 border border-red-200 text-red-900'
                      : 'bg-muted'
                  }`}>
                    {detailDialog.request.rmNotes}
                  </p>
                </div>
              )}
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
