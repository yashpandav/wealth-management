/**
 * Forgot Password Page
 * Request password reset link — split layout matching auth pages
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccess(data.message);
      setEmail('');
      setIsLoading(false);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

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
            Reset your<br />
            <span className="text-[#657997]">access securely.</span>
          </h2>
          <p className="mt-5 font-georgia text-[0.9rem] text-[#F6F6F6]/45 leading-[1.8] max-w-xs">
            Enter your registered email and we&apos;ll send you a verified link to reset your password.
          </p>
        </div>

        <div className="pt-8 border-t border-[#F6F6F6]/10 space-y-4">
          {[
            'Link expires in 1 hour for security',
            'Check your spam folder if not received',
            'Contact your RM if you need further help',
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
              Forgot password?
            </h2>
            <p className="mt-1.5 font-georgia text-[0.9rem] text-brand-grey">
              We&apos;ll send a reset link to your email
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
                className="block w-full rounded-md border border-gray-300 px-3 py-2.5 text-comments text-brand-blue placeholder-gray-400 transition-all duration-200 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue hover:border-brand-grey font-nums"
                placeholder="john@example.com"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full justify-center rounded-md bg-brand-blue px-4 py-2.5 text-comments font-optima font-semibold text-brand-white transition-all duration-200 hover:bg-opacity-90 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending…' : 'Send reset link'}
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
