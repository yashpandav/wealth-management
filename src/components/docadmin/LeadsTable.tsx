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

type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'CONVERTED' | 'LOST';

interface AssignedRM {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface UserLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  leadSource: LeadSource;
  status: LeadStatus;
  rmReference: string | null;
  assignedRMId: string | null;
  userId: string | null;
  assignedRM: AssignedRM | null;
  createdAt: string;
  updatedAt: string;
}

interface RM {
  id: string;
  name: string;
  email: string;
  clientCount: number;
}

export function LeadsTable() {
  // State
  const [leads, setLeads] = useState<UserLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<UserLead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // RM Assignment State
  const [isAssignRmOpen, setIsAssignRmOpen] = useState(false);
  const [availableRMs, setAvailableRMs] = useState<RM[]>([]);
  const [selectedRmId, setSelectedRmId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<string>('');

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
  }, [page, limit, sortBy, sortOrder, search, filterSource]);

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

  // Get status label
  const getStatusLabel = (status: LeadStatus) => {
    const labels: Record<LeadStatus, string> = {
      NEW: 'New',
      CONTACTED: 'Contacted',
      INTERESTED: 'Interested',
      NOT_INTERESTED: 'Not Interested',
      CONVERTED: 'Converted',
      LOST: 'Lost',
    };
    return labels[status] || status;
  };

  // Get status color
  const getStatusColor = (status: LeadStatus) => {
    const colors: Record<LeadStatus, string> = {
      NEW: 'bg-brand-blue/10/10 text-brand-blue',
      CONTACTED: 'bg-purple-500/10 text-purple-700',
      INTERESTED: 'bg-green-500/10 text-green-700',
      NOT_INTERESTED: 'bg-orange-500/10 text-orange-700',
      CONVERTED: 'bg-emerald-500/10 text-emerald-700',
      LOST: 'bg-red-500/10 text-red-700',
    };
    return colors[status] || '';
  };

  // Fetch available RMs
  const fetchRMs = useCallback(async () => {
    try {
      const response = await fetch('/api/docadmin/rms');
      const result = await response.json();

      if (result.success) {
        setAvailableRMs(result.data.rms);
      } else {
        toast.error('Failed to load RMs');
      }
    } catch (error) {
      console.error('Error fetching RMs:', error);
      toast.error('Failed to load RMs');
    }
  }, []);

  // Handle assign RM
  const handleAssignRM = async () => {
    if (!selectedLead || !selectedRmId) {
      toast.error('Please select an RM');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`/api/docadmin/leads/${selectedLead.id}/assign-rm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rmId: selectedRmId,
          notes: assignmentNotes || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'RM assigned successfully');
        setIsAssignRmOpen(false);
        setSelectedRmId('');
        setAssignmentNotes('');
        setIsDetailsOpen(false);
        // Refresh leads list
        fetchLeads();
      } else {
        toast.error(result.error || 'Failed to assign RM');
      }
    } catch (error) {
      console.error('Error assigning RM:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsAssigning(false);
    }
  };

  // Open assign RM dialog
  const openAssignRmDialog = (lead: UserLead) => {
    setSelectedLead(lead);
    setIsAssignRmOpen(true);
    if (availableRMs.length === 0) {
      fetchRMs();
    }
  };

  // Effect to fetch when filters change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, phone, or RM reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10"
          />
        </div>
        <Select
          value={filterSource || 'ALL'}
          onValueChange={(value) => {
            setFilterSource(value === 'ALL' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sources</SelectItem>
            <SelectItem value="INSTAGRAM">Instagram</SelectItem>
            <SelectItem value="YOUTUBE">YouTube</SelectItem>
            <SelectItem value="FACEBOOK_ADS">Facebook Ads</SelectItem>
            <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
            <SelectItem value="WEBSITE">Website</SelectItem>
            <SelectItem value="REFERRAL">Referral</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        {(search || filterSource) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setFilterSource('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">All submitted leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned to RM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l) => l.assignedRMId).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Have assigned managers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unassigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l) => !l.assignedRMId).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need RM assignment</p>
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
              <TableHead>Status</TableHead>
              <TableHead>Assigned RM</TableHead>
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
                  <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.phoneNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {getSourceLabel(lead.leadSource)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.assignedRM ? (
                      <span className="text-foreground">
                        {lead.assignedRM.user.firstName} {lead.assignedRM.user.lastName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(lead)}>
                      Details
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Lead Enquiry Details</DialogTitle>
            <DialogDescription>
              View and manage lead information
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-5">
              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Contact
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">
                      {selectedLead.firstName} {selectedLead.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{selectedLead.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="text-sm font-medium">{selectedLead.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Lead Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <Badge variant="outline" className="font-normal">
                      {getSourceLabel(selectedLead.leadSource)}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline" className={getStatusColor(selectedLead.status)}>
                      {getStatusLabel(selectedLead.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Assigned RM</span>
                    <span className="text-sm font-medium">
                      {selectedLead.assignedRM ? (
                        `${selectedLead.assignedRM.user.firstName} ${selectedLead.assignedRM.user.lastName}`
                      ) : (
                        <span className="italic text-muted-foreground">Not assigned</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Submitted</span>
                    <span className="text-sm font-medium">{formatDate(selectedLead.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => openAssignRmDialog(selectedLead)}
                  className="flex-1"
                  size="default"
                >
                  {selectedLead.assignedRMId ? 'Reassign RM' : 'Assign RM'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  size="default"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RM Assignment Dialog */}
      <Dialog open={isAssignRmOpen} onOpenChange={setIsAssignRmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Assign Manager</DialogTitle>
            <DialogDescription>
              Choose an RM to handle this enquiry
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              {/* Lead Summary */}
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {selectedLead.firstName} {selectedLead.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedLead.email}</p>
                  </div>
                  {selectedLead.assignedRM && (
                    <Badge variant="secondary" className="text-xs">
                      Currently: {selectedLead.assignedRM.user.firstName} {selectedLead.assignedRM.user.lastName}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Select RM */}
              <div className="space-y-2">
                <Label htmlFor="rm-select">Relationship Manager</Label>
                <Select value={selectedRmId} onValueChange={setSelectedRmId}>
                  <SelectTrigger id="rm-select">
                    <SelectValue placeholder="Select RM..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRMs.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading RMs...</div>
                    ) : (
                      availableRMs.map((rm) => (
                        <SelectItem key={rm.id} value={rm.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{rm.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {rm.clientCount} {rm.clientCount === 1 ? 'client' : 'clients'}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="assignment-notes">Notes (Optional)</Label>
                <Input
                  id="assignment-notes"
                  placeholder="Add notes if needed..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  maxLength={500}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAssignRmOpen(false);
                    setSelectedRmId('');
                    setAssignmentNotes('');
                  }}
                  disabled={isAssigning}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignRM}
                  disabled={!selectedRmId || isAssigning}
                  className="flex-1"
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
