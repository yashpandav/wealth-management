'use client';

import { useInView } from './useInView';

const steps = [
  {
    n: '01',
    title: 'Register',
    desc: 'Create your account online. Email verification is required before accessing the platform.',
  },
  {
    n: '02',
    title: 'Submit KYC',
    desc: 'Upload identity and financial documents. Our Document team reviews every submission.',
  },
  {
    n: '03',
    title: 'RM Assigned',
    desc: 'Once verified, a dedicated Relationship Manager is assigned as your primary contact.',
  },
  {
    n: '04',
    title: 'Invest',
    desc: 'Browse approved plans, choose a tier, and submit a purchase request. Your RM confirms it.',
  },
  {
    n: '05',
    title: 'Receive Payouts',
    desc: 'Earn scheduled periodic returns — every payout is recorded, receipted, and fully traceable.',
  },
];

export function HowItWorksSection() {
  const { ref, isVisible } = useInView(0.12);

  const anim = (i: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
    transitionDelay: isVisible ? `${i * 100}ms` : '0ms',
  });

  return (
    <section ref={ref} className="bg-[#002369] text-[#F6F6F6] px-8 md:px-16 pt-14 pb-14">

      {/* Section header */}
      <div className="flex items-center gap-6 mb-10" style={anim(0)}>
        <p className="text-[0.68rem] tracking-[0.3em] text-[#657997] uppercase shrink-0">How it works</p>
        <div className="h-px flex-1 bg-[#F6F6F6]/10" />
        <p className="text-[0.68rem] tracking-[0.2em] text-[#F6F6F6]/20 uppercase shrink-0 hidden md:block">
          5 steps to investing
        </p>
      </div>

      {/* Desktop: 5 columns */}
      <div className="hidden md:grid md:grid-cols-5 divide-x divide-[#F6F6F6]/10">
        {steps.map(({ n, title, desc }, i) => (
          <div
            key={n}
            className="relative overflow-hidden px-8 first:pl-0 last:pr-0 pt-1 pb-2"
            style={anim(i + 1)}
          >
            <span
              aria-hidden
              className="absolute -top-3 right-0 font-optima font-semibold leading-none text-[#F6F6F6] pointer-events-none select-none"
              style={{ fontSize: 'clamp(5rem, 7vw, 7.5rem)', opacity: 0.07 }}
            >
              {n}
            </span>
            <div className="relative z-10 pt-2">
              <h3 className="text-[1.1rem] font-optima font-semibold mb-3 leading-snug text-[#F6F6F6]">
                {title}
              </h3>
              <p className="text-[1rem] text-[#F6F6F6]/55 leading-[1.78] font-georgia">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden divide-y divide-[#F6F6F6]/10">
        {steps.map(({ n, title, desc }, i) => (
          <div
            key={n}
            className="relative overflow-hidden py-7 first:pt-0"
            style={anim(i + 1)}
          >
            <span
              aria-hidden
              className="absolute -top-2 right-0 font-optima font-semibold leading-none text-[#F6F6F6] pointer-events-none select-none"
              style={{ fontSize: '5.5rem', opacity: 0.07 }}
            >
              {n}
            </span>
            <div className="relative z-10">
              <h3 className="text-[1.1rem] font-optima font-semibold mb-2 text-[#F6F6F6]">{title}</h3>
              <p className="text-[1rem] text-[#F6F6F6]/55 leading-[1.78] font-georgia">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
