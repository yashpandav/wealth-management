/**
 * RM - KYC Pending Table Component
 * Displays clients with KYC documents under verification (read-only)
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, AlertCircle, Mail, Phone, Clock } from 'lucide-react';

import { ResponsiveTable } from '@/components/ui/responsive-table';

interface Client {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  verificationStatus: 'PENDING' | 'UNDER_REVIEW';
  assignedAt: string;
  updatedAt: string;
}

interface ClientsResponse {
  success: boolean;
  data: {
    clients: Client[];
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

async function fetchClients(params: {
  page: number;
  search: string;
}): Promise<ClientsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
  });

  if (params.search) queryParams.append('search', params.search);

  const response = await fetch(`/api/rm/kyc-pending?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  return response.json();
}

export function KYCPendingTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['kyc-pending', page, search],
    queryFn: () => fetchClients({ page, search }),
  });



  const clients = data?.data.clients || [];
  const pagination = data?.data.pagination;



  // Show friendly message for errors
  if (error && !clients.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load clients at the moment. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          These clients have submitted KYC documents and are awaiting verification by DocAdmin. You cannot take action at this stage.
        </AlertDescription>
      </Alert>

      {/* Search */}
      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:max-w-md flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full"
          />
        </div>
        <div className="text-sm text-brand-grey ml-auto whitespace-nowrap hidden sm:block">
          {pagination?.totalCount || 0} total clients
        </div>
      </div>

      {/* Table */}
      <ResponsiveTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact Information</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Searching...
                </TableCell>
              </TableRow>
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.user.firstName} {client.user.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${client.user.email}`} className="text-brand-blue hover:underline">
                          {client.user.email}
                        </a>
                      </div>
                      {client.user.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a href={`tel:${client.user.phone}`} className="text-brand-blue hover:underline">
                            {client.user.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-brand-blue/10 text-brand-blue">
                      {client.verificationStatus === 'UNDER_REVIEW' ? 'Under Review' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(client.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-muted-foreground">No clients with pending KYC verification</p>
                    <p className="text-sm text-muted-foreground">
                      Clients with KYC documents under review will appear here
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
          <div className="text-sm text-muted-foreground">
            Showing {(pagination?.page - 1) * pagination?.limit + 1} to{' '}
            {Math.min(pagination?.page * pagination?.limit, pagination?.totalCount)} of{' '}
            {pagination?.totalCount} clients
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
            <div className="text-sm">
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
