/**
 * Admin - All Investment Purchase Requests Page
 * View and manage all investment purchase requests across all statuses
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { toast } from 'react-hot-toast';
import {
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { RequestStatus } from '@prisma/client';

interface Client {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Investment {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
}

interface InvestmentOption {
  id: string;
  duration: string;
  withdrawalFrequency: string;
  roi: number;
  annualReturn: number;
}

interface AssignedRM {
  user: {
    firstName: string;
    lastName: string;
  };
}

interface PurchaseRequest {
  id: string;
  trackingNumber: string;
  amount: number;
  status: RequestStatus;
  clientNotes: string | null;
  rmNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  client: Client;
  investment: Investment;
  investmentOption: InvestmentOption;
  assignedRM: AssignedRM | null;
}

interface Summary {
  total: number;
  totalAmount: number;
  byStatus: {
    status: RequestStatus;
    count: number;
    totalAmount: number;
  }[];
}

interface ApiResponse {
  success: boolean;
  data?: {
    requests: PurchaseRequest[];
    summary: Summary | null;
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

const STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_ICONS: Record<RequestStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  PROCESSING: <RefreshCw className="h-4 w-4" />,
  APPROVED: <CheckCircle className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
};

export default function AdminPurchaseRequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect if not authenticated or not ADMIN
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/error?error=AccessDenied');
    }
  }, [sessionStatus, session, router]);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/product-requests?${params.toString()}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setRequests(data.data.requests);
        setSummary(data.data.summary);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.totalCount);
      } else {
        toast.error(data.error || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchRequests();
    }
  }, [sessionStatus, session, fetchRequests]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openDetailsModal = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as RequestStatus | 'ALL');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusCount = (status: RequestStatus): number => {
    if (!summary) return 0;
    const statusSummary = summary.byStatus.find((s) => s.status === status);
    return statusSummary?.count || 0;
  };

  const getStatusAmount = (status: RequestStatus): number => {
    if (!summary) return 0;
    const statusSummary = summary.byStatus.find((s) => s.status === status);
    return statusSummary?.totalAmount || 0;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading investment requests..." />
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-8">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue mb-2">
          Investment Requests
        </h1>
        <p className="font-georgia text-brand-grey">
          View and manage all investment purchase requests across all statuses
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Requests</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-brand-blue font-nums">
                {summary.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <DirhamIcon className="h-4 w-4 mr-1" />
                <span className="font-nums">
                  {summary.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-yellow-600 font-nums">
                {getStatusCount('PENDING')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <DirhamIcon className="h-4 w-4 mr-1" />
                <span className="font-nums">
                  {getStatusAmount('PENDING').toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-green-600 font-nums">
                {getStatusCount('APPROVED')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <DirhamIcon className="h-4 w-4 mr-1" />
                <span className="font-nums">
                  {getStatusAmount('APPROVED').toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-purple-600 font-nums">
                {getStatusCount('COMPLETED')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <DirhamIcon className="h-4 w-4 mr-1" />
                <span className="font-nums">
                  {getStatusAmount('COMPLETED').toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by tracking #, client name, email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Investment Requests</CardTitle>
              <CardDescription>
                Showing {requests.length} of {totalCount} requests
              </CardDescription>
            </div>
            <Button onClick={fetchRequests} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12">
              <LoadingSpinner text="Loading..." />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No investment requests found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Investment Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>RM</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                          <TableCell className="font-mono text-sm">
                            {request.trackingNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {request.client.user.firstName} {request.client.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {request.client.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.investment.name}</div>
                              <div className="text-xs text-gray-500">
                                {request.investmentOption.duration} •{' '}
                                {request.investmentOption.roi}% ROI
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center font-semibold">
                              <DirhamIcon className="h-4 w-4 mr-1" />
                              <span className="font-nums">
                                {request.amount.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${STATUS_COLORS[request.status]} flex items-center gap-1 w-fit`}
                            >
                              {STATUS_ICONS[request.status]}
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.assignedRM ? (
                              <div className="text-sm">
                                {request.assignedRM.user.firstName}{' '}
                                {request.assignedRM.user.lastName}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(request.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsModal(request)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeDetailsModal()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Investment Request Details
                </DialogTitle>
                <DialogDescription>
                  Tracking Number: {selectedRequest.trackingNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Client Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-brand-blue">
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">
                        {selectedRequest.client.user.firstName}{' '}
                        {selectedRequest.client.user.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-medium">{selectedRequest.client.user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Investment Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-brand-blue">
                    Investment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Investment Plan:</span>
                      <p className="font-medium">{selectedRequest.investment.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Amount:</span>
                      <p className="font-semibold flex items-center">
                        <DirhamIcon className="h-4 w-4 mr-1" />
                        <span className="font-nums">
                          {selectedRequest.amount.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Duration:</span>
                      <p className="font-medium">
                        {selectedRequest.investmentOption.duration}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Payout Frequency:</span>
                      <p className="font-medium">
                        {selectedRequest.investmentOption.withdrawalFrequency}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">ROI:</span>
                      <p className="font-semibold text-green-600 font-nums">
                        {selectedRequest.investmentOption.roi}%
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Annual Return:</span>
                      <p className="font-semibold text-green-600 font-nums">
                        {selectedRequest.investmentOption.annualReturn}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-brand-blue">
                    Status Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Current Status:</span>
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className={`${STATUS_COLORS[selectedRequest.status]} flex items-center gap-1 w-fit`}
                        >
                          {STATUS_ICONS[selectedRequest.status]}
                          {selectedRequest.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Assigned RM:</span>
                      <p className="font-medium">
                        {selectedRequest.assignedRM ? (
                          <>
                            {selectedRequest.assignedRM.user.firstName}{' '}
                            {selectedRequest.assignedRM.user.lastName}
                          </>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Created:</span>
                      <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <p className="font-medium">{formatDate(selectedRequest.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {(selectedRequest.clientNotes ||
                  selectedRequest.rmNotes ||
                  selectedRequest.rejectionReason) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-brand-blue">Notes</h3>
                    <div className="space-y-3">
                      {selectedRequest.clientNotes && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <span className="text-sm font-semibold text-blue-900 block mb-2">
                            Client Notes:
                          </span>
                          <p className="text-gray-800">{selectedRequest.clientNotes}</p>
                        </div>
                      )}
                      {selectedRequest.rmNotes && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <span className="text-sm font-semibold text-purple-900 block mb-2">
                            RM Notes:
                          </span>
                          <p className="text-gray-800">{selectedRequest.rmNotes}</p>
                        </div>
                      )}
                      {selectedRequest.rejectionReason && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <span className="text-sm font-semibold text-red-900 block mb-2">
                            Rejection Reason:
                          </span>
                          <p className="text-red-800">{selectedRequest.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
