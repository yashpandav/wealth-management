/**
 * Login Page
 * Email and password authentication
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Login | EMDEE VENTURES',
  description: 'Sign in to your account - EMDEE VENTURES',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
          {/* Logo */}
          <img
            src="/images/logo/primary-logo-1.png"
            alt="EMDEE VENTURES"
            className="h-20 w-auto object-contain"
          />

          {/* Divider */}
          <div className="mt-4 h-px w-40 bg-brand-grey/40" />

          {/* Tagline */}
          <p className="mt-3 text-sm font-optima tracking-wide text-brand-grey">
            A Better Tomorrow
          </p>
        </div>


        <div className="mt-8">
          <h2 className="text-center text-subheading font-bold font-optima text-brand-blue">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-comments font-optima text-brand-grey">
            Investment and Holding Company
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-brand-grey">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
