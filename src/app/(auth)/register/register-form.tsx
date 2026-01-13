/**
 * Registration Form Component
 * Client-side form for user registration with lead data prefilling
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';

import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          phone: leadData.phoneNumber || '', // Assumes leadData has phoneNumber
        }));

        // Clear localStorage after reading to avoid stale data
        localStorage.removeItem('leadFormData');
      }
    } catch (err) {
      console.error('Error loading lead data from localStorage:', err);
      // Continue without prefilling
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData((prev) => ({
      ...prev,
      phone: value || '',
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
        body: JSON.stringify({
          ...formData,
        }),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey font-nums"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey font-nums"
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-comments text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey font-nums"
            placeholder="john@example.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-comments font-optima font-medium text-brand-blue">
            Phone Number
          </label>
          <PhoneInput
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            defaultCountry="AE"
            international
            withCountryCallingCode
            disabled={isLoading}
            smartCaret={true}
            limitMaxLength={true}
            className="mt-1 font-nums"
            placeholder="Enter phone number"
            error={formData.phone ? (isPossiblePhoneNumber(formData.phone) ? undefined : 'Invalid phone number') : 'Phone number required'}
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="block text-comments font-optima font-medium text-brand-blue">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-comments text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey pr-10 font-nums"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1 text-xs font-optima text-brand-grey">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div className="relative">
          <label htmlFor="confirmPassword" className="block text-comments font-optima font-medium text-brand-blue">
            Confirm Password
          </label>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-comments text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey pr-10 font-nums"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
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
