'use client';

import Link from 'next/link';
import { useInView } from './useInView';

export function CTASection() {
  const { ref, isVisible } = useInView(0.15);

  const anim = (i: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
    transitionDelay: isVisible ? `${i * 120}ms` : '0ms',
  });

  return (
    <section
      ref={ref}
      className="bg-white px-8 md:px-16 pt-14 pb-14 border-t-2 border-[#002369]/10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">

        {/* Left: headline + subtext */}
        <div className="flex-[1.4]">
          <p className="text-[0.68rem] tracking-[0.3em] text-[#657997] uppercase mb-5" style={anim(0)}>
            Start your journey
          </p>
          <h2
            className="font-optima font-semibold leading-[1.08] text-[#002369]"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', ...anim(1) }}
          >
            Ready to invest
            <br />
            <span className="text-[#657997]">with full clarity?</span>
          </h2>
          <p
            className="font-georgia text-[1rem] text-[#657997] mt-5 max-w-md leading-[1.78]"
            style={anim(2)}
          >
            Create your account, complete KYC verification, and start investing —
            every step documented, every payout receipted.
          </p>
        </div>

        {/* Right: CTAs */}
        <div className="flex flex-col gap-3 md:items-end shrink-0" style={anim(3)}>
          <Link
            href="/register"
            className="btn-primary text-[0.68rem] tracking-widest uppercase px-10 py-4 text-center"
          >
            Open an Account
          </Link>
          <Link
            href="/login"
            className="btn-outline-light text-[0.68rem] tracking-widest uppercase px-10 py-4 text-center"
          >
            Sign In
          </Link>
          <p className="font-georgia text-[0.72rem] text-[#657997]/60 text-right mt-1">
            No fees to register. KYC required before investing.
          </p>
        </div>
      </div>
    </section>
  );
}
