/**
 * RM - Leads Table Component
 * Displays assigned leads (not yet registered) with search and filtering
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, AlertCircle, Phone, Mail } from 'lucide-react';

import { ResponsiveTable } from '@/components/ui/responsive-table';

type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'CONVERTED' | 'LOST';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  leadSource: string;
  status: LeadStatus;
  rmReference: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadsResponse {
  success: boolean;
  data: {
    leads: Lead[];
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

async function fetchLeads(params: {
  page: number;
  search: string;
  source: string;
}): Promise<LeadsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
  });

  if (params.search) queryParams.append('search', params.search);
  if (params.source) queryParams.append('source', params.source);

  const response = await fetch(`/api/rm/leads?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch leads');
  }
  return response.json();
}

const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK_ADS: 'Facebook Ads',
  GOOGLE_ADS: 'Google Ads',
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  OTHER: 'Other',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  NOT_INTERESTED: 'Not Interested',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-brand-blue/10 text-brand-blue',
  CONTACTED: 'bg-purple-500/10 text-purple-700',
  INTERESTED: 'bg-green-500/10 text-green-700',
  NOT_INTERESTED: 'bg-orange-500/10 text-orange-700',
  CONVERTED: 'bg-emerald-500/10 text-emerald-700',
  LOST: 'bg-red-500/10 text-red-700',
};

export function RMLeadsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['rm-leads', page, search, filterSource],
    queryFn: () => fetchLeads({ page, search, source: filterSource === 'ALL' ? '' : filterSource }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      const response = await fetch(`/api/rm/leads/${leadId}/update-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rm-leads'] });
      toast.success('Lead status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update lead status');
    },
  });

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    updateStatusMutation.mutate({ leadId, status: newStatus });
  };



  const leads = data?.data.leads || [];
  const pagination = data?.data.pagination;



  // Show friendly message for errors or empty data
  if (error && !leads.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load leads at the moment. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full sm:max-w-md flex-1">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />
          </div>
          <Select
            value={filterSource || 'ALL'}
            onValueChange={(value) => {
              setFilterSource(value === 'ALL' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Sources" />
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
        </div>
        <div className="text-sm text-brand-grey ml-auto whitespace-nowrap hidden md:block">
          <span className="font-nums">{pagination?.totalCount || 0}</span> total leads
        </div>
      </div>

      {/* Table */}
      <ResponsiveTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead Name</TableHead>
              <TableHead>Contact Information</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Update Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Searching...
                </TableCell>
              </TableRow>
            ) : leads.length > 0 ? (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    {lead.firstName} {lead.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${lead.email}`} className="text-brand-blue hover:underline">
                          {lead.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${lead.phoneNumber}`} className="text-brand-blue hover:underline font-nums">
                          {lead.phoneNumber}
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{SOURCE_LABELS[lead.leadSource] || lead.leadSource}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[lead.status]}>
                      {STATUS_LABELS[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="INTERESTED">Interested</SelectItem>
                        <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-nums">
                    <span className="font-nums">{format(new Date(lead.createdAt), 'MMM dd, yyyy')}</span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-muted-foreground">No leads assigned to you yet</p>
                    <p className="text-sm text-muted-foreground">
                      Leads will appear here once they are assigned by DocAdmin
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ResponsiveTable>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground font-nums">
            Showing {(pagination?.page - 1) * pagination?.limit + 1} to{' '}
            {Math.min(pagination?.page * pagination?.limit, pagination?.totalCount)} of{' '}
            {pagination?.totalCount} leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-nums">
              Page {pagination?.page || 1} of {pagination?.totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination?.hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
