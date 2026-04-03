/**
 * Login Page
 * Split layout: brand panel (left) + form (right)
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import Image from 'next/image';
import { LoginForm } from './login-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Login | EMDEE VENTURES',
  description: 'Sign in to your account - EMDEE VENTURES',
};

const trustStats = [
  { value: 'AED 50K+', label: 'Min. Investment' },
  { value: 'Up to 60%', label: 'Annual Return' },
  { value: 'KYC Verified', label: 'Secure Platform' },
  { value: 'Dedicated RM', label: 'Personal Advisor' },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">

      {/* ── Left: Brand Panel ── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] bg-[#002369] flex-col justify-between px-12 py-12 shrink-0">

        {/* Logo */}
        <div>
          <Image
            src="/images/logo/primary-logo-1.png"
            alt="EMDEE VENTURES"
            width={110}
            height={74}
            className="object-contain brightness-0 invert opacity-70"
          />
        </div>

        {/* Headline */}
        <div>
          <p className="text-[0.62rem] tracking-[0.3em] text-[#657997] uppercase mb-5 font-optima">
            Wealth Management
          </p>
          <h2
            className="font-optima text-[#F6F6F6] leading-[1.15]"
            style={{ fontSize: 'clamp(1.6rem, 2.4vw, 2.4rem)' }}
          >
            Your capital.<br />
            <span className="text-[#657997]">Managed with precision.</span>
          </h2>
          <p className="mt-5 font-georgia text-[0.9rem] text-[#F6F6F6]/45 leading-[1.8] max-w-xs">
            A fully-managed investment platform with dedicated relationship managers and transparent, scheduled returns.
          </p>
        </div>

        {/* Trust stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-8 border-t border-[#F6F6F6]/10">
          {trustStats.map(({ value, label }) => (
            <div key={label}>
              <p className="font-optima text-[1.05rem] text-[#F6F6F6]">{value}</p>
              <p className="font-georgia text-[0.7rem] text-[#657997] mt-0.5">{label}</p>
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

          {/* Form heading */}
          <div className="mb-8">
            <h2 className="font-optima font-bold text-[1.85rem] text-brand-blue leading-tight">
              Welcome back
            </h2>
            <p className="mt-1.5 font-georgia text-[0.9rem] text-brand-grey">
              Sign in to access your account
            </p>
          </div>

          <Suspense fallback={<LoadingSpinner text="Loading..." centered={false} className="py-8" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

    </div>
  );
}
