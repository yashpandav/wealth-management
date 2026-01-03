/**
 * Admin User Creation Page
 * Form for creating new users with role assignment
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAdmin } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

function CreateUserContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [createdUserEmail, setCreatedUserEmail] = useState('');

  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CLIENT');
  const [status, setStatus] = useState('ACTIVE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTempPassword('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone: phone || null,
          role,
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`User created successfully!`);
        setTempPassword(data.data.temporaryPassword);
        setCreatedUserEmail(email);
        setShowPasswordModal(true);

        // Reset form
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setRole('CLIENT');
        setStatus('ACTIVE');
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An error occurred while creating user');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleModalClose = () => {
    setShowPasswordModal(false);
    router.push('/admin/users');
  };

  return (
    <>
      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              User Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Please save these credentials. The password will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={createdUserEmail}
                  readOnly
                  className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdUserEmail, 'Email')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Temporary Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Temporary Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempPassword}
                  readOnly
                  className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(tempPassword, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              <strong>Important:</strong> The user must change this password upon first login.
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleModalClose} className="w-full">
              OK - Go to Users List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-brand-blue"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create New User</h1>
            <p className="mt-2 text-sm text-gray-600">
              Add a new user to the system with a specific role
            </p>
          </div>
        </div>
      </div>

      {/* Success Message with Temp Password */}
      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
              {tempPassword && (
                <div className="mt-3 rounded-md bg-white p-3 border border-green-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Temporary Password (share securely with user):
                  </p>
                  <code className="text-sm font-mono text-brand-blue bg-brand-blue/10 px-2 py-1 rounded">
                    {tempPassword}
                  </code>
                  <p className="mt-2 text-xs text-gray-600">
                    User will be prompted to change this password on first login.
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-green-700">
                Redirecting to user list in 5 seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="rounded-lg bg-white shadow">
        <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* Email */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
                placeholder="user@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email will be used for login and notifications
              </p>
            </div>

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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
                placeholder="John"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
                placeholder="Doe"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
                placeholder="+1 (555) 000-0000"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              >
                <option value="CLIENT">Client - Can invest and manage portfolio</option>
                <option value="RM">Relationship Manager - Can manage clients</option>
                <option value="ADMIN">Administrator - Full system access</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {role === 'CLIENT' && 'Clients can view instruments and manage their portfolio'}
                {role === 'RM' && 'RMs can manage clients and approve purchase requests'}
                {role === 'ADMIN' && 'Admins have full access to all system features'}
              </p>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Account Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              >
                <option value="ACTIVE">Active - User can login and use the system</option>
                <option value="INACTIVE">Inactive - User cannot login</option>
                <option value="LOCKED">Locked - Account is locked</option>
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-md bg-brand-blue/10 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-brand-blue">
                  <strong>Important:</strong> A temporary password will be generated for this user.
                  Make sure to securely share it with them. The user will be required to change
                  their password on first login.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-brand-blue px-6 py-2 text-sm font-medium text-white hover:bg-brand-blue/90 disabled:opacity-50"
            >
              {isLoading ? 'Creating User...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isLoading}
              className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue/5 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}

export default function CreateUserPage() {
  return (
    <RequireAdmin>
      <CreateUserContent />
    </RequireAdmin>
  );
}
