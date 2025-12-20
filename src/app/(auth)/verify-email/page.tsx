/**
 * Email Verification Page
 * Handles email verification when user clicks the link from their email
 */

'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
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
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setState('no-token');
      setMessage('No verification token provided. Please check your email link.');
      return;
    }

    // Prevent double-calling in React StrictMode
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

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
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Email Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Wealth Management CRM Platform
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {state === 'loading' && (
            <div className="text-center py-4">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-sm text-gray-600">Verifying your email address...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Email Verified</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-3 text-xs text-gray-500">
                Redirecting to login in {countdown} seconds...
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Continue to Login
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                After logging in, please upload your KYC documents to start investing.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Verification Failed</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-3 text-xs text-gray-500">
                The verification link may have expired or already been used.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Go to Login
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Need help? <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-500">Contact Support</a>
              </p>
            </div>
          )}

          {state === 'no-token' && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Invalid Link</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-3 text-xs text-gray-500">
                Please check your email and click the verification link again.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600">Already verified? </span>
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                Email Verification
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Wealth Management CRM Platform
              </p>
            </div>
            <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center py-4">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-4 text-sm text-gray-600">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
