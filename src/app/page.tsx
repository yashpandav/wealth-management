/**
 * Home Page / Landing Page
 * Public-facing landing page for prospective clients to explore investment opportunities
 */

import { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  BarChart3,
  CheckCircle,
  Smartphone,
  HeadphonesIcon,
  ArrowRight,
  Star,
  Clock,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Elite Wealth Management | Grow Your Portfolio with Expert Guidance',
  description:
    'Discover premium investment opportunities with personalized portfolio management. Access stocks, bonds, ETFs, and alternative investments with dedicated relationship manager support.',
  keywords: [
    'wealth management',
    'investment portfolio',
    'financial advisor',
    'portfolio management',
    'investment opportunities',
    'stocks and bonds',
    'ETF investing',
  ],
  openGraph: {
    title: 'Elite Wealth Management | Premium Investment Platform',
    description:
      'Grow your wealth with expert guidance and access to premium investment opportunities',
    type: 'website',
    url: 'https://wealthcrm.com',
    images: [
      {
        url: 'https://wealthcrm.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Elite Wealth Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elite Wealth Management | Premium Investment Platform',
    description: 'Grow your wealth with expert guidance and premium investment opportunities',
    images: ['https://wealthcrm.com/og-image.png'],
  },
};

export default function Home() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Elite Wealth Management',
    description:
      'Premium investment platform offering personalized portfolio management and access to exclusive investment opportunities',
    url: 'https://wealthcrm.com',
    logo: 'https://wealthcrm.com/logo.png',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1250',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-4 py-24 md:py-32">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="relative max-w-7xl mx-auto">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium">
                <Award className="h-4 w-4 text-yellow-400" />
                <span>Trusted by 10,000+ Investors</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Grow Your Wealth with
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Expert Guidance
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto">
                Access premium investment opportunities with personalized portfolio management and dedicated relationship manager support
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-2xl text-lg px-10 py-7">
                    Start Investing Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-2 border-white bg-white text-gray-900 hover:bg-white/90 hover:text-gray-900 text-lg px-10 py-7">
                    Client Login
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-5xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white">$2.5B+</div>
                  <div className="text-sm text-slate-300 mt-2">Assets Under Management</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white">10,000+</div>
                  <div className="text-sm text-slate-300 mt-2">Happy Investors</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white">15.2%</div>
                  <div className="text-sm text-slate-300 mt-2">Avg. Annual Returns</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white">24/7</div>
                  <div className="text-sm text-slate-300 mt-2">Portfolio Access</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Opportunities */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Diverse Investment Opportunities
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Build a balanced portfolio with access to premium stocks, bonds, ETFs, mutual funds, and alternative investments
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-2xl group">
                <CardContent className="p-8">
                  <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Stocks</h3>
                  <p className="text-gray-600 mb-5">
                    Invest in leading companies across technology, healthcare, finance, and more with real-time market access
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Blue-chip companies
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Growth stocks
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Dividend aristocrats
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-emerald-500 transition-all hover:shadow-2xl group">
                <CardContent className="p-8">
                  <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Bonds</h3>
                  <p className="text-gray-600 mb-5">
                    Secure your portfolio with government and corporate bonds offering stable, predictable returns
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Government bonds
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Corporate bonds
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Municipal bonds
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-500 transition-all hover:shadow-2xl group">
                <CardContent className="p-8">
                  <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">ETFs & Funds</h3>
                  <p className="text-gray-600 mb-5">
                    Diversify instantly with exchange-traded funds and professionally managed mutual funds
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Index ETFs
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Sector funds
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      International exposure
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Link href="/instruments">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Explore All Investment Options
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Why Investors Choose Us
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience world-class wealth management with dedicated support and cutting-edge technology
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <HeadphonesIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Dedicated Relationship Manager</h3>
                <p className="text-gray-600">
                  Get personalized guidance from your dedicated relationship manager who understands your financial goals
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Portfolio Tracking</h3>
                <p className="text-gray-600">
                  Monitor your investments 24/7 with interactive charts, performance analytics, and detailed insights
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Bank-Level Security</h3>
                <p className="text-gray-600">
                  Your investments and personal data are protected with military-grade encryption and multi-factor authentication
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
                  <Smartphone className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile-First Design</h3>
                <p className="text-gray-600">
                  Manage your portfolio on-the-go with our fully responsive platform optimized for all devices
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Request Processing</h3>
                <p className="text-gray-600">
                  Submit purchase and withdrawal requests with just a few clicks and track their status in real-time
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="h-12 w-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Analytics</h3>
                <p className="text-gray-600">
                  Access detailed performance metrics, risk analysis, and personalized investment recommendations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Client Testimonials */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                What Our Clients Say
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands of satisfied investors who trust us with their wealth
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    &ldquo;My relationship manager helped me build a diversified portfolio that&apos;s grown 18% this year. The platform makes it so easy to track everything in real-time.&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      AW
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Alice Williams</div>
                      <div className="text-sm text-gray-600">Tech Executive</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    &ldquo;I switched from my previous broker and couldn&apos;t be happier. The analytics tools and mobile app are incredible, and my RM is always available when I need advice.&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      BD
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Bob Davis</div>
                      <div className="text-sm text-gray-600">Business Owner</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    &ldquo;As a first-time investor, I was nervous about getting started. The team made it easy and my portfolio is already showing great returns. Highly recommend!&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      CM
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Carol Martinez</div>
                      <div className="text-sm text-gray-600">Marketing Director</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Start Building Your Wealth Today
            </h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Open your account in minutes and get matched with a dedicated relationship manager who will help you achieve your financial goals
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-2xl text-lg px-12 py-7 font-semibold">
                  Create Free Account
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/instruments">
                <Button size="lg" variant="outline" className="border-2 border-white bg-white text-gray-900 hover:bg-white/90 hover:text-gray-900 text-lg px-12 py-7 font-semibold">
                  View Investments
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Dev Credentials Banner */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border-t-4 border-yellow-400 px-4 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔑</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Test Credentials (Development Only)</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm font-mono">
                    <div>
                      <strong className="text-gray-900">Client:</strong>
                      <br />
                      alice.williams@example.com
                      <br />
                      Password123!
                    </div>
                    <div>
                      <strong className="text-gray-900">RM:</strong>
                      <br />
                      john.smith@wealthcrm.com
                      <br />
                      Password123!
                    </div>
                    <div>
                      <strong className="text-gray-900">Admin:</strong>
                      <br />
                      admin@wealthcrm.com
                      <br />
                      Password123!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
