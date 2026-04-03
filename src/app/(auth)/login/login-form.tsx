/**
 * Login Form Component
 * Client-side form for email/password authentication
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        const response = await fetch('/api/auth/session');
        const session = await response.json();

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(redirectUrl as any);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-md border border-gray-300 px-3 py-2.5 text-comments text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey font-nums';

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 border border-red-100">
          <p className="text-sm font-optima font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-comments font-optima font-medium text-brand-blue mb-1">
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
          className={inputClass}
          placeholder="john@example.com"
          disabled={isLoading}
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-comments font-optima font-medium text-brand-blue">
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-xs font-optima text-brand-grey hover:text-brand-blue transition-colors duration-200 underline-offset-2 hover:underline"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-10`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 z-20 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 group relative flex w-full justify-center rounded-md bg-brand-blue px-4 py-2.5 text-comments font-optima font-semibold text-brand-white transition-all duration-200 ease-in-out hover:bg-opacity-90 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-comments font-optima text-brand-grey">
        Don&apos;t have an account?{' '}
        <a
          href="/register"
          className="font-medium text-brand-blue hover:text-brand-grey transition-colors duration-200 underline-offset-2 hover:underline"
        >
          Register
        </a>
      </p>

    </form>
  );
}
