/**
 * Public Instruments Browse Page
 * Public-facing page for browsing investment instruments
 */

import { Metadata } from 'next';
import { ProductsBrowse } from '@/components/client/ProductsBrowse';

export const metadata: Metadata = {
  title: 'Browse Investment Plans | EMDEE VENTURES',
  description:
    'Explore our diverse range of investment plans including stocks, bonds, mutual funds, ETFs, commodities, and real estate opportunities.',
  keywords: [
    'investment plans',
    'stocks',
    'bonds',
    'mutual funds',
    'ETFs',
    'wealth management',
  ],
};

export default function InstrumentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <a
            href="/"
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
            Back to Home
          </a>
          <h1 className="text-3xl md:text-4xl md:text-4xl md:text-5xl font-bold mb-4">Investment Plans</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Discover a wide range of investment opportunities tailored to your financial goals and
            risk tolerance
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <ProductsBrowse />
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl md:text-3xl md:text-4xl font-bold mb-4">Ready to Start Investing?</h2>
          <p className="text-xl text-indigo-100 mb-8">
            Create an account to access these investment opportunities and connect with a dedicated
            relationship manager
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="px-4 md:px-6 lg:px-8 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Create Account
            </a>
            <a
              href="/login"
              className="px-4 md:px-6 lg:px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
