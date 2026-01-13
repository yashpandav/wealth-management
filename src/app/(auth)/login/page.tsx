/**
 * Login Page
 * Email and password authentication
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Login | EMDEE VENTURES',
  description: 'Sign in to your account - EMDEE VENTURES',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-white px-4 py-12 sm:px-6 lg:px-4 md:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <img
            src="/images/logo/primary-logo-1.png"
            alt="EMDEE VENTURES"
            className="
            w-full
            max-w-[180px]
            sm:max-w-[200px]
            md:max-w-[220px]
            lg:max-w-[240px]
            object-contain
          "
          />
        </div>


        <div className="mt-8">
          <h2 className="text-center text-subheading font-bold font-optima text-brand-blue">
            Sign in to your account
          </h2>
        </div>

        <Suspense fallback={<LoadingSpinner text="Loading..." centered={false} className="py-8" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
