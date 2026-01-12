/**
 * User Profile Page
 * View and edit user profile
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';

interface UserProfile {
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
}

function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Fetch profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setFirstName(data.data.firstName);
        setLastName(data.data.lastName);
        setPhone(data.data.phone || '');
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('An error occurred while loading profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setSuccess('Profile updated successfully');
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone || '');
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-blue/20 border-t-brand-blue"></div>
          <p className="font-georgia text-comments text-brand-grey leading-relaxed">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="font-georgia text-comments text-red-800 leading-relaxed">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      {/* Header with Logo */}
      <div className="mb-8 flex flex-col items-center">
        <img
          src="/images/logo/primary-logo-1.png"
          alt="EMDEE VENTURES"
          className="h-16 w-auto object-contain"
        />
        <div className="mt-3 h-px w-32 bg-brand-grey/40" />
        <p className="mt-2 text-xs font-optima tracking-wide text-brand-grey">
          For a Better Tomorrow
        </p>
      </div>

      <div className="mb-8 text-center">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue tracking-wide leading-tight">My Profile</h1>
        <p className="font-georgia text-comments text-brand-grey mt-2 leading-relaxed">View and manage your profile information</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="font-georgia text-comments text-green-800 leading-relaxed">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="font-georgia text-comments text-red-800 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-lg border-2 border-brand-blue/20">
        <div className="border-b border-brand-grey/20 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="font-optima text-xl font-semibold text-brand-blue tracking-wide">Profile Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-brand-blue px-6 py-2.5 font-optima text-comments font-medium text-white hover:bg-brand-blue/90 shadow-lg transition-all hover:shadow-xl tracking-wide"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="font-optima block text-comments font-medium text-brand-blue tracking-wide">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="font-georgia mt-2 block w-full rounded-lg border-2 border-brand-grey/30 px-4 py-2.5 text-comments leading-relaxed shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="font-optima block text-comments font-medium text-brand-blue tracking-wide">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="font-georgia mt-2 block w-full rounded-lg border-2 border-brand-grey/30 px-4 py-2.5 text-comments leading-relaxed shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="font-optima block text-comments font-medium text-brand-blue tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profile.email}
                    disabled
                    className="font-georgia mt-2 block w-full rounded-lg border-2 border-brand-grey/20 bg-brand-blue/5 px-4 py-2.5 text-comments text-brand-grey leading-relaxed shadow-sm"
                  />
                  <p className="font-georgia mt-1.5 text-xs text-brand-grey leading-relaxed">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="phone" className="font-optima block text-comments font-medium text-brand-blue tracking-wide">
                    Phone Number
                  </label>
                  <PhoneInput
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={(value) => setPhone(value || '')}
                    defaultCountry="AE"
                    international
                    withCountryCallingCode
                    smartCaret={true}
                    limitMaxLength={true}
                    className="mt-2"
                    placeholder="Enter phone number"
                    error={phone ? (isPossiblePhoneNumber(phone) ? undefined : 'Invalid phone number') : undefined}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-brand-blue px-6 py-2.5 font-optima text-comments font-medium text-white hover:bg-brand-blue/90 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all tracking-wide"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="rounded-lg border-2 border-brand-grey/30 bg-white px-6 py-2.5 font-optima text-comments font-medium text-brand-blue hover:bg-brand-blue/5 disabled:opacity-50 transition-all tracking-wide"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div>
                <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">First Name</dt>
                <dd className="font-georgia mt-2 text-comments text-brand-blue font-medium leading-relaxed">{profile.firstName}</dd>
              </div>

              <div>
                <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">Last Name</dt>
                <dd className="font-georgia mt-2 text-comments text-brand-blue font-medium leading-relaxed">{profile.lastName}</dd>
              </div>

              <div>
                <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">Email</dt>
                <dd className="font-georgia mt-2 text-comments text-brand-blue font-medium leading-relaxed break-all">{profile.email}</dd>
              </div>

              <div>
                <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">Phone Number</dt>
                <dd className="font-georgia mt-2 text-comments text-brand-blue font-medium leading-relaxed">{profile.phone || 'Not provided'}</dd>
              </div>

              <div>
                <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">Role</dt>
                <dd className="mt-2">
                  <span className="inline-flex rounded-full bg-brand-blue/10 border border-brand-blue/30 px-3 py-1 font-optima text-xs font-semibold text-brand-blue tracking-wide">
                    {profile.role}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">Account Status</dt>
                <dd className="mt-2">
                  <span className={`inline-flex rounded-full px-3 py-1 font-optima text-xs font-semibold tracking-wide ${profile.status === 'ACTIVE' ? 'bg-green-50 border border-green-200 text-green-700' :
                    profile.status === 'INACTIVE' ? 'bg-gray-50 border border-gray-200 text-gray-700' :
                      'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {profile.status}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">Email Verified</dt>
                <dd className="font-georgia mt-2 text-comments font-medium leading-relaxed">
                  {profile.emailVerified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-yellow-600">Not verified</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">Member Since</dt>
                <dd className="font-georgia mt-2 text-comments text-brand-blue font-medium leading-relaxed">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </dd>
              </div>

              {profile.lastLogin && (
                <div>
                  <dt className="font-optima text-comments font-medium text-brand-grey tracking-wide">Last Login</dt>
                  <dd className="font-georgia mt-2 text-comments text-brand-blue font-medium leading-relaxed">
                    {new Date(profile.lastLogin).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-blue/20 border-t-brand-blue"></div>
          <p className="font-georgia text-comments text-brand-grey leading-relaxed">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <ProfileContent />;
}
