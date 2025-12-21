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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'CLIENT')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/client/portfolio"
            className="inline-flex items-center text-blue-100 hover:text-white mb-4 transition-colors"
          >
            <svg
              className="h-5 w-5 mr-2"
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Investment Products</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Explore our premium investment ventures with competitive returns and flexible withdrawal options
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <ProductsBrowse />
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Choose a Product</h3>
              <p className="text-gray-600">
                Select a venture based on your investment amount and goals
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Select Your Plan</h3>
              <p className="text-gray-600">
                Pick your preferred duration and withdrawal frequency
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Submit Request</h3>
              <p className="text-gray-600">
                Your RM will review and process your investment request
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Help Choosing?</h2>
          <p className="text-xl text-indigo-100 mb-8">
            Contact your Relationship Manager for personalized investment advice
          </p>
          <Link
            href="/client/my-rm"
            className="inline-block px-8 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Contact My RM
          </Link>
        </div>
      </div>
    </div>
  );
}
