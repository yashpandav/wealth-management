/**
 * Reset Password Page
 * Complete password reset with token — split layout matching auth pages
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: { message: string }) => err.message).join(', ');
          setError(errorMessages);
        } else {
          setError(data.error || 'An error occurred. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      setSuccess(data.message);
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push('/login' as any);
      }, 2000);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-md border border-gray-300 px-3 py-2.5 text-comments text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey font-nums';

  return (
    <div className="flex min-h-screen">

      {/* ── Left: Brand Panel ── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] bg-[#002369] flex-col justify-between px-12 py-12 shrink-0">

        <div>
          <Image
            src="/images/logo/primary-logo-1.png"
            alt="EMDEE VENTURES"
            width={110}
            height={74}
            className="object-contain brightness-0 invert opacity-70"
          />
        </div>

        <div>
          <p className="text-[0.62rem] tracking-[0.3em] text-[#657997] uppercase mb-5 font-optima">
            Account Security
          </p>
          <h2
            className="font-optima text-[#F6F6F6] leading-[1.15]"
            style={{ fontSize: 'clamp(1.6rem, 2.4vw, 2.4rem)' }}
          >
            Set a new<br />
            <span className="text-[#657997]">secure password.</span>
          </h2>
          <p className="mt-5 font-georgia text-[0.9rem] text-[#F6F6F6]/45 leading-[1.8] max-w-xs">
            Choose a strong password you haven&apos;t used before to keep your account secure.
          </p>
        </div>

        <div className="pt-8 border-t border-[#F6F6F6]/10 space-y-4">
          {[
            'At least 8 characters required',
            'Include uppercase, lowercase, number & symbol',
            'You will be redirected to login after reset',
          ].map((tip) => (
            <div key={tip} className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#657997] shrink-0" />
              <p className="font-georgia text-[0.78rem] text-[#F6F6F6]/40 leading-snug">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-10 lg:hidden">
            <Image
              src="/images/logo/primary-logo-1.png"
              alt="EMDEE VENTURES"
              width={150}
              height={100}
              className="object-contain"
            />
          </div>

          <div className="mb-8">
            <h2 className="font-optima font-bold text-[1.85rem] text-brand-blue leading-tight">
              Set new password
            </h2>
            <p className="mt-1.5 font-georgia text-[0.9rem] text-brand-grey">
              Enter and confirm your new password below
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>

            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3 border border-red-100">
                <p className="text-sm font-optima font-medium text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 px-4 py-3 border border-green-100">
                <p className="text-sm font-optima font-medium text-green-800">{success}</p>
              </div>
            )}

            {/* New password */}
            <div>
              <label htmlFor="password" className="block text-comments font-optima font-medium text-brand-blue mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                  disabled={isLoading || !token}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs font-optima text-brand-grey">
                Min. 8 characters with uppercase, lowercase, number &amp; special character
              </p>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-comments font-optima font-medium text-brand-blue mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                  disabled={isLoading || !token}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="mt-2 flex w-full justify-center rounded-md bg-brand-blue px-4 py-2.5 text-comments font-optima font-semibold text-brand-white transition-all duration-200 hover:bg-opacity-90 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting…' : 'Reset password'}
            </button>

            <p className="text-center text-comments font-optima text-brand-grey">
              <a
                href="/login"
                className="font-medium text-brand-blue hover:text-brand-grey transition-colors duration-200 underline-offset-2 hover:underline"
              >
                ← Back to login
              </a>
            </p>

          </form>
        </div>
      </div>

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-blue/20 border-t-brand-blue" />
          <p className="font-georgia text-sm text-brand-grey">Loading…</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
