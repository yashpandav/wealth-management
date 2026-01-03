/**
 * Client - Products Browse Page
 * Display investment products (Venture A, B, C) for clients to browse
 * Styled to match the Instruments page
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ProductsBrowse } from '@/components/client/ProductsBrowse';

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
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <span className="font-georgia text-brand-grey">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'CLIENT')) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-brand-blue text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
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
          <h1 className="font-optima text-heading font-bold mb-3 leading-tight">Investment Products</h1>
          <p className="font-georgia text-body text-white/90 max-w-3xl leading-relaxed">
            Explore our curated investment ventures designed to deliver sustainable returns with flexible withdrawal options
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <ProductsBrowse />
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-12 px-4 border-t border-brand-grey/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-optima text-subheading font-bold text-center text-brand-blue mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center mx-auto mb-4 border-2 border-brand-blue/20">
                <span className="font-optima text-2xl font-bold">1</span>
              </div>
              <h3 className="font-optima font-semibold text-lg mb-2 text-brand-blue">Choose a Product</h3>
              <p className="font-georgia text-brand-grey leading-relaxed text-sm">
                Select a venture aligned with your investment goals and financial capacity
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center mx-auto mb-4 border-2 border-brand-blue/20">
                <span className="font-optima text-2xl font-bold">2</span>
              </div>
              <h3 className="font-optima font-semibold text-lg mb-2 text-brand-blue">Select Your Plan</h3>
              <p className="font-georgia text-brand-grey leading-relaxed text-sm">
                Choose your preferred investment duration and withdrawal frequency
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center mx-auto mb-4 border-2 border-brand-blue/20">
                <span className="font-optima text-2xl font-bold">3</span>
              </div>
              <h3 className="font-optima font-semibold text-lg mb-2 text-brand-blue">Submit Request</h3>
              <p className="font-georgia text-brand-grey leading-relaxed text-sm">
                Your dedicated Relationship Manager will review and process your request
              </p>
            </div>
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
