/**
 * Login Form Component
 * Client-side form for email/password authentication
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Fetch session to get user role
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        // Determine redirect URL based on role
        let redirectUrl = '/dashboard';

        if (callbackUrl) {
          redirectUrl = callbackUrl;
        } else if (session?.user?.role) {
          switch (session.user.role) {
            case 'CLIENT':
              redirectUrl = '/client/portfolio';
              break;
            case 'ADMIN':
              redirectUrl = '/admin';
              break;
            case 'RM':
            case 'DOCADMIN':
              redirectUrl = '/dashboard';
              break;
            default:
              redirectUrl = '/dashboard';
          }
        }

        // Type assertion needed due to Next.js router type limitations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(redirectUrl as any);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-comments font-optima font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="-space-y-px rounded-md shadow-sm">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="relative block w-full rounded-t-md border-0 px-3 py-2 text-comments font-optima text-brand-blue ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition-all duration-200 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-blue hover:ring-brand-grey"
            placeholder="Email address"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="relative block w-full rounded-b-md border-0 px-3 py-2 text-comments font-optima text-brand-blue ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition-all duration-200 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-blue hover:ring-brand-grey"
            placeholder="Password"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-comments font-optima">
          <a
            href="/forgot-password"
            className="font-medium text-brand-blue hover:text-brand-grey transition-colors duration-200 ease-in-out underline-offset-2 hover:underline"
          >
            Forgot your password?
          </a>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full justify-center rounded-md bg-brand-blue px-4 py-2.5 text-comments font-optima font-semibold text-brand-white transition-all duration-200 ease-in-out hover:bg-opacity-90 hover:shadow-lg hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div className="text-center text-comments font-optima">
        <span className="text-brand-grey">New login? </span>
        <a href="/register" className="font-medium text-brand-blue hover:text-brand-grey transition-colors duration-200 ease-in-out underline-offset-2 hover:underline">
          Register
        </a>
      </div>
    </form>
  );
}
