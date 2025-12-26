'use client';

/**
 * DocAdmin Leads Table Component
 * Table for displaying and managing user lead submissions (New Enquiries)
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'react-hot-toast';

type LeadSource =
  | 'INSTAGRAM'
  | 'YOUTUBE'
  | 'FACEBOOK_ADS'
  | 'GOOGLE_ADS'
  | 'WEBSITE'
  | 'REFERRAL'
  | 'OTHER';

type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST';

interface UserLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  leadSource: LeadSource;
  rmReference: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export function LeadsTable() {
  // State
  const [leads, setLeads] = useState<UserLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<UserLead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

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
        ...(filterSource && { leadSource: filterSource }),
        ...(filterStatus && { status: filterStatus }),
      });

      const response = await fetch(`/api/docadmin/leads?${params}`);
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
  }, [page, limit, sortBy, sortOrder, search, filterSource, filterStatus]);

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

  // Get status badge variant
  const getStatusBadge = (status: LeadStatus) => {
    const variants: Record<LeadStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      NEW: { variant: 'default', label: 'New' },
      CONTACTED: { variant: 'secondary', label: 'Contacted' },
      CONVERTED: { variant: 'outline', label: 'Converted' },
      LOST: { variant: 'destructive', label: 'Lost' },
    };
    return variants[status] || { variant: 'default', label: status };
  };

  // Get source label
  const getSourceLabel = (source: LeadSource) => {
    const labels: Record<LeadSource, string> = {
      INSTAGRAM: 'Instagram',
      YOUTUBE: 'YouTube',
      FACEBOOK_ADS: 'Facebook Ads',
      GOOGLE_ADS: 'Google Ads',
      WEBSITE: 'Website',
      REFERRAL: 'Referral',
      OTHER: 'Other',
    };
    return labels[source] || source;
  };

  // Effect to fetch when filters change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Name, email, phone, RM ref..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-filter">Lead Source</Label>
            <Select
              value={filterSource || 'ALL'}
              onValueChange={(value) => {
                setFilterSource(value === 'ALL' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger id="source-filter">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All sources</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="YOUTUBE">YouTube</SelectItem>
                <SelectItem value="FACEBOOK_ADS">Facebook Ads</SelectItem>
                <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                <SelectItem value="WEBSITE">Website</SelectItem>
                <SelectItem value="REFERRAL">Referral</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filterStatus || 'ALL'}
              onValueChange={(value) => {
                setFilterStatus(value === 'ALL' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterSource('');
                setFilterStatus('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l) => l.status === 'NEW').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l) => l.status === 'CONTACTED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l) => l.status === 'CONVERTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('firstName')}
              >
                Name {sortBy === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                onClick={() => handleSort('leadSource')}
              >
                Source {sortBy === 'leadSource' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>RM Ref</TableHead>
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
                <TableCell colSpan={8} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    {lead.firstName} {lead.lastName}
                  </TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phoneNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getSourceLabel(lead.leadSource)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.rmReference || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(lead.status).variant}>
                      {getStatusBadge(lead.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(lead.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(lead)}>
                      View Details
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details - New Enquiry</DialogTitle>
            <DialogDescription>Complete information for this lead submission</DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">First Name</Label>
                    <p className="font-medium">{selectedLead.firstName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Name</Label>
                    <p className="font-medium">{selectedLead.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone Number</Label>
                    <p className="font-medium">{selectedLead.phoneNumber}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Source & Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Lead Source</Label>
                    <p className="font-medium">
                      <Badge variant="outline">{getSourceLabel(selectedLead.leadSource)}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="font-medium">
                      <Badge variant={getStatusBadge(selectedLead.status).variant}>
                        {getStatusBadge(selectedLead.status).label}
                      </Badge>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">RM Reference</Label>
                    <p className="font-medium">{selectedLead.rmReference || 'Not provided'}</p>
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

              {/* Action: Assign RM */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the RM Assignment feature to assign this lead to a Relationship Manager.
                  </p>
                  <Button variant="default" size="sm">
                    Assign RM
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
