'use client';

/**
 * Instrument Table Component
 * Comprehensive table for managing instruments with search, filtering, sorting, and bulk operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { InstrumentType } from '@prisma/client';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Instrument {
  id: string;
  symbol: string;
  name: string;
  type: InstrumentType;
  currentPrice: number;
  currency: string;
  riskRating: string | null;
  minimumInvestment: number | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  _count: {
    holdings: number;
    transactions: number;
  };
}

interface InstrumentTableProps {
  initialData?: Instrument[];
}

export function InstrumentTable({ initialData = [] }: InstrumentTableProps) {
  const router = useRouter();

  // State
  const [instruments, setInstruments] = useState<Instrument[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch instruments
  const fetchInstruments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { query: search }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(riskFilter !== 'all' && { riskRating: riskFilter }),
        ...(statusFilter === 'active' && { isActive: 'true' }),
        ...(statusFilter === 'inactive' && { isActive: 'false' }),
      });

      const response = await fetch(`/api/admin/instruments?${params}`);
      const result = await response.json();

      if (result.success) {
        setInstruments(result.data.instruments);
        setTotalCount(result.data.pagination.totalCount);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error(result.error || 'Failed to load instruments');
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, typeFilter, riskFilter, statusFilter]);

  // Handle bulk operations
  const handleBulkOperation = async (operation: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.size === 0) {
      toast.error('No instruments selected');
      return;
    }

    const confirmMessage =
      operation === 'delete'
        ? `Are you sure you want to delete ${selectedIds.size} instrument(s)?`
        : `Are you sure you want to ${operation} ${selectedIds.size} instrument(s)?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/instruments/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrumentIds: Array.from(selectedIds),
          operation,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSelectedIds(new Set());
        fetchInstruments();
      } else {
        toast.error(result.error || 'Bulk operation failed');
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === instruments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(instruments.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Effect to fetch when filters change
  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or symbol..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="type-filter">Type</Label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={InstrumentType.STOCK}>Stock</SelectItem>
                <SelectItem value={InstrumentType.BOND}>Bond</SelectItem>
                <SelectItem value={InstrumentType.MUTUAL_FUND}>Mutual Fund</SelectItem>
                <SelectItem value={InstrumentType.ETF}>ETF</SelectItem>
                <SelectItem value={InstrumentType.COMMODITY}>Commodity</SelectItem>
                <SelectItem value={InstrumentType.CRYPTOCURRENCY}>Cryptocurrency</SelectItem>
                <SelectItem value={InstrumentType.REAL_ESTATE}>Real Estate</SelectItem>
                <SelectItem value={InstrumentType.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Risk Filter */}
          <div className="space-y-2">
            <Label htmlFor="risk-filter">Risk Level</Label>
            <Select
              value={riskFilter}
              onValueChange={(value) => {
                setRiskFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="risk-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-3">
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedIds.size} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation('activate')}
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation('deactivate')}
              >
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation('delete')}
                className="text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === instruments.length && instruments.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('symbol')}
                >
                  Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('type')}
                >
                  Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('currentPrice')}
                >
                  Price {sortBy === 'currentPrice' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('riskRating')}
                >
                  Risk {sortBy === 'riskRating' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Min Investment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Holdings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    <LoadingSpinner text="Loading instruments..." centered={false} />
                  </TableCell>
                </TableRow>
              ) : instruments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    No instruments found
                  </TableCell>
                </TableRow>
              ) : (
                instruments.map((instrument) => (
                  <TableRow key={instrument.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(instrument.id)}
                        onCheckedChange={() => toggleSelect(instrument.id)}
                        aria-label={`Select ${instrument.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-medium">{instrument.symbol}</TableCell>
                    <TableCell className="font-medium">{instrument.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {instrument.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {instrument.currency} {Number(instrument.currentPrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {instrument.riskRating ? (
                        <Badge
                          variant={
                            instrument.riskRating === 'HIGH'
                              ? 'destructive'
                              : instrument.riskRating === 'MEDIUM'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {instrument.riskRating}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {instrument.minimumInvestment
                        ? `${instrument.currency} ${Number(instrument.minimumInvestment).toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={instrument.isActive ? 'default' : 'secondary'}>
                        {instrument.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{instrument._count.holdings}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/instruments/${instrument.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size">Per page:</Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger id="page-size" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Showing {instruments.length === 0 ? 0 : (page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, totalCount)} of {totalCount} instruments
          </span>
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
