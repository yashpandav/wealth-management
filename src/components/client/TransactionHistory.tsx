/**
 * Client - Transaction History Component
 * Displays transaction history with filtering and search
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
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download,
  Eye,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';


interface Transaction {
  id: string;
  type: 'PURCHASE' | 'WITHDRAWAL' | 'INTEREST_PAYOUT' | 'DIVIDEND' | 'ADJUSTMENT';
  status: 'COMPLETED' | 'FAILED' | 'REVERSED' | 'PENDING_SETTLEMENT';
  amount: number;
  total: number;
  fees: number;
  netAmount: number;
  currency: string;
  completedAt: string;
  createdAt: string;
  notes: string | null;
  metadata: string | null;
  paymentProof: string | null;
}

interface TransactionResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

async function fetchTransactions(params: {
  page: number;
  type: string;
  status: string;
  search: string;
  startDate: string;
  endDate: string;
}): Promise<TransactionResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
  });

  if (params.type && params.type !== 'all') queryParams.append('type', params.type);
  if (params.status && params.status !== 'all') queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const response = await fetch(`/api/client/transactions?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
}

export function TransactionHistory() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', page, typeFilter, statusFilter, search, startDate, endDate],
    queryFn: () => fetchTransactions({ page, type: typeFilter, status: statusFilter, search, startDate, endDate }),
  });

  const handleExportCSV = () => {
    if (!data?.data.transactions) return;

    const headers = ['Date', 'Type', 'Amount', 'Total', 'Fees', 'Net Amount', 'Status', 'Notes'];
    const rows = data.data.transactions.map((txn) => [
      format(new Date(txn.completedAt), 'yyyy-MM-dd HH:mm'),
      txn.type,
      `${txn.currency} ${txn.amount.toFixed(2)}`,
      `${txn.currency} ${txn.total.toFixed(2)}`,
      `${txn.currency} ${txn.fees.toFixed(2)}`,
      `${txn.currency} ${txn.netAmount.toFixed(2)}`,
      txn.status,
      txn.notes || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-700';
      case 'FAILED':
        return 'bg-red-500/10 text-red-700';
      case 'REVERSED':
        return 'bg-orange-500/10 text-orange-700';
      case 'PENDING_SETTLEMENT':
        return 'bg-brand-blue/10/10 text-brand-blue';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'PURCHASE':
        return 'bg-green-500/10 text-green-700';
      case 'INTEREST_PAYOUT':
        return 'bg-blue-500/10 text-blue-700';
      case 'WITHDRAWAL':
        return 'bg-red-500/10 text-red-700';
      case 'DIVIDEND':
        return 'bg-purple-500/10 text-purple-700';
      case 'ADJUSTMENT':
        return 'bg-orange-500/10 text-orange-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };



  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load transaction history. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const transactions = data?.data.transactions || [];
  const pagination = data?.data.pagination;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Search</label>
            <Input
              placeholder="Search by ID or notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Type</label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PURCHASE">Purchase</SelectItem>
                <SelectItem value="INTEREST_PAYOUT">Interest Payout</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                <SelectItem value="DIVIDEND">Dividend</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING_SETTLEMENT">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REVERSED">Reversed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button onClick={handleExportCSV} variant="outline" disabled={transactions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Searching...
                  </TableCell>
                </TableRow>
              ) : transactions.length > 0 ? (
                transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium font-nums">
                      {format(new Date(txn.completedAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(txn.type)}>
                        {txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end font-nums">
                        <DirhamIcon className="w-3 h-3 mr-1" />
                        {txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end font-nums">
                        <DirhamIcon className="w-3 h-3 mr-1" />
                        {txn.fees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end font-nums">
                        <DirhamIcon className="w-3 h-3 mr-1" />
                        {txn.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(txn.status)}>
                        {txn.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransaction(txn)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* Pagination */}
      {
        pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-nums">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={pagination.page === 1}
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
                disabled={!pagination.hasMore}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      }

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Information */}
              <div className="bg-gray-50 p-5 rounded-lg space-y-3.5">
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <div className="text-sm font-medium text-gray-700">Transaction ID:</div>
                  <div className="text-sm text-gray-900 font-mono font-nums">{selectedTransaction.id}</div>

                  <div className="text-sm font-medium text-gray-700">Date:</div>
                  <div className="text-sm text-gray-900 font-nums">
                    {format(new Date(selectedTransaction.completedAt), 'MMM dd, yyyy - h:mm a')}
                  </div>

                  <div className="text-sm font-medium text-gray-700">Type:</div>
                  <div className="text-sm text-gray-900">
                    <Badge variant="outline" className={getTypeColor(selectedTransaction.type)}>
                      {selectedTransaction.type}
                    </Badge>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Status:</div>
                  <div className="text-sm text-gray-900">
                    <Badge variant="outline" className={getStatusColor(selectedTransaction.status)}>
                      {selectedTransaction.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Amount:</div>
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    <DirhamIcon className="w-3 h-3" />
                    <span className="font-nums font-medium">
                      {selectedTransaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Fees:</div>
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    <DirhamIcon className="w-3 h-3" />
                    <span className="font-nums font-medium">
                      {selectedTransaction.fees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Total:</div>
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    <DirhamIcon className="w-3 h-3" />
                    <span className="font-nums font-medium">
                      {selectedTransaction.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-gray-700">Net Amount:</div>
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    <DirhamIcon className="w-3 h-3" />
                    <span className="font-nums font-medium">
                      {selectedTransaction.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {selectedTransaction.notes && (
                    <>
                      <div className="text-sm font-medium text-gray-700">Notes:</div>
                      <div className="text-sm text-gray-900">{selectedTransaction.notes}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}
