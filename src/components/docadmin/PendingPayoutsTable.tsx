/**
 * DocAdmin - Pending Payouts Table Component
 * Displays pending payouts with filtering and receipt upload
 * Tabs: Upcoming (next 2 days) | Completed
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckCircle2,
  Clock,
  Download,
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
  status: string;
}): Promise<PayoutsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
    status: params.status,
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
  const [activeTab, setActiveTab] = useState<'missed' | 'pending' | 'scheduled' | 'completed'>('pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

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

  // Calculate date ranges based on active tab
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(23, 59, 59, 999);

    switch (activeTab) {
      case 'missed':
        // PENDING payouts before today
        return {
          status: 'PENDING',
          dateFrom: '',
          dateTo: today.toISOString(),
        };
      case 'pending':
        // PENDING payouts for today only
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        return {
          status: 'PENDING',
          dateFrom: today.toISOString(),
          dateTo: endOfToday.toISOString(),
        };
      case 'scheduled':
        // PENDING payouts after today (future)
        return {
          status: 'PENDING',
          dateFrom: tomorrow.toISOString(),
          dateTo: twoDaysFromNow.toISOString(),
        };
      case 'completed':
        return {
          status: 'COMPLETED',
          dateFrom: '',
          dateTo: '',
        };
      default:
        return {
          status: 'PENDING',
          dateFrom: '',
          dateTo: '',
        };
    }
  };

  const dateRange = getDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: ['docadmin-payouts', page, search, activeTab],
    queryFn: () => fetchPayouts({
      page,
      search,
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
      status: dateRange.status,
    }),
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

  const handleDownloadReceipt = (filePath: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset page when changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'missed' | 'pending' | 'scheduled' | 'completed');
    setPage(1);
  };

  const getStatusBadge = (status: string, scheduledDate: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0);

    switch (status) {
      case 'PENDING':
        if (scheduled < now) {
          return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300">Missed</Badge>;
        } else if (scheduled.getTime() === now.getTime()) {
          return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300">Pending</Badge>;
        } else {
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
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-100 h-auto">
        <TabsTrigger value="pending" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-blue text-xs sm:text-sm py-2">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
          Pending
        </TabsTrigger>
        <TabsTrigger value="scheduled" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-blue text-xs sm:text-sm py-2">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
          Upcoming
        </TabsTrigger>
        <TabsTrigger value="missed" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-blue text-xs sm:text-sm py-2">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          Missed
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-blue text-xs sm:text-sm py-2">
          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
          Completed
        </TabsTrigger>
      </TabsList>

      {/* MISSED TAB */}
      <TabsContent value="missed" className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 max-w-xs">
            <Card className="border-gray-300 bg-white">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  Missed Payouts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold font-nums text-gray-900">{summary.total}</div>
                <p className="text-xs text-gray-600 mt-1">
                  Overdue payouts
                </p>
              </CardContent>
            </Card>
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
            className="max-w-sm font-nums"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
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
                      <Badge variant="outline" className="font-medium border-gray-300 font-nums">
                        {payout.productPurchaseRequest.investment.name}
                      </Badge>
                      <p className="text-xs text-brand-grey mt-1 font-nums">
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
                        {payout.productPurchaseRequest.investment.currency === 'USD' ? (
                          <DirhamIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <span className="mr-1 text-xs text-grey font-nums">
                            {payout.productPurchaseRequest.investment.currency}
                          </span>
                        )}
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <p className="text-muted-foreground">No missed payouts</p>
                      <p className="text-sm text-muted-foreground">
                        All payouts are up to date
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
      </TabsContent>

      {/* PENDING TODAY TAB */}
      <TabsContent value="pending" className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 max-w-xs">
            <Card className="border-gray-300 bg-white">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-600" />
                  Pending Today
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold font-nums text-gray-900">{summary.total}</div>
                <p className="text-xs text-gray-600 mt-1">
                  Due today
                </p>
              </CardContent>
            </Card>
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
            className="max-w-sm font-nums"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
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
                      <Badge variant="outline" className="font-medium border-gray-300 font-nums">
                        {payout.productPurchaseRequest.investment.name}
                      </Badge>
                      <p className="text-xs text-brand-grey mt-1 font-nums">
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
                        {payout.productPurchaseRequest.investment.currency === 'USD' ? (
                          <DirhamIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <span className="mr-1 text-xs font-sans">
                            {payout.productPurchaseRequest.investment.currency}
                          </span>
                        )}
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <p className="text-muted-foreground">No payouts due today</p>
                      <p className="text-sm text-muted-foreground">
                        Today&apos;s payouts will appear here
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
      </TabsContent>

      {/* SCHEDULED TAB */}
      <TabsContent value="scheduled" className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 max-w-xs">
            <Card className="border-gray-300 bg-white">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  Upcoming Payouts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold font-nums text-gray-900">{summary.total}</div>
                <p className="text-xs text-gray-600 mt-1">
                  Due in next 2 days
                </p>
              </CardContent>
            </Card>
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
            className="max-w-sm font-nums"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
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
                      <Badge variant="outline" className="font-medium border-gray-300 font-nums">
                        {payout.productPurchaseRequest.investment.name}
                      </Badge>
                      <p className="text-xs text-brand-grey mt-1 font-nums">
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
                        {payout.productPurchaseRequest.investment.currency === 'USD' ? (
                          <DirhamIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <span className="mr-1 text-xs font-nums">
                            {payout.productPurchaseRequest.investment.currency}
                          </span>
                        )}
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No scheduled payouts</p>
                      <p className="text-sm text-muted-foreground">
                        Upcoming payouts will appear here
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
      </TabsContent>

      {/* COMPLETED TAB */}
      <TabsContent value="completed" className="space-y-4">
        {/* Summary for Completed */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 max-w-xs">
            <Card className="border-gray-300 bg-white">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-gray-600" />
                  Completed Payouts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold font-nums text-gray-900">{summary.total}</div>
                <p className="text-xs text-gray-600 mt-1">
                  Successfully processed
                </p>
              </CardContent>
            </Card>
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
            className="max-w-sm font-nums"
          />
        </div>

        {/* Completed Payouts Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processed Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : payouts.length > 0 ? (
                payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-nums">
                      {payout.processedAt ? format(new Date(payout.processedAt), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payout.client.firstName} {payout.client.lastName}</p>
                        <p className="text-xs text-muted-foreground">{payout.client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium border-gray-300 font-nums">
                        {payout.productPurchaseRequest.investment.name}
                      </Badge>
                      <p className="text-xs text-brand-grey mt-1 font-nums">
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
                        <span className="mr-1 text-xs font-nums">
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
                        {payout.receiptDocument && (
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No completed payouts found</p>
                      <p className="text-sm text-muted-foreground">
                        Completed payouts will appear here
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
      </TabsContent>

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
            <div className="space-y-6">
              {/* Payout Summary */}
              <div className="bg-gray-50 p-5 rounded-lg space-y-3.5">
                <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-3">
                  <div className="text-sm font-medium text-gray-700">Client:</div>
                  <div className="text-sm text-gray-900">
                    {uploadDialog.payout.client.firstName} {uploadDialog.payout.client.lastName}
                  </div>

                  <div className="text-sm font-medium text-gray-700">Plan:</div>
                  <div className="text-sm text-gray-900 font-nums">
                    {uploadDialog.payout.productPurchaseRequest.investment.name}
                  </div>

                  <div className="text-sm font-medium text-gray-700">Amount:</div>
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    {uploadDialog.payout.productPurchaseRequest.investment.currency === 'USD' ? (
                      <DirhamIcon className="w-3 h-3" />
                    ) : (
                      <span className="font-nums">{uploadDialog.payout.productPurchaseRequest.investment.currency}</span>
                    )}
                    <span className="font-nums">{uploadDialog.payout.amount.toLocaleString()}</span>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Period:</div>
                  <div className="text-sm text-gray-900 font-nums">
                    {format(new Date(uploadDialog.payout.periodStart), 'MMM dd, yyyy')} - {format(new Date(uploadDialog.payout.periodEnd), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt-file" className="text-sm font-medium text-gray-900">
                  Payment Receipt (PDF/Image) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receipt-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  disabled={uploadMutation.isPending}
                  className="cursor-pointer"
                />
                {receiptFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium">Selected:</span> {receiptFile.name}
                    <span className="font-nums"> ({(receiptFile.size / 1024).toFixed(2)} KB)</span>
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-900">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this payout..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={uploadMutation.isPending}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
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
              className="bg-brand-blue hover:bg-brand-blue/90"
            >
              {uploadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Reusable for both tabs */}
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
            <div className="space-y-6">
              {/* Main Information */}
              <div className="bg-gray-50 p-5 rounded-lg space-y-3.5">
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <div className="text-sm font-medium text-gray-700">Tracking Number:</div>
                  <div className="text-sm text-gray-900 font-mono font-nums">
                    {detailDialog.payout.productPurchaseRequest.trackingNumber}
                  </div>

                  <div className="text-sm font-medium text-gray-700">Status:</div>
                  <div className="text-sm text-gray-900">
                    {getStatusBadge(detailDialog.payout.status, detailDialog.payout.scheduledDate)}
                  </div>

                  <div className="text-sm font-medium text-gray-700">Client:</div>
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">
                      {detailDialog.payout.client.firstName} {detailDialog.payout.client.lastName}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{detailDialog.payout.client.email}</div>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Amount:</div>
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    {detailDialog.payout.productPurchaseRequest.investment.currency === 'USD' ? (
                      <DirhamIcon className="w-3 h-3" />
                    ) : (
                      <span className="font-nums">{detailDialog.payout.productPurchaseRequest.investment.currency}</span>
                    )}
                    <span className="font-nums">{detailDialog.payout.amount.toLocaleString()}</span>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Period Start:</div>
                  <div className="text-sm text-gray-900 font-nums">
                    {format(new Date(detailDialog.payout.periodStart), 'MMM dd, yyyy')}
                  </div>

                  <div className="text-sm font-medium text-gray-700">Period End:</div>
                  <div className="text-sm text-gray-900 font-nums">
                    {format(new Date(detailDialog.payout.periodEnd), 'MMM dd, yyyy')}
                  </div>

                  <div className="text-sm font-medium text-gray-700">Scheduled Date:</div>
                  <div className="text-sm text-gray-900 font-nums">
                    {format(new Date(detailDialog.payout.scheduledDate), 'MMM dd, yyyy')}
                  </div>

                  <div className="text-sm font-medium text-gray-700">Frequency:</div>
                  <div className="text-sm text-gray-900">
                    {detailDialog.payout.productPurchaseRequest.investmentOption.withdrawalFrequency}
                  </div>

                  {detailDialog.payout.status === 'COMPLETED' && detailDialog.payout.processedAt && (
                    <>
                      <div className="text-sm font-medium text-gray-700">Processed Date:</div>
                      <div className="text-sm text-gray-900 font-nums">
                        {format(new Date(detailDialog.payout.processedAt), 'MMM dd, yyyy')}
                      </div>
                    </>
                  )}

                  {detailDialog.payout.receiptDocument && (
                    <>
                      <div className="text-sm font-medium text-gray-700">Receipt:</div>
                      <div className="text-sm">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-brand-blue hover:text-brand-blue/80"
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
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, payout: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
