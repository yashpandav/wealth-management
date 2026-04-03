'use client';

import Link from 'next/link';
import { useInView } from './useInView';

const investments = [
  {
    ghost: 'STARTER',
    label: 'Starter',
    range: 'AED 50,000',
    rangeSuffix: '– 99,999',
    returnRate: 'Up to 40%',
    returnLabel: 'per annum',
    duration: '2 Years',
    payouts: 'Monthly · Quarterly',
    desc: 'Entry-level tier for first-time investors seeking stable, documented returns.',
  },
  {
    ghost: 'GROWTH',
    label: 'Growth',
    range: 'AED 100,000',
    rangeSuffix: '– 499,999',
    returnRate: 'Up to 44%',
    returnLabel: 'per annum',
    duration: '1 – 2 Years',
    payouts: 'Monthly · Quarterly',
    desc: 'Mid-tier with flexible duration and payout schedule options.',
  },
  {
    ghost: 'FLEXIBLE',
    label: 'Flexible',
    range: 'AED 100,000',
    rangeSuffix: '– 499,999',
    returnRate: '24%',
    returnLabel: 'per annum',
    duration: '1 Year',
    payouts: 'Monthly',
    desc: 'Streamlined 1-year plan with monthly payouts for eligible amounts.',
  },
  {
    ghost: 'PREMIUM',
    label: 'Premium',
    range: 'AED 500,000',
    rangeSuffix: 'and above',
    returnRate: 'Up to 60%',
    returnLabel: 'per annum',
    duration: '1 – 2 Years',
    payouts: 'Monthly · Quarterly',
    desc: 'Highest returns with senior RM management and priority account service.',
  },
];

