'use client';

import { useInView } from './useInView';

const pillars = [
  {
    n: '01',
    title: 'Full Audit Trail',
    desc: 'Every approval, rejection, assignment, and status change is logged with timestamps. Nothing goes unrecorded.',
  },
  {
    n: '02',
    title: 'Document Verification',
    desc: 'Your KYC documents are reviewed by a dedicated administrator before any investment activity is permitted.',
  },
  {
    n: '03',
    title: 'Two-Tier Withdrawals',
    desc: 'Withdrawals require RM review first, then Admin approval. No single authority can release your funds.',
  },
  {
    n: '04',
    title: 'Receipt-Based Payouts',
    desc: 'Every payout is recorded with a receipt before release. Your full payout history is always accessible.',
  },
];

function fade(isVisible: boolean, i: number) {
  return {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(26px)',
    transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
    transitionDelay: isVisible ? `${i * 120}ms` : '0ms',
  };
}

export function TrustSection() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section
      ref={ref}
      className="bg-[#F6F6F6] px-8 md:px-16 pt-14 pb-16 border-b border-[#002369]/12"
    >
      {/* Header */}
      <div
        className="flex items-center gap-6 mb-12"
        style={fade(isVisible, 0)}
      >
        <p className="text-xs tracking-[0.3em] text-[#657997] uppercase shrink-0">Controls you can rely on</p>
        <div className="h-px flex-1 bg-[#002369]/12" />
        <p className="text-xs tracking-[0.2em] text-[#002369]/20 uppercase shrink-0 hidden md:block">Built-in safeguards</p>
      </div>

      {/* Desktop: 4 columns — mirrors How It Works layout */}
      <div className="hidden md:grid md:grid-cols-4 divide-x divide-[#002369]/10">
        {pillars.map(({ n, title, desc }, i) => (
          <div
            key={n}
            className="relative overflow-hidden px-8 first:pl-0 last:pr-0 pb-2 pt-1"
            style={fade(isVisible, i + 1)}
          >
            {/* Ghost number — top-right, overlaps title */}
            <span
              aria-hidden
              className="absolute -top-3 right-0 font-optima font-semibold leading-none text-[#002369] pointer-events-none select-none"
              style={{ fontSize: 'clamp(5rem, 7vw, 8rem)', opacity: 0.055 }}
            >
              {n}
            </span>

            <div className="relative z-10 pt-2">
              {/* Top accent line */}
              <div className="w-8 h-[2px] bg-[#002369] mb-5" />

              <h4
                className="font-optima font-semibold text-[#002369] mb-3 leading-snug"
                style={{ fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)' }}
              >
                {title}
              </h4>
              <p className="text-[0.875rem] text-[#657997] leading-[1.75] font-georgia">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden divide-y divide-[#002369]/10">
        {pillars.map(({ n, title, desc }, i) => (
          <div
            key={n}
            className="relative overflow-hidden py-7 first:pt-0"
            style={fade(isVisible, i + 1)}
          >
            <span
              aria-hidden
              className="absolute -top-2 right-0 font-optima font-semibold leading-none text-[#002369] pointer-events-none select-none"
              style={{ fontSize: '5.5rem', opacity: 0.05 }}
            >
              {n}
            </span>
            <div className="relative z-10">
              <div className="w-6 h-[2px] bg-[#002369] mb-4" />
              <h4 className="text-[1.1rem] font-optima font-semibold text-[#002369] mb-2">{title}</h4>
              <p className="text-[0.875rem] text-[#657997] leading-relaxed font-georgia">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
