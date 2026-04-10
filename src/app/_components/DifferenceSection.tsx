'use client';

import { useInView } from './useInView';

const points = [
  {
    heading: 'Documented from day one.',
    body: 'Every payout is recorded and receipted before it is released. Your transaction history is permanent and fully auditable.',
  },
  {
    heading: 'No document, no investment.',
    body: 'No investment moves forward without full KYC verification. Every investor is reviewed before access is granted.',
  },
  {
    heading: 'One contact. Full accountability.',
    body: 'Your assigned Relationship Manager is your single point of contact — accountable for every action on your account.',
  },
  {
    heading: 'Independent oversight.',
    body: 'Strict separation of duties protects your portfolio. Transactions and contracts are verified and executed by administrators, independent of your Relationship Manager.',
  },
];

export function DifferenceSection() {
  const { ref, isVisible } = useInView(0.08);

  const anim = (i: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(22px)',
    transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
    transitionDelay: isVisible ? `${i * 100}ms` : '0ms',
  });

  return (
    <section ref={ref} className="bg-[#F6F6F6] border-b border-[#002369]/12">

      {/* Header — padded */}
      <div className="px-8 md:px-16 pt-14">
        <div className="flex items-center gap-6 mb-10" style={anim(0)}>
          <p className="text-[0.68rem] tracking-[0.3em] text-[#657997] uppercase shrink-0">Why EMDEE Ventures</p>
          <div className="h-px flex-1 bg-[#002369]/12" />
        </div>
      </div>

      {/* Body: left headline + right 2×2 grid */}
      <div className="flex flex-col md:flex-row">

        {/* Left: headline */}
        <div
          className="flex-[1.05] shrink-0 px-8 md:pl-16 md:pr-14 pb-14 flex flex-col justify-center"
          style={anim(1)}
        >
          <h2
            className="font-optima font-semibold leading-[1.1] text-[#002369]"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}
          >
            No hidden steps.
            <br />
            No manual confusion.
            <br />
            <span className="text-[#657997]">Just a clear process.</span>
          </h2>
          <p className="font-georgia text-[1rem] text-[#002369]/55 leading-[1.78] mt-6 max-w-[260px]">
            Every control exists for a reason. Every step is visible to those it affects.
          </p>
        </div>

        {/* Right: 2×2 grid — the border intersections form a natural + cross */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:border-l border-[#002369]/12">
          {points.map(({ heading, body }, i) => {
            const isLeft = i % 2 === 0;
            const isTop = i < 2;
            return (
              <div
                key={heading}
                className={[
                  'group px-8 md:px-10 py-10 cursor-default',
                  'transition-colors duration-300 hover:bg-[#002369]/[0.025]',
                  isLeft ? 'sm:border-r border-[#002369]/12' : '',
                  isTop ? 'border-b border-[#002369]/12' : '',
                ].join(' ')}
                style={anim(i + 2)}
              >
                <h4
                  className="font-optima font-semibold text-[#002369] text-[1.1rem] leading-snug mb-3 transition-transform duration-300 group-hover:translate-x-1"
                >
                  {heading}
                </h4>
                <p className="font-georgia text-[1rem] text-[#002369]/55 leading-[1.78] transition-colors duration-300 group-hover:text-[#002369]/70">
                  {body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
