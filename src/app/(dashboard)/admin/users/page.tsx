/**
 * Admin User Management Dashboard
 * List, search, filter, and manage users
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RequireAdmin } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  status: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
  failedLoginAttempts: number;
  accountLockedUntil: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function AdminUsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk operations states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('An error occurred while loading users');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, currentPage, sortBy, sortOrder]);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, currentPage, sortBy, sortOrder, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Handle status change for individual user
  const handleStatusChange = async (userId: string, newStatus: string) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`User status updated to ${newStatus}`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred while updating status');
    }
  };

  // Handle unlock account
  const handleUnlock = async (userId: string) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/unlock`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User account unlocked successfully');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to unlock account');
      }
    } catch (err) {
      setError('An error occurred while unlocking account');
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async () => {
    if (!bulkOperation || selectedUsers.length === 0) return;

    setError('');
    setSuccess('');
    setIsBulkProcessing(true);

    try {
      const response = await fetch('/api/admin/users/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          operation: bulkOperation,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Bulk operation completed successfully');
        setSelectedUsers([]);
        setBulkOperation('');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to perform bulk operation');
      }
    } catch (err) {
      setError('An error occurred during bulk operation');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Toggle select all users
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  // Toggle select individual user
  const toggleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'RM':
        return 'bg-blue-100 text-blue-800';
      case 'CLIENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'LOCKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mx-auto max-w-full sm:max-w-7xl px-4 py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">User Management</h1>
          <p className="font-georgia mt-2 text-brand-grey">
            Manage all users, roles, and permissions
          </p>
        </div>
        <a
          href="/admin/users/create"
          className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90"
        >
          Create User
        </a>
      </div>

      {/* Search and Filters */}
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
                placeholder="Search by name or email..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="RM">RM</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOCKED">Locked</option>
              </select>
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
                setRoleFilter('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      {selectedUsers.length > 0 && (
        <div className="mb-6 rounded-lg bg-brand-blue/10 p-4 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user(s) selected
              </span>
              <select
                value={bulkOperation}
                onChange={(e) => setBulkOperation(e.target.value)}
                className="rounded-md border border-brand-blue bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              >
                <option value="">Select Operation</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="lock">Lock</option>
                <option value="unlock">Unlock</option>
                <option value="delete">Delete (Soft)</option>
              </select>
              <button
                onClick={handleBulkOperation}
                disabled={!bulkOperation || isBulkProcessing}
                className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90 disabled:opacity-50"
              >
                {isBulkProcessing ? 'Processing...' : 'Apply'}
              </button>
            </div>
            <button
              onClick={() => setSelectedUsers([])}
              className="text-sm text-brand-blue hover:text-brand-blue/80"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-white shadow">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <p className="text-sm text-gray-600">Loading users...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg bg-white p-4 md:p-4 md:p-6 lg:p-8 text-center shadow">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
            <table className="text-sm min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('lastName')}
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  >
                    Name {sortBy === 'lastName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  >
                    Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  >
                    Joined {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('lastLogin')}
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  >
                    Last Login {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      {user.emailVerified ? (
                        <div className="text-xs text-green-600">✓ Verified</div>
                      ) : (
                        <div className="text-xs text-yellow-600">Not verified</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                      {user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date() && (
                        <div className="mt-1 text-xs text-red-600">
                          Locked until {new Date(user.accountLockedUntil).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Unlock Button (only show for locked accounts) */}
                        {(user.status === 'LOCKED' ||
                          (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date())) && (
                            <button
                              onClick={() => handleUnlock(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Unlock Account"
                            >
                              🔓 Unlock
                            </button>
                          )}

                        {/* Status Dropdown */}
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
                          title="Change Status"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="LOCKED">Locked</option>
                        </select>

                        {/* Edit Link */}
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="text-brand-blue hover:text-brand-blue/80"
                        >
                          Edit
                        </Link>
                      </div>
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
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pagination.limit, pagination.totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalCount}</span> results
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
                    <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
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

export default function AdminUsersPage() {
  return (
    <RequireAdmin>
      <AdminUsersContent />
    </RequireAdmin>
  );
}
