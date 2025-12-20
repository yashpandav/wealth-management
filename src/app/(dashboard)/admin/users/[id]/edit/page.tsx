/**
 * Admin User Edit Page
 * Edit user details and manage role changes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  updatedAt: string;
  lastLogin: string | null;
}

function EditUserContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Track if role is being changed
  const [originalRole, setOriginalRole] = useState('');

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setFirstName(data.data.firstName);
        setLastName(data.data.lastName);
        setPhone(data.data.phone || '');
        setRole(data.data.role);
        setOriginalRole(data.data.role);
        setStatus(data.data.status);
        setIsActive(data.data.isActive);
      } else {
        setError('Failed to load user');
      }
    } catch (err) {
      setError('An error occurred while loading user');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  // Fetch user details
  useEffect(() => {
    fetchUser();
  }, [params.id, fetchUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if role is being changed
    if (role !== originalRole) {
      setShowRoleConfirm(true);
      return;
    }

    await saveUser();
  };

  const saveUser = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);
    setShowRoleConfirm(false);

    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || null,
          role,
          status,
          isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User updated successfully');
        setUser(data.data);
        setOriginalRole(data.data.role);

        // Redirect after 2 seconds
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.push('/admin/users' as any);
        }, 2000);
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('An error occurred while updating user');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
            <p className="mt-2 text-sm text-gray-600">
              Update user details, role, and account status
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
          <p className="mt-1 text-xs text-green-700">Redirecting to user list...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Role Change Confirmation Dialog */}
      {showRoleConfirm && (
        <div className="mb-6 rounded-md border-2 border-yellow-400 bg-yellow-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Confirm Role Change
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You are changing this user&apos;s role from <strong>{originalRole}</strong> to{' '}
                  <strong>{role}</strong>. This will affect their permissions and access to
                  system features.
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={saveUser}
                  disabled={isSaving}
                  className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Confirm Role Change'}
                </button>
                <button
                  onClick={() => {
                    setShowRoleConfirm(false);
                    setRole(originalRole);
                  }}
                  disabled={isSaving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info Card */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email Verified</p>
            <p className="text-sm font-medium text-gray-900">
              {user.emailVerified ? (
                <span className="text-green-600">✓ Verified</span>
              ) : (
                <span className="text-yellow-600">Not verified</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last Login</p>
            <p className="text-sm font-medium text-gray-900">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="rounded-lg bg-white shadow">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={100}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={100}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="CLIENT">Client</option>
                <option value="RM">Relationship Manager</option>
                <option value="ADMIN">Administrator</option>
              </select>
              {role !== originalRole && (
                <p className="mt-1 text-xs text-yellow-600">
                  ⚠️ Role change requires confirmation
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Account Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOCKED">Locked</option>
              </select>
            </div>

            {/* Is Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Account is active
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSaving}
              className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  return (
    <RequireAdmin>
      <EditUserContent params={params} />
    </RequireAdmin>
  );
}
