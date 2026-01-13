/**
 * Registration Page
 * User registration with email verification
 */

import { Metadata } from 'next';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Register | EMDEE VENTURES',
  description: 'Create a new account - EMDEE VENTURES',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-white px-4 py-12 sm:px-6 lg:px-4 md:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* EMDEE VENTURES Branding */}
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-comments font-optima text-brand-grey">
            Join Investment and Holding Company
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
