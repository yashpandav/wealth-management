/**
 * Registration Page
 * Split layout: brand panel (left) + form (right)
 */

import { Metadata } from 'next';
import Image from 'next/image';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Register | EMDEE VENTURES',
  description: 'Create a new account - EMDEE VENTURES',
};

const steps = [
  { n: '01', label: 'Create account', desc: 'Register with your email and details.' },
  { n: '02', label: 'Verify & upload KYC', desc: 'Submit identity documents for review.' },
  { n: '03', label: 'Meet your RM', desc: 'A dedicated manager is assigned to you.' },
  { n: '04', label: 'Start investing', desc: 'Choose a plan and track your returns.' },
];

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">

      {/* ── Left: Brand Panel ── */}
      <div className="hidden lg:flex lg:w-[40%] xl:w-[38%] bg-[#002369] flex-col justify-between px-12 py-12 shrink-0">

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
            Get Started
          </p>
          <h2
            className="font-optima text-[#F6F6F6] leading-[1.15]"
            style={{ fontSize: 'clamp(1.6rem, 2.4vw, 2.4rem)' }}
          >
            Join EMDEE<br />
            <span className="text-[#657997]">Ventures today.</span>
          </h2>
          <p className="mt-5 font-georgia text-[0.9rem] text-[#F6F6F6]/45 leading-[1.8] max-w-xs">
            Start your wealth management journey. Your account is reviewed and activated within 24 hours.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-5 pt-8 border-t border-[#F6F6F6]/10">
          {steps.map(({ n, label, desc }) => (
            <div key={n} className="flex items-start gap-4">
              <span className="font-optima text-[0.65rem] text-[#657997] mt-0.5 shrink-0 w-5">{n}</span>
              <div>
                <p className="font-optima text-[0.82rem] text-[#F6F6F6] font-semibold leading-tight">{label}</p>
                <p className="font-georgia text-[0.72rem] text-[#F6F6F6]/40 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="flex flex-1 items-start justify-center bg-white px-6 py-10 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-[440px] py-4">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image
              src="/images/logo/primary-logo-1.png"
              alt="EMDEE VENTURES"
              width={150}
              height={100}
              className="object-contain"
            />
          </div>

          {/* Form heading */}
          <div className="mb-6">
            <h2 className="font-optima font-bold text-[1.85rem] text-brand-blue leading-tight">
              Create your account
            </h2>
            <p className="mt-1.5 font-georgia text-[0.9rem] text-brand-grey">
              Join EMDEE Ventures — Investment &amp; Holding Company
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>

    </div>
  );
}