export function TiersSection() {
  const { ref, isVisible } = useInView(0.1);

  const anim = (i: number, axis: 'Y' | 'X' = 'Y') => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate(0,0)' : axis === 'X' ? 'translateX(-18px)' : 'translateY(18px)',
    transition: 'opacity 0.65s ease, transform 0.65s cubic-bezier(0.16,1,0.3,1)',
    transitionDelay: isVisible ? `${i * 110}ms` : '0ms',
  });

  return (
    <section id="investment-plans" ref={ref} className="bg-[#002369] text-[#F6F6F6] px-8 md:px-16 pt-14 pb-14" style={{ scrollMarginTop: '68px' }}>

      {/* Header */}
      <div style={anim(0)}>
        <div className="flex items-center gap-6 mb-8">
          <p className="text-[0.68rem] tracking-[0.3em] text-[#657997] uppercase shrink-0">Investment structure</p>
          <div className="h-px flex-1 bg-[#F6F6F6]/10" />
          <p className="text-[0.68rem] tracking-[0.2em] text-[#F6F6F6]/20 uppercase shrink-0 hidden md:block">AED-denominated</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <h2
            className="font-optima font-semibold leading-[1.1] text-[#F6F6F6]"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}
          >
            Structured tiers.
            <br />
            <span className="text-[#657997]">Defined returns.</span>
          </h2>
          <p className="font-georgia text-[1rem] text-[#F6F6F6]/50 max-w-xs leading-[1.78]">
            All investments are AED-denominated. Returns are periodic and scheduled at the time of purchase.
          </p>
        </div>
      </div>

      {/* Column headers — desktop only */}
      <div
        className="hidden md:grid md:grid-cols-[1fr_1.6fr_1.2fr_1fr_1.4fr] gap-x-8 pb-3 border-b border-[#F6F6F6]/10 mb-1"
        style={anim(0)}
      >
        {['Tier', 'Investment Range', 'Annual Return', 'Duration', 'Payouts'].map((h) => (
          <p key={h} className="text-[0.6rem] tracking-[0.28em] text-[#F6F6F6]/25 uppercase">{h}</p>
        ))}
      </div>

      {/* Investment rows */}
      <div className="divide-y divide-[#F6F6F6]/10">
        {investments.map(({ ghost, label, range, rangeSuffix, returnRate, returnLabel, duration, payouts, desc }, i) => (
          <div key={label} className="relative overflow-hidden group" style={anim(i + 1, 'X')}>

            {/* Ghost watermark */}
            <span
              aria-hidden
              className="absolute top-1/2 -translate-y-1/2 right-0 font-optima font-semibold leading-none text-[#F6F6F6] pointer-events-none select-none"
              style={{ fontSize: 'clamp(3rem, 5.5vw, 6rem)', opacity: 0.04 }}
            >
              {ghost}
            </span>

            {/* Desktop row */}
            <div className="relative z-10 hidden md:grid md:grid-cols-[1fr_1.6fr_1.2fr_1fr_1.4fr] gap-x-8 gap-y-1 py-7 items-center transition-all duration-300 group-hover:pl-3">

              {/* Tier label */}
              <p className="text-[0.68rem] tracking-[0.25em] text-[#657997] uppercase transition-colors duration-300 group-hover:text-[#F6F6F6]/60">
                {label}
              </p>

              {/* Amount range */}
              <div>
                <p className="font-optima text-[1.15rem] text-[#F6F6F6] leading-tight">{range}</p>
                <p className="font-optima text-[0.8rem] text-[#F6F6F6]/45 mt-0.5">{rangeSuffix}</p>
              </div>

              {/* Annual return — highlighted */}
              <div>
                <p className="font-optima text-[1.15rem] text-[#F6F6F6] leading-tight transition-colors duration-300 group-hover:text-[#a8c0d8]">
                  {returnRate}
                </p>
                <p className="font-georgia text-[0.72rem] text-[#657997] mt-0.5 tracking-wide">{returnLabel}</p>
              </div>

              {/* Duration */}
              <p className="font-georgia text-[1rem] text-[#F6F6F6]/60">{duration}</p>

              {/* Payouts + desc */}
              <div>
                <p className="font-georgia text-[1rem] text-[#F6F6F6]/60">{payouts}</p>
                <p className="font-georgia text-[0.78rem] text-[#F6F6F6]/30 mt-1 leading-snug">{desc}</p>
              </div>
            </div>

            {/* Mobile row */}
            <div className="relative z-10 md:hidden py-6 transition-all duration-300 group-hover:pl-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[0.62rem] tracking-[0.25em] text-[#657997] uppercase mb-1.5">{label}</p>
                  <p className="font-optima text-[1.05rem] text-[#F6F6F6] leading-tight">{range}</p>
                  <p className="font-optima text-[0.8rem] text-[#F6F6F6]/45">{rangeSuffix}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-optima text-[1.05rem] text-[#F6F6F6] transition-colors duration-300 group-hover:text-[#a8c0d8]">{returnRate}</p>
                  <p className="font-georgia text-[0.68rem] text-[#657997]">{returnLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F6F6F6]/08">
                <p className="font-georgia text-[0.8rem] text-[#F6F6F6]/50">{duration}</p>
                <span className="w-[3px] h-[3px] rounded-full bg-[#657997]/50 inline-block" />
                <p className="font-georgia text-[0.8rem] text-[#F6F6F6]/50">{payouts}</p>
              </div>
            </div>

            {/* Hover left accent */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#657997] scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-300" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="pt-8 border-t border-[#F6F6F6]/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={anim(6)}
      >
        <p className="font-georgia text-[0.75rem] text-[#F6F6F6]/30 max-w-xl leading-relaxed">
          Investment plans are subject to KYC verification. All returns depend on the selected plan
          and investment period. Past performance does not guarantee future results.
        </p>
        <Link
          href="/register"
          className="btn-outline-dark text-[0.68rem] tracking-widest uppercase px-6 py-3 whitespace-nowrap shrink-0"
        >
          View Plans
        </Link>
      </div>
    </section>
  );
}
