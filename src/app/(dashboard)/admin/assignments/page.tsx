/**
 * Admin Client-RM Assignment Management
 * Assign and manage client-RM relationships
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { RequireAdmin } from '@/lib/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RM {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  isActive: boolean;
  specialization: string | null;
  maxClientLimit: number | null;
  assignedClientsCount: number;
  availableCapacity: number | null;
  utilizationPercentage: number | null;
}

interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  isActive: boolean;
  emailVerified: boolean;
  isAssigned: boolean;
  clientId: string | null;
  assignedRM: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
  } | null;
  assignedAt: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function AssignmentsContent() {
  const [rms, setRMs] = useState<RM[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [rmFilter, setRMFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRMId, setSelectedRMId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Bulk assignment state
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRMId, setBulkRMId] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);

  // Fetch RMs and clients
  useEffect(() => {
    fetchRMs();
  }, []);

  const fetchRMs = async () => {
    try {
      const response = await fetch('/api/admin/rms');
      const data = await response.json();

      if (data.success) {
        setRMs(data.data);
      } else {
        setError('Failed to load relationship managers');
      }
    } catch (err) {
      setError('An error occurred while loading relationship managers');
    }
  };

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      params.set('assignmentStatus', assignmentFilter);
      if (rmFilter) params.set('rmId', rmFilter);
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      const response = await fetch(`/api/admin/clients?${params}`);
      const data = await response.json();

      if (data.success) {
        setClients(data.data.clients);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || 'Failed to load clients');
      }
    } catch (err) {
      setError('An error occurred while loading clients');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, assignmentFilter, rmFilter, currentPage]);

  useEffect(() => {
    fetchClients();
  }, [searchQuery, assignmentFilter, rmFilter, currentPage, fetchClients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchClients();
  };

  const openAssignModal = (client: Client) => {
    setSelectedClient(client);
    setSelectedRMId(client.assignedRM?.id || '');
    setAssignmentReason('');
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedClient(null);
    setSelectedRMId('');
    setAssignmentReason('');
  };

  const handleAssignment = async () => {
    if (!selectedClient || !selectedRMId) return;

    setError('');
    setSuccess('');
    setIsAssigning(true);

    try {
      const response = await fetch('/api/admin/clients/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedClient.id,
          rmId: selectedRMId,
          reason: assignmentReason || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Client assigned successfully');
        closeAssignModal();
        fetchClients();
        fetchRMs(); // Refresh RM workload
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to assign client');
      }
    } catch (err) {
      setError('An error occurred while assigning client');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleSelectClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter((id) => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map((c) => c.id));
    }
  };

  const openBulkModal = () => {
    setBulkRMId('');
    setBulkReason('');
    setShowBulkModal(true);
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkRMId('');
    setBulkReason('');
  };

  const handleBulkAssignment = async () => {
    if (selectedClients.length === 0 || !bulkRMId) return;

    setError('');
    setSuccess('');
    setIsBulkAssigning(true);

    try {
      const response = await fetch('/api/admin/clients/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUserIds: selectedClients,
          rmId: bulkRMId,
          reason: bulkReason || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Bulk assignment completed');
        setSelectedClients([]);
        closeBulkModal();
        fetchClients();
        fetchRMs();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to perform bulk assignment');
      }
    } catch (err) {
      setError('An error occurred during bulk assignment');
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const getUtilizationColor = (percentage: number | null) => {
    if (percentage === null) return 'bg-gray-100 text-gray-800';
    if (percentage < 50) return 'bg-green-100 text-green-800';
    if (percentage < 80) return 'bg-yellow-100 text-yellow-800';
    if (percentage < 100) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-optima text-2xl font-bold text-brand-blue">Client-RM Assignments</h1>
        <p className="font-georgia mt-1 text-sm text-brand-grey">
          Manage client assignments to relationship managers
        </p>
      </div>

      {/* RM Workload Summary */}
      <div className="mb-6 grid gap-3 grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <div className="text-xs font-medium text-gray-600">Relationship Managers</div>
          <div className="mt-1.5 text-2xl font-bold text-brand-blue">{rms.length}</div>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <div className="text-xs font-medium text-gray-600">Assigned Clients</div>
          <div className="mt-1.5 text-2xl font-bold text-brand-blue">
            {rms.reduce((sum, rm) => sum + rm.assignedClientsCount, 0)}
          </div>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <div className="text-xs font-medium text-gray-600">Clients per RM</div>
          <div className="mt-1.5 text-2xl font-bold text-brand-blue">
            {rms.length > 0
              ? Math.round(
                rms.reduce((sum, rm) => sum + rm.assignedClientsCount, 0) / rms.length
              )
              : 0}
          </div>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <div className="text-xs font-medium text-gray-600">Total Capacity</div>
          <div className="mt-1.5 text-2xl font-bold text-brand-blue">
            {rms
              .filter((rm) => rm.maxClientLimit !== null)
              .reduce((sum, rm) => sum + (rm.maxClientLimit || 0), 0)}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Clients
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              />
            </div>

            {/* Assignment Filter */}
            <div>
              <label htmlFor="assignment" className="block text-sm font-medium text-gray-700">
                Assignment Status
              </label>
              <Select
                value={assignmentFilter}
                onValueChange={(value) => {
                  setAssignmentFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RM Filter */}
            <div>
              <label htmlFor="rm" className="block text-sm font-medium text-gray-700">
                Relationship Manager
              </label>
              <Select
                value={rmFilter}
                onValueChange={(value) => {
                  setRMFilter(value === 'all' ? '' : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All RMs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RMs</SelectItem>
                  {rms.map((rm) => (
                    <SelectItem key={rm.id} value={rm.id}>
                      {rm.fullName} ({rm.assignedClientsCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setAssignmentFilter('all');
                setRMFilter('');
                setCurrentPage(1);
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      {selectedClients.length > 0 && (
        <div className="mb-6 rounded-lg bg-brand-blue/10 p-4 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedClients.length} client(s) selected
              </span>
              <button
                onClick={openBulkModal}
                className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90"
              >
                Bulk Assign
              </button>
            </div>
            <button
              onClick={() => setSelectedClients([])}
              className="text-sm text-brand-blue hover:text-brand-blue/80"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <ResponsiveTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Assigned RM</TableHead>
              <TableHead>Assigned Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Searching...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No clients found
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => toggleSelectClient(client.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{client.fullName}</div>
                    {client.emailVerified ? (
                      <div className="text-xs text-green-600">✓ Verified</div>
                    ) : (
                      <div className="text-xs text-yellow-600">Not verified</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.email}
                  </TableCell>
                  <TableCell>
                    {client.assignedRM ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.assignedRM.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground">{client.assignedRM.email}</div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Unassigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.assignedAt ? new Date(client.assignedAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="link"
                      className="text-brand-blue hover:text-brand-blue/80 p-0 h-auto font-medium"
                      onClick={() => openAssignModal(client)}
                    >
                      {client.isAssigned ? 'Reassign' : 'Assign'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ResponsiveTable>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue/5 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue/5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                <span className="font-medium">{pagination.totalPages}</span> (
                <span className="font-medium">{pagination.totalCount}</span> total clients)
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-brand-blue/5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-brand-blue/5 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {
        showAssignModal && selectedClient && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              {/* Modal */}
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-4 md:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {selectedClient.isAssigned ? 'Reassign' : 'Assign'} Client to RM
                  </h3>

                  <div className="mt-4">
                    <div className="mb-4 rounded-md bg-brand-blue/10 p-3">
                      <p className="text-sm font-medium text-blue-900">Client</p>
                      <p className="text-sm text-brand-blue">
                        {selectedClient.fullName} ({selectedClient.email})
                      </p>
                      {selectedClient.assignedRM && (
                        <p className="mt-2 text-xs text-brand-blue">
                          Currently assigned to: {selectedClient.assignedRM.fullName}
                        </p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="rmSelect" className="block text-sm font-medium text-gray-700">
                        Select Relationship Manager
                      </label>
                      <Select
                        value={selectedRMId}
                        onValueChange={setSelectedRMId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- Select RM --" />
                        </SelectTrigger>
                        <SelectContent>
                          {rms
                            .filter((rm) => rm.isActive && rm.status === 'ACTIVE')
                            .map((rm) => (
                              <SelectItem key={rm.id} value={rm.id}>
                                {rm.fullName} - {rm.assignedClientsCount}
                                {rm.maxClientLimit ? `/${rm.maxClientLimit}` : ''} clients
                                {rm.utilizationPercentage !== null
                                  ? ` (${rm.utilizationPercentage}%)`
                                  : ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRMId && (
                      <div className="mb-4 rounded-md bg-gray-50 p-3">
                        {(() => {
                          const selectedRM = rms.find((rm) => rm.id === selectedRMId);
                          if (!selectedRM) return null;
                          return (
                            <div className="text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Workload</span>
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getUtilizationColor(selectedRM.utilizationPercentage)}`}
                                >
                                  {selectedRM.utilizationPercentage !== null
                                    ? `${selectedRM.utilizationPercentage}%`
                                    : 'No limit'}
                                </span>
                              </div>
                              {selectedRM.specialization && (
                                <div className="mt-2 text-xs text-gray-600">
                                  Specialization: {selectedRM.specialization}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {selectedClient.isAssigned && (
                      <div className="mb-4">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                          Reason for Reassignment (Optional)
                        </label>
                        <textarea
                          id="reason"
                          value={assignmentReason}
                          onChange={(e) => setAssignmentReason(e.target.value)}
                          rows={3}
                          maxLength={500}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
                          placeholder="Enter reason for reassignment..."
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={handleAssignment}
                    disabled={!selectedRMId || isAssigning}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-brand-blue px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isAssigning ? 'Assigning...' : selectedClient.isAssigned ? 'Reassign' : 'Assign'}
                  </button>
                  <button
                    onClick={closeAssignModal}
                    disabled={isAssigning}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-brand-blue/5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Assignment Modal */}
      {
        showBulkModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              {/* Modal */}
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-4 md:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Bulk Assign Clients to RM
                  </h3>

                  <div className="mt-4">
                    <div className="mb-4 rounded-md bg-brand-blue/10 p-3">
                      <p className="text-sm font-medium text-blue-900">
                        Selected Clients: {selectedClients.length}
                      </p>
                      <p className="mt-1 text-xs text-brand-blue">
                        {selectedClients.length === 1
                          ? '1 client will be assigned/reassigned'
                          : `${selectedClients.length} clients will be assigned/reassigned`}
                      </p>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="bulkRmSelect" className="block text-sm font-medium text-gray-700">
                        Select Relationship Manager
                      </label>
                      <Select
                        value={bulkRMId}
                        onValueChange={setBulkRMId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- Select RM --" />
                        </SelectTrigger>
                        <SelectContent>
                          {rms
                            .filter((rm) => rm.isActive && rm.status === 'ACTIVE')
                            .map((rm) => (
                              <SelectItem key={rm.id} value={rm.id}>
                                {rm.fullName} - {rm.assignedClientsCount}
                                {rm.maxClientLimit ? `/${rm.maxClientLimit}` : ''} clients
                                {rm.utilizationPercentage !== null
                                  ? ` (${rm.utilizationPercentage}%)`
                                  : ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {bulkRMId && (
                      <div className="mb-4 rounded-md bg-gray-50 p-3">
                        {(() => {
                          const selectedRM = rms.find((rm) => rm.id === bulkRMId);
                          if (!selectedRM) return null;

                          const newLoad = selectedRM.assignedClientsCount + selectedClients.length;
                          const wouldExceed = selectedRM.maxClientLimit && newLoad > selectedRM.maxClientLimit;

                          return (
                            <div className="text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Current Workload</span>
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getUtilizationColor(selectedRM.utilizationPercentage)}`}
                                >
                                  {selectedRM.utilizationPercentage !== null
                                    ? `${selectedRM.utilizationPercentage}%`
                                    : 'No limit'}
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-gray-600">
                                After assignment: {newLoad} clients
                                {selectedRM.maxClientLimit ? ` / ${selectedRM.maxClientLimit}` : ''}
                              </div>
                              {wouldExceed && (
                                <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800">
                                  Warning: This assignment would exceed the RM&apos;s capacity limit
                                </div>
                              )}
                              {selectedRM.specialization && (
                                <div className="mt-2 text-xs text-gray-600">
                                  Specialization: {selectedRM.specialization}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="mb-4">
                      <label htmlFor="bulkReason" className="block text-sm font-medium text-gray-700">
                        Reason for Assignment (Optional)
                      </label>
                      <textarea
                        id="bulkReason"
                        value={bulkReason}
                        onChange={(e) => setBulkReason(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
                        placeholder="Enter reason for bulk assignment..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={handleBulkAssignment}
                    disabled={!bulkRMId || isBulkAssigning}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-brand-blue px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isBulkAssigning ? 'Assigning...' : `Assign ${selectedClients.length} Client${selectedClients.length === 1 ? '' : 's'}`}
                  </button>
                  <button
                    onClick={closeBulkModal}
                    disabled={isBulkAssigning}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-brand-blue/5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default function AssignmentsPage() {
  return (
    <RequireAdmin>
      <AssignmentsContent />
    </RequireAdmin>
  );
}
