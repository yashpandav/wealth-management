'use client';

/**
 * Purchase Requests Table for RMs
 * Comprehensive table for managing client purchase requests with filtering and sorting
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RequestStatus } from '@prisma/client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface PurchaseRequest {
  id: string;
  trackingNumber: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  instrument: {
    id: string;
    symbol: string;
    name: string;
    type: string;
    currentPrice: number;
    currency: string;
  };
  amount: number;
  quantity: number | null;
  status: RequestStatus;
  createdAt: string;
}

interface Summary {
  total: number;
  byStatus: Array<{
    status: RequestStatus;
    count: number;
    totalAmount: number;
  }>;
}

export function PurchaseRequestsTable() {
  const router = useRouter();

  // State
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/rm/purchase-requests?${params}`);
      const result = await response.json();

      if (result.success) {
        setRequests(result.data.requests);
        setSummary(result.data.summary);
        setTotalCount(result.data.pagination.totalCount);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error(result.error || 'Failed to load purchase requests');
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, statusFilter]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchRequests();
  }, [page, limit, sortBy, sortOrder, search, statusFilter, fetchRequests]);

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Status badge
  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case RequestStatus.PROCESSING:
        return <Badge className="bg-blue-600">Processing</Badge>;
      case RequestStatus.APPROVED:
        return <Badge className="bg-green-600">Approved</Badge>;
      case RequestStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case RequestStatus.COMPLETED:
        return <Badge variant="secondary">Completed</Badge>;
      case RequestStatus.CANCELLED:
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Requests</CardDescription>
              <CardTitle className="text-3xl">{summary.total}</CardTitle>
            </CardHeader>
          </Card>
          {summary.byStatus.map((stat) => (
            <Card key={stat.status}>
              <CardHeader className="pb-3">
                <CardDescription className="capitalize">
                  {stat.status.toLowerCase().replace('_', ' ')}
                </CardDescription>
                <CardTitle className="text-3xl">{stat.count}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Total: ${stat.totalAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Tracking number or client name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={RequestStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={RequestStatus.PROCESSING}>Processing</SelectItem>
                  <SelectItem value={RequestStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={RequestStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={RequestStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Per Page */}
            <div className="space-y-2">
              <Label htmlFor="per-page">Per Page</Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger id="per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('trackingNumber')}
              >
                Tracking # {sortBy === 'trackingNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('client')}
              >
                Client {sortBy === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('instrument')}
              >
                Instrument {sortBy === 'instrument' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('amount')}
              >
                Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                Submitted {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No purchase requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">{request.trackingNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {request.client.firstName} {request.client.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{request.client.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium font-mono">{request.instrument.symbol}</p>
                      <p className="text-xs text-muted-foreground">{request.instrument.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {request.instrument.currency} {request.amount.toLocaleString()}
                      </p>
                      {request.quantity && (
                        <p className="text-xs text-muted-foreground">
                          {request.quantity.toFixed(4)} units
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <p className="text-sm">{format(new Date(request.createdAt), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.createdAt), 'h:mm a')}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const route = `/rm/purchase-requests/${request.id}`;
                        router.push(route as `/rm/purchase-requests/${string}`);
                      }}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {requests.length === 0 ? 0 : (page - 1) * limit + 1} to{' '}
          {Math.min(page * limit, totalCount)} of {totalCount} requests
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
