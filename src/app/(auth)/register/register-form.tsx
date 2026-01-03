/**
 * Registration Form Component
 * Client-side form for user registration with lead data prefilling
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load and prefill lead data from localStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('leadFormData');

      if (storedData) {
        const leadData = JSON.parse(storedData);
        setFormData((prev) => ({
          ...prev,
          firstName: leadData.firstName || '',
          lastName: leadData.lastName || '',
          email: leadData.email || '',
          phone: leadData.phoneNumber || '',
        }));

        // Clear localStorage after reading to avoid stale data
        localStorage.removeItem('leadFormData');
      }
    } catch (err) {
      console.error('Error loading lead data from localStorage:', err);
      // Continue without prefilling
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          // Zod validation errors
          const errorMessages = data.details.map((err: { message: string }) => err.message).join(', ');
          setError(errorMessages);
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      setSuccess(
        data.message +
          ' After verifying your email, you will need to upload your KYC documents.'
      );
      // Redirect to login after 3 seconds
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push('/login' as any);
      }, 3000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-comments font-optima font-medium text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-comments font-optima font-medium text-green-800">{success}</div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-comments font-optima font-medium text-brand-blue">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments font-optima text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey"
              placeholder="John"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-comments font-optima font-medium text-brand-blue">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments font-optima text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey"
              placeholder="Doe"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-comments font-optima font-medium text-brand-blue">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments font-optima text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey"
            placeholder="john@example.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-comments font-optima font-medium text-brand-blue">
            Phone Number (Optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments font-optima text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey"
            placeholder="+1 (555) 123-4567"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-comments font-optima font-medium text-brand-blue">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments font-optima text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey"
            placeholder="••••••••"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs font-optima text-brand-grey">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-comments font-optima font-medium text-brand-blue">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments font-optima text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md bg-brand-blue px-4 py-2.5 text-comments font-optima font-semibold text-brand-white transition-all duration-200 ease-in-out hover:bg-opacity-90 hover:shadow-lg hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </div>

      <div className="text-center text-comments font-optima">
        <span className="text-brand-grey">Already have an account? </span>
        <a href="/login" className="font-medium text-brand-blue hover:text-brand-grey transition-colors duration-200 ease-in-out underline-offset-2 hover:underline">
          Sign in
        </a>
      </div>
    </form>
  );
}
