'use client';

import Link from 'next/link';
import { useInView } from './useInView';

const roles = [
  {
    ghost: 'INVESTOR',
    label: 'Investor',
    headline: 'Your portfolio.\nYour history.',
    cta: { label: 'Open an Account', href: '/register' as const },
    items: [
      'Browse verified investment plans and products',
      'Submit purchase and withdrawal requests',
      'Track portfolio holdings and transaction history',
      'View your assigned Relationship Manager',
      'Receive payout notifications and receipts',
    ],
  },
  {
    ghost: 'RM',
    label: 'Relationship Manager',
    headline: 'Manage clients.\nProcess transactions.',
    cta: null,
    items: [
      'Review and approve purchase requests',
      'Verify bank statements before processing',
      'Forward withdrawals for admin approval',
      'Upload client documents and receipts',
      'Monitor assigned client portfolios',
    ],
  },
  {
    ghost: 'DOCADMIN',
    label: 'Document Administrator',
    headline: 'Verify documents.\nEnable investing.',
    cta: null,
    items: [
      'Review all submitted KYC documents',
      'Approve or reject with documented reasons',
      'Assign Relationship Managers post-verification',
      'Track verification status across clients',
    ],
  },
];

export function RolesSection() {
  const { ref, isVisible } = useInView(0.1);

  const anim = (i: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
    transitionDelay: isVisible ? `${i * 110}ms` : '0ms',
  });

  return (
    <section ref={ref} className="bg-[#F6F6F6] px-8 md:px-16 pt-14 pb-14 border-b border-[#002369]/12">

      {/* Header */}
      <div className="flex items-center gap-6 mb-10" style={anim(0)}>
        <p className="text-[0.68rem] tracking-[0.3em] text-[#657997] uppercase shrink-0">Built for every stakeholder</p>
        <div className="h-px flex-1 bg-[#002369]/12" />
        <p className="text-[0.68rem] tracking-[0.2em] text-[#002369]/20 uppercase shrink-0 hidden md:block">3 roles</p>
      </div>

      {/* Desktop: 3 columns */}
      <div className="hidden md:grid md:grid-cols-3 divide-x divide-[#002369]/12">
        {roles.map(({ ghost, label, headline, cta, items }, i) => (
          <div
            key={label}
            className="relative overflow-hidden px-10 first:pl-0 last:pr-0"
            style={anim(i + 1)}
          >
            {/* Ghost word */}
            <span
              aria-hidden
              className="absolute -top-2 right-0 font-optima font-semibold leading-none text-[#002369] pointer-events-none select-none"
              style={{
                fontSize: ghost === 'RM' ? 'clamp(7rem, 11vw, 12rem)' : 'clamp(3.5rem, 5.5vw, 6.5rem)',
                opacity: 0.05,
              }}
            >
              {ghost}
            </span>

            <div className="relative z-10">
              <p className="text-[0.68rem] tracking-[0.25em] text-[#657997] uppercase mb-4">{label}</p>
              <h3
                className="font-optima font-semibold leading-[1.15] text-[#002369] mb-6 border-t-2 border-[#002369] pt-5"
                style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)' }}
              >
                {headline.split('\n').map((line, j) => (
                  <span key={j} className="block">{line}</span>
                ))}
              </h3>
              <ul className="space-y-3 mb-8">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-georgia text-[1rem] text-[#002369]/60 leading-[1.78]">
                    <span className="mt-[0.38rem] shrink-0 w-[5px] h-[5px] bg-[#657997] rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
              {cta && (
                <Link
                  href={cta.href}
                  className="inline-block btn-primary text-[0.68rem] tracking-widest uppercase px-6 py-3"
                >
                  {cta.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden divide-y divide-[#002369]/12">
        {roles.map(({ ghost, label, headline, cta, items }, i) => (
          <div key={label} className="relative overflow-hidden py-8 first:pt-0" style={anim(i + 1)}>
            <span
              aria-hidden
              className="absolute -top-1 right-0 font-optima font-semibold leading-none text-[#002369] pointer-events-none select-none"
              style={{ fontSize: ghost === 'RM' ? '8rem' : '4.5rem', opacity: 0.05 }}
            >
              {ghost}
            </span>
            <div className="relative z-10">
              <p className="text-[0.68rem] tracking-[0.25em] text-[#657997] uppercase mb-4">{label}</p>
              <h3 className="text-[1.1rem] font-optima font-semibold leading-snug text-[#002369] mb-5 border-t-2 border-[#002369] pt-4">
                {headline.split('\n').map((line, j) => (
                  <span key={j} className="block">{line}</span>
                ))}
              </h3>
              <ul className="space-y-2.5 mb-6">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-georgia text-[1rem] text-[#002369]/60 leading-[1.78]">
                    <span className="mt-[0.38rem] shrink-0 w-[5px] h-[5px] bg-[#657997] rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
              {cta && (
                <Link
                  href={cta.href}
                  className="inline-block text-[0.68rem] tracking-widest uppercase bg-[#002369] text-[#F6F6F6] px-5 py-2.5 hover:bg-[#657997] transition-colors"
                >
                  {cta.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
