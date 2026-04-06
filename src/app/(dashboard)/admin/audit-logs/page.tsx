/**
 * Admin Audit Logs Viewer
 * View, filter, search, and export audit logs
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { RequireAdmin } from '@/lib/auth/rbac.page-guards';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (actionFilter) params.set('action', actionFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('page', currentPage.toString());
      params.set('limit', '50');

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || 'Failed to load audit logs');
      }
    } catch (err) {
      setError('An error occurred while loading audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, actionFilter, entityTypeFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchAuditLogs();
  }, [searchQuery, actionFilter, entityTypeFilter, startDate, endDate, currentPage, fetchAuditLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (actionFilter) params.set('action', actionFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export audit logs');
    } finally {
      setIsExporting(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-purple-100 text-purple-800';
    if (action.includes('ACTIVATE')) return 'bg-green-100 text-green-800';
    if (action.includes('DEACTIVATE')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Audit Logs</h1>
        <p className="font-georgia mt-2 text-brand-grey">
          View and export comprehensive audit trail of all system actions
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by description, user, entity..."
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              />
            </div>

            {/* Action Filter */}
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                Action
              </label>
              <Select
                value={actionFilter}
                onValueChange={(value) => {
                  setActionFilter(value === 'all' ? '' : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="mt-1 w-full h-10">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE">Password Change</SelectItem>
                  <SelectItem value="MFA_ENABLE">MFA Enable</SelectItem>
                  <SelectItem value="MFA_DISABLE">MFA Disable</SelectItem>
                  <SelectItem value="USER_CREATE">User Create</SelectItem>
                  <SelectItem value="USER_UPDATE">User Update</SelectItem>
                  <SelectItem value="USER_DELETE">User Delete</SelectItem>
                  <SelectItem value="USER_ACTIVATE">User Activate</SelectItem>
                  <SelectItem value="USER_DEACTIVATE">User Deactivate</SelectItem>
                  <SelectItem value="CLIENT_ASSIGN">Client Assign</SelectItem>
                  <SelectItem value="CLIENT_REASSIGN">Client Reassign</SelectItem>
                  <SelectItem value="PURCHASE_REQUEST_CREATE">Purchase Request Create</SelectItem>
                  <SelectItem value="PURCHASE_REQUEST_APPROVE">Purchase Request Approve</SelectItem>
                  <SelectItem value="PURCHASE_REQUEST_REJECT">Purchase Request Reject</SelectItem>
                  <SelectItem value="PURCHASE_REQUEST_CANCEL">Purchase Request Cancel</SelectItem>
                  <SelectItem value="WITHDRAWAL_REQUEST_CREATE">Withdrawal Request Create</SelectItem>
                  <SelectItem value="WITHDRAWAL_REQUEST_RM_APPROVE">Withdrawal Request RM Approve</SelectItem>
                  <SelectItem value="WITHDRAWAL_REQUEST_RM_REJECT">Withdrawal Request RM Reject</SelectItem>
                  <SelectItem value="WITHDRAWAL_REQUEST_ADMIN_APPROVE">Withdrawal Request Admin Approve</SelectItem>
                  <SelectItem value="WITHDRAWAL_REQUEST_ADMIN_REJECT">Withdrawal Request Admin Reject</SelectItem>
                  <SelectItem value="WITHDRAWAL_REQUEST_CANCEL">Withdrawal Request Cancel</SelectItem>
                  <SelectItem value="TRANSACTION_CREATE">Transaction Create</SelectItem>
                  <SelectItem value="TRANSACTION_REVERSE">Transaction Reverse</SelectItem>
                  <SelectItem value="TRANSACTION_FAIL">Transaction Fail</SelectItem>
                  <SelectItem value="DOCUMENT_UPLOAD">Document Upload</SelectItem>
                  <SelectItem value="DOCUMENT_VERIFY">Document Verify</SelectItem>
                  <SelectItem value="DOCUMENT_REJECT">Document Reject</SelectItem>
                  <SelectItem value="DOCUMENT_DELETE">Document Delete</SelectItem>
                  <SelectItem value="CLIENT_VERIFICATION_STATUS_UPDATE">Client Verification Status Update</SelectItem>
                  <SelectItem value="PAYOUT_SCHEDULE_CREATED">Payout Schedule Created</SelectItem>
                  <SelectItem value="PAYOUT_CREATED">Payout Created</SelectItem>
                  <SelectItem value="PAYOUT_COMPLETED">Payout Completed</SelectItem>
                  <SelectItem value="PAYOUT_FAILED">Payout Failed</SelectItem>
                  <SelectItem value="PAYOUT_RECEIPT_UPLOADED">Payout Receipt Uploaded</SelectItem>
                  <SelectItem value="INVESTMENT_CREATE">Investment Create</SelectItem>
                  <SelectItem value="INVESTMENT_UPDATE">Investment Update</SelectItem>
                  <SelectItem value="INVESTMENT_DELETE">Investment Delete</SelectItem>
                  <SelectItem value="INVESTMENT_OPTION_CREATE">Investment Option Create</SelectItem>
                  <SelectItem value="INVESTMENT_OPTION_UPDATE">Investment Option Update</SelectItem>
                  <SelectItem value="INVESTMENT_OPTION_DELETE">Investment Option Delete</SelectItem>
                  <SelectItem value="CLIENT_ARCHIVE">Client Archive</SelectItem>
                  <SelectItem value="CLIENT_RESTORE">Client Restore</SelectItem>
                  <SelectItem value="SYSTEM_CONFIG_CHANGE">System Config Change</SelectItem>
                  <SelectItem value="DATA_EXPORT">Data Export</SelectItem>
                  <SelectItem value="DATA_IMPORT">Data Import</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label htmlFor="entityType" className="block text-sm font-medium text-gray-700">
                Entity Type
              </label>
              <Select
                value={entityTypeFilter}
                onValueChange={(value) => {
                  setEntityTypeFilter(value === 'all' ? '' : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="mt-1 w-full h-10">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="RM">Relationship Manager</SelectItem>
                  <SelectItem value="Transaction">Transaction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              />
            </div>

            <div className="flex items-end gap-2 md:col-span-2">
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
                  setActionFilter('');
                  setEntityTypeFilter('');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Audit Logs Table */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-white shadow">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <p className="text-sm text-gray-600">Loading audit logs...</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg bg-white p-4 md:p-4 md:p-6 lg:p-8 text-center shadow">
          <p className="text-gray-600">No audit logs found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
            <table className="text-sm min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span className="font-nums">{new Date(log.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {log.user.firstName} {log.user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{log.user.email}</div>
                          <div className="text-xs text-gray-500">{log.user.role}</div>
                        </>
                      ) : (
                        <div className="text-sm italic text-gray-500">System</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionBadgeColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div>{log.entityType}</div>
                      <div className="text-xs text-gray-400">{log.entityId}</div>
                    </td>
                    <td className="max-w-md px-6 py-4 text-sm text-gray-500">
                      {log.description}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-brand-blue hover:text-brand-blue/80">
                            View Metadata
                          </summary>
                          <pre className="mt-1 overflow-auto rounded bg-gray-100 p-2 text-xs">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                    Showing page <span className="font-medium font-nums">{pagination.page}</span> of{' '}
                    <span className="font-medium font-nums">{pagination.totalPages}</span> (
                    <span className="font-medium font-nums">{pagination.totalCount}</span> total logs)
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
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${currentPage === page
                            ? 'z-10 border-brand-blue bg-brand-blue/10 text-brand-blue font-nums'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 font-nums'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
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
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <RequireAdmin>
      <AuditLogsContent />
    </RequireAdmin>
  );
}
