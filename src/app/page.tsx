/**
 * EMDEE Ventures — Public Homepage
 */

import Link from 'next/link';
import Image from 'next/image';
import { HowItWorksSection } from './_components/HowItWorksSection';
import { RolesSection } from './_components/RolesSection';
import { TiersSection } from './_components/TiersSection';
import { DifferenceSection } from './_components/DifferenceSection';
import { CTASection } from './_components/CTASection';

const marqueeItems = [
  'KYC Verified',
  'Full Audit Trail',
  'Two-Tier Approvals',
  'Periodic Payouts',
  'Dedicated RM',
  'Receipt-Based Records',
  'Document Verification',
  'Transparent Process',
  'AED-Denominated',
  'Structured Investments',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F6F6F6] text-[#002369] font-optima">

      {/* ─── Navigation ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#002369]/15 px-8 md:px-16 py-3 flex items-center justify-between shadow-[0_1px_0_0_rgba(0,35,105,0.08)]">
        <Link href="/" className="block shrink-0">
          <Image
            src="/images/logo/primary-logo-1.png"
            alt="EMDEE Ventures — For a Better Tomorrow"
            width={90}
            height={60}
            className="object-contain"
            priority
          />
        </Link>
        <div className="flex items-center gap-5 md:gap-7">
          <Link
            href="#investment-plans"
            className="nav-link text-[0.72rem] tracking-widest text-[#657997] hover:text-[#002369] transition-colors uppercase hidden lg:block"
          >
            Investment Plans
          </Link>
          <Link
            href="/login"
            className="nav-link text-[0.72rem] tracking-widest text-[#002369] hover:text-[#657997] transition-colors uppercase"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn-primary text-[0.72rem] tracking-widest uppercase px-5 py-2.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative px-8 md:px-16 border-b border-[#002369]/12 overflow-hidden min-h-[calc(100vh-68px)] flex flex-col justify-center py-20">

        {/* Subtle ghost watermark — background depth only */}
        <div
          aria-hidden
          className="absolute right-[-3%] top-[-5%] select-none pointer-events-none font-optima font-semibold leading-none text-[#002369]"
          style={{ fontSize: 'clamp(12rem, 22vw, 22rem)', opacity: 0.025, letterSpacing: '-0.04em' }}
        >
          EMDEE
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-10 md:gap-0">

          {/* Left: Headline */}
          <div className="flex-[1.6]">
            <p className="hero-tag text-[0.68rem] tracking-[0.35em] text-[#657997] uppercase mb-7">
              Wealth Management Platform · UAE
            </p>
            <h1
              className="font-optima font-semibold leading-[1.07] text-[#002369]"
              style={{ fontSize: 'clamp(2.6rem, 5.5vw, 5rem)' }}
            >
              <span className="block hero-l1">Structure your</span>
              <span className="block hero-l2">investments.</span>
              <span className="block hero-l3 text-[#657997]">With full clarity.</span>
            </h1>
            <p className="hero-sub mt-7 text-[1rem] text-[#657997] leading-[1.78] max-w-md font-georgia">
              A managed platform for verified investors. Every step — from
              KYC submission to periodic payouts — is documented, reviewed, and traceable.
            </p>
            <div className="hero-cta mt-9 flex items-center gap-5 flex-wrap">
              <Link
                href="/register"
                className="btn-primary text-[0.72rem] tracking-widest uppercase px-8 py-3.5"
              >
                Open an Account
              </Link>
              <Link
                href="/login"
                className="nav-link text-[0.72rem] tracking-widest uppercase text-[#002369] hover:text-[#657997] transition-colors"
              >
                Sign In →
              </Link>
            </div>
          </div>

          {/* Right: Stats column */}
          <div className="flex-1 md:pl-14 md:border-l border-[#002369]/12 divide-y divide-[#002369]/10">
            {[
              { value: 'AED 50,000', label: 'Minimum investment' },
              { value: 'Up to 60%', label: 'Returns over investment period' },
              { value: 'KYC verified', label: 'Before any investment is processed' },
              { value: 'Assigned RM', label: 'Personal relationship manager' },
            ].map(({ value, label }) => (
              <div key={label} className="stat-item py-5 first:pt-0">
                <p className="text-[1.5rem] md:text-[1.75rem] font-optima font-semibold text-[#002369] leading-tight">{value}</p>
                <p className="text-[0.68rem] tracking-[0.2em] text-[#657997] uppercase mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Marquee Strip ───────────────────────────────────────────────── */}
      <div className="bg-[#002369] py-3.5 overflow-hidden">
        <div className="marquee-track whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="inline-flex items-center">
              <span className="text-[0.62rem] tracking-[0.3em] text-[#F6F6F6]/45 uppercase px-6">{item}</span>
              <span className="w-[3px] h-[3px] rounded-full bg-[#657997]/50 inline-block" />
            </span>
          ))}
        </div>
      </div>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ─── Who It's For ────────────────────────────────────────────────── */}
      <RolesSection />

      {/* ─── Investment Tiers ────────────────────────────────────────────── */}
      <TiersSection />

      {/* ─── Why EMDEE ───────────────────────────────────────────────────── */}
      <DifferenceSection />

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <CTASection />

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#002369] text-[#F6F6F6] px-8 md:px-16 pt-12 pb-8">
        <div className="flex flex-col md:flex-row justify-between gap-10 pb-10 border-b border-[#F6F6F6]/10">

          {/* Brand */}
          <div className="shrink-0">
            <Image
              src="/images/logo/primary-logo-1.png"
              alt="EMDEE Ventures"
              width={88}
              height={59}
              className="object-contain opacity-90"
            />
            <p className="font-georgia text-[0.75rem] text-[#F6F6F6]/35 mt-4 max-w-[210px] leading-[1.7]">
              Enterprise wealth management for verified investors. UAE-based. AED-denominated.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
            <div>
              <p className="text-[0.62rem] tracking-[0.28em] text-[#657997] uppercase mb-4">Account</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Open an Account', href: '/register' as const },
                  { label: 'Sign In', href: '/login' as const },
                  { label: 'Enquire', href: '/user-form' as const },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="nav-link text-[0.72rem] tracking-widest uppercase text-[#F6F6F6]/40 hover:text-[#F6F6F6]/80 transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[0.62rem] tracking-[0.28em] text-[#657997] uppercase mb-4">Platform</p>
              <div className="flex flex-col gap-3 text-[0.72rem] tracking-widest uppercase text-[#F6F6F6]/25">
                <span>Investment Plans</span>
                <span>KYC Process</span>
                <span>Security</span>
                <span>Audit Trail</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5 flex flex-col md:flex-row justify-between gap-2">
          <p className="font-georgia text-[0.7rem] text-[#F6F6F6]/25">
            © {new Date().getFullYear()} EMDEE Ventures. All rights reserved.
          </p>
          <p className="font-georgia text-[0.7rem] text-[#F6F6F6]/25">
            Regulated financial services. Subject to applicable UAE laws.
          </p>
        </div>
      </footer>

    </div>
  );
}
