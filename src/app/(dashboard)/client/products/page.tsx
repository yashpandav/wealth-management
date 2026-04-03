/**
 * Client - Products Browse Page
 * Display investment plans (Venture A, B, C) for clients to browse
 * Styled to match the Instruments page
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductsBrowse } from '@/components/client/ProductsBrowse';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ClientProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <LoadingSpinner text="Loading..." className="min-h-screen" />;
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'CLIENT')) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-brand-blue text-white py-12 px-4">
        <div className="max-w-full sm:max-w-7xl mx-auto">
          <Link
            href="/client/portfolio"
            className="inline-flex items-center text-brand-grey hover:text-white mb-4 transition-colors font-georgia text-comments"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="font-optima text-heading font-bold mb-3 leading-tight">Investment Plans</h1>
          <p className="font-georgia text-body text-white/90 max-w-3xl leading-relaxed">
            Explore our curated investment plans designed to deliver sustainable returns with flexible withdrawal options
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full sm:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
        <ProductsBrowse />
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-12 px-4 border-t border-brand-grey/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-optima text-subheading font-bold text-center text-brand-blue mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                step: '1',
                title: 'Browse Ventures',
                desc: 'Explore Venture A, B, and C — each designed with a different risk profile and return structure.',
              },
              {
                step: '2',
                title: 'Configure Your Option',
                desc: 'Pick your preferred duration and withdrawal frequency from the available plan options.',
              },
              {
                step: '3',
                title: 'Submit & Get Processed',
                desc: 'Your dedicated Relationship Manager reviews and processes your request with care.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center mx-auto mb-4 border border-brand-blue/20">
                  <span className="font-optima text-xl font-bold font-nums">{step}</span>
                </div>
                <h3 className="font-optima font-semibold text-base mb-2 text-brand-blue">{title}</h3>
                <p className="font-georgia text-brand-grey leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-brand-blue text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-optima text-subheading md:text-heading font-bold mb-4 leading-tight">Need Guidance?</h2>
          <p className="font-georgia text-body text-white/90 mb-8 leading-relaxed">
            Connect with your Relationship Manager for personalized investment advice
          </p>
          <Link
            href="/client/my-rm"
            className="inline-block px-10 py-4 bg-white text-brand-blue font-optima font-semibold rounded-lg hover:bg-brand-white transition-all shadow-lg hover:shadow-xl"
          >
            Contact My RM
          </Link>
        </div>
      </div>
    </div>
  );
}
