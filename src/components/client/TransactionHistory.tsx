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
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'WITHDRAWAL' | 'DIVIDEND' | 'ADJUSTMENT';
  status: 'COMPLETED' | 'FAILED' | 'REVERSED' | 'PENDING_SETTLEMENT';
  amount: number;
  price: number | null;
  quantity: number | null;
  total: number;
  fees: number;
  netAmount: number;
  currency: string;
  completedAt: string;
  createdAt: string;
  instrument: {
    symbol: string;
    name: string;
    type: string;
  } | null;
  notes: string | null;
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

    const headers = ['Date', 'Type', 'Instrument', 'Quantity', 'Price', 'Total', 'Fees', 'Net Amount', 'Status'];
    const rows = data.data.transactions.map((txn) => [
      format(new Date(txn.completedAt), 'yyyy-MM-dd HH:mm'),
      txn.type,
      txn.instrument ? `${txn.instrument.symbol} - ${txn.instrument.name}` : 'N/A',
      txn.quantity?.toString() || 'N/A',
      txn.price ? `$${txn.price.toFixed(4)}` : 'N/A',
      `$${txn.total.toFixed(2)}`,
      `$${txn.fees.toFixed(2)}`,
      `$${txn.netAmount.toFixed(2)}`,
      txn.status,
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
      case 'WITHDRAWAL':
        return 'bg-red-500/10 text-red-700';
      case 'DIVIDEND':
        return 'bg-brand-blue/10/10 text-brand-blue';
      case 'ADJUSTMENT':
        return 'bg-purple-500/10 text-purple-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading transactions..." />;
  }

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
              placeholder="Search by instrument or ID..."
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
                <TableHead>Instrument</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">
                      {format(new Date(txn.completedAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(txn.type)}>
                        {txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {txn.instrument ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{txn.instrument.symbol}</span>
                          <span className="text-xs text-muted-foreground">{txn.instrument.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.quantity ? txn.quantity.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.price ? `$${txn.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${txn.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <TableCell colSpan={8} className="h-24 text-center">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
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
            <div className="text-sm">
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
      )}

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p>{format(new Date(selectedTransaction.completedAt), 'PPpp')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant="outline" className={getTypeColor(selectedTransaction.type)}>
                    {selectedTransaction.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline" className={getStatusColor(selectedTransaction.status)}>
                    {selectedTransaction.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {selectedTransaction.instrument && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Instrument</p>
                  <p className="font-medium">{selectedTransaction.instrument.symbol} - {selectedTransaction.instrument.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedTransaction.instrument.type}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTransaction.quantity && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                    <p className="font-medium">{selectedTransaction.quantity.toLocaleString()}</p>
                  </div>
                )}
                {selectedTransaction.price && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Price per Unit</p>
                    <p className="font-medium">${selectedTransaction.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="font-medium">${selectedTransaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fees</p>
                  <p className="font-medium">${selectedTransaction.fees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="font-medium">${selectedTransaction.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Amount</p>
                  <p className="font-medium">${selectedTransaction.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
