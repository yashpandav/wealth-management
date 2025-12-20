/**
 * Email Verification Page
 * Handles email verification when user clicks the link from their email
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type VerificationState = 'loading' | 'success' | 'error' | 'no-token';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) {
      setState('no-token');
      setMessage('No verification token provided. Please check your email link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setState('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setState('error');
          setMessage(data.error || 'Failed to verify email. Please try again.');
        }
      } catch {
        setState('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  // Countdown and redirect for success state
  useEffect(() => {
    if (state === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Email Verification
          </h1>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          {state === 'loading' && (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-green-800">
                Email Verified!
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">
                Redirecting to login in {countdown} seconds...
              </p>
              <div className="mt-6 rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Next Step:</strong> After logging in, please complete your profile
                  and upload KYC documents to start investing.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Go to Login Now
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-10 w-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-red-800">
                Verification Failed
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <p className="text-sm text-gray-500">
                  The verification link may have expired or already been used.
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Go to Login
                </Link>
                <p className="text-sm text-gray-500">
                  Need help?{' '}
                  <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          )}

          {state === 'no-token' && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <svg
                  className="h-10 w-10 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-yellow-800">
                Invalid Link
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <p className="text-sm text-gray-500">
                  Please check your email and click the verification link again,
                  or request a new verification email.
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Wealth Management CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
