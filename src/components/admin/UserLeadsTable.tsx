'use client';

/**
 * User Leads Table Component
 * Table for displaying and managing user lead submissions
 */

import { useState, useEffect, useCallback } from 'react';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DirhamIcon } from '@/components/ui/dirham-icon';

interface UserLead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  familyExpenses: number;
  financialGoals: string;
  currentSavings: number | null;
  investmentExperience: string | null;
  riskTolerance: string | null;
  investmentHorizon: string | null;
  createdAt: string;
  updatedAt: string;
}

export function UserLeadsTable() {
  // State
  const [leads, setLeads] = useState<UserLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<UserLead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { query: search }),
      });

      const response = await fetch(`/api/admin/leads?${params}`);
      const result = await response.json();

      if (result.success) {
        setLeads(result.data.leads);
        setTotalCount(result.data.pagination.totalCount);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error(result.error || 'Failed to load leads');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search]);

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // View details
  const handleViewDetails = (lead: UserLead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return (
      <span className="flex items-center">
        <DirhamIcon className="w-3 h-3 mr-1" />
        {value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Effect to fetch when filters change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Search */}
      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('fullName')}
                >
                  Name {sortBy === 'fullName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('email')}
                >
                  Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Phone</TableHead>
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
                  <TableCell colSpan={5} className="h-24 text-center">
                    <LoadingSpinner text="Loading leads..." centered={false} />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.fullName}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{formatDate(lead.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(lead)}
                      >
                        View Details
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
            Showing {leads.length === 0 ? 0 : (page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, totalCount)} of {totalCount} leads
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

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Complete information for this lead submission
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedLead.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedLead.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Age</Label>
                    <p className="font-medium">{selectedLead.age} years</p>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Monthly Income</Label>
                    <p className="font-medium">{formatCurrency(selectedLead.monthlyIncome)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Monthly Expenses</Label>
                    <p className="font-medium">{formatCurrency(selectedLead.monthlyExpenses)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Family Expenses</Label>
                    <p className="font-medium">{formatCurrency(selectedLead.familyExpenses)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Current Savings</Label>
                    <p className="font-medium">
                      {selectedLead.currentSavings !== null
                        ? formatCurrency(selectedLead.currentSavings)
                        : 'Not provided'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Financial Goals</Label>
                    <p className="font-medium whitespace-pre-wrap">{selectedLead.financialGoals}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Investment Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Investment Profile</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label className="text-muted-foreground">Investment Experience</Label>
                    <p className="font-medium">{selectedLead.investmentExperience || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Risk Tolerance</Label>
                    <p className="font-medium">{selectedLead.riskTolerance || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Investment Horizon</Label>
                    <p className="font-medium">{selectedLead.investmentHorizon || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Submitted On</Label>
                    <p className="font-medium">{formatDate(selectedLead.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="font-medium">{formatDate(selectedLead.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
