/**
 * RM - Assigned Clients Table Component
 * Displays assigned clients with search, filtering, and sorting
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
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import Link from 'next/link';

interface Client {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  kycVerified: boolean;
  verificationStatus: 'NOT_SUBMITTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  assignedAt: string;
  portfolio: {
    totalValue: number;
    totalInvested: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
  } | null;
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
  sortBy: string;
  sortOrder: string;
}): Promise<ClientsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '20',
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  if (params.search) queryParams.append('search', params.search);

  const response = await fetch(`/api/rm/clients?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  return response.json();
}

export function AssignedClientsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('assignedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['assigned-clients', page, search, sortBy, sortOrder],
    queryFn: () => fetchClients({ page, search, sortBy, sortOrder }),
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };



  const clients = data?.data.clients || [];
  const pagination = data?.data.pagination;

  // Client-side filtering


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
      {/* Search and Filters */}
      {/* Search and Filters */}
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
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-8 px-2"
                >
                  Client Name
                </Button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('portfolioValue')}
                  className="h-8 px-2"
                >
                  Portfolio Value
                </Button>
              </TableHead>
              <TableHead className="text-right">Gain/Loss</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('assignedAt')}
                  className="h-8 px-2"
                >
                  Assigned Date
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Searching...
                </TableCell>
              </TableRow>
            ) : clients.length > 0 ? (
              clients.map((client) => {
                const isPositiveGain = client.portfolio ? client.portfolio.totalGainLoss >= 0 : true;
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.user.firstName} {client.user.lastName}
                    </TableCell>
                    <TableCell>{client.user.email}</TableCell>
                    <TableCell>
                      {client.user.phone ? (
                        <a href={`tel:${client.user.phone}`} className="text-brand-blue hover:underline">
                          {client.user.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {client.verificationStatus === 'VERIFIED' ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700">
                          Verified
                        </Badge>
                      ) : client.verificationStatus === 'PENDING' || client.verificationStatus === 'UNDER_REVIEW' ? (
                        <Badge variant="outline" className="bg-brand-blue/10 text-brand-blue">
                          {client.verificationStatus === 'UNDER_REVIEW' ? 'Under Review' : 'Pending'}
                        </Badge>
                      ) : client.verificationStatus === 'REJECTED' ? (
                        <Badge variant="outline" className="bg-red-500/10 text-red-700">
                          Rejected
                        </Badge>
                      ) : client.verificationStatus === 'EXPIRED' ? (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-700">
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-700">
                          Not Submitted
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {client.portfolio ? (
                        <div className="flex items-center justify-end">
                          <DirhamIcon className="w-3 h-3 mr-1" />
                          {client.portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.portfolio ? (
                        <div className={`flex items-center justify-end gap-1 ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositiveGain ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-medium flex items-center">
                            {isPositiveGain ? '+' : ''}
                            <DirhamIcon className="w-3 h-3 mx-1" />
                            {client.portfolio.totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs">
                            ({isPositiveGain ? '+' : ''}{client.portfolio.totalGainLossPercent.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(client.assignedAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/rm/clients/${client.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-muted-foreground">No clients assigned to you yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your assigned clients will appear here
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
