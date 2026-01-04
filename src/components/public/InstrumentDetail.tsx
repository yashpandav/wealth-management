/**
 * Public Instrument Detail Component
 * Comprehensive instrument information with performance charts
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ChevronRight,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Calendar,
  Building2,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Instrument {
  id: string;
  name: string;
  symbol: string;
  type: string;
  isin: string | null;
  description: string | null;
  riskRating: string | null;
  minimumInvestment: number;
  dividendYield: number;
  currentPrice: number;
  currency: string;
  lastPriceUpdate: string;
  exchange: string | null;
  sector: string | null;
  marketCap: number | null;
  yearlyHigh: number | null;
  yearlyLow: number | null;
  peRatio: number | null;
  launchDate: string | null;
  prospectusUrl: string | null;
}

interface RelatedInstrument {
  id: string;
  name: string;
  symbol: string;
  type: string;
  riskRating: string | null;
  dividendYield: number;
  currentPrice: number;
}

interface InstrumentDetailProps {
  instrument: Instrument;
  relatedInstruments: RelatedInstrument[];
}

export function InstrumentDetail({ instrument, relatedInstruments }: InstrumentDetailProps) {
  const [timePeriod, setTimePeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1Y');

  // Generate simulated historical price data
  const generatePriceData = (period: string) => {
    let daysBack = 365;
    let interval = 7;

    switch (period) {
      case '1M':
        daysBack = 30;
        interval = 1;
        break;
      case '3M':
        daysBack = 90;
        interval = 3;
        break;
      case '6M':
        daysBack = 180;
        interval = 7;
        break;
      case '1Y':
        daysBack = 365;
        interval = 7;
        break;
      case 'ALL':
        daysBack = 730;
        interval = 14;
        break;
    }

    const data = [];
    const today = new Date();
    const priceChange = instrument.currentPrice * 0.15; // 15% price variation
    const startPrice = instrument.currentPrice - priceChange / 2;

    for (let i = daysBack; i >= 0; i -= interval) {
      const date = subDays(today, i);
      const progress = (daysBack - i) / daysBack;
      const volatility = (Math.random() - 0.5) * (instrument.currentPrice * 0.05);
      const price = startPrice + priceChange * progress + volatility;

      data.push({
        date: format(date, 'MMM dd'),
        price: Number(price.toFixed(2)),
      });
    }

    return data;
  };

  const priceData = generatePriceData(timePeriod);
  const priceChange = priceData.length > 0 ? instrument.currentPrice - priceData[0].price : 0;
  const priceChangePercent =
    priceData.length > 0 ? (priceChange / priceData[0].price) * 100 : 0;
  const isPositive = priceChange >= 0;

  const getRiskBadgeColor = (risk: string | null) => {
    if (!risk) return 'bg-gray-500/10 text-gray-700 border-gray-200';
    const riskUpper = risk.toUpperCase();
    if (riskUpper.includes('LOW')) return 'bg-green-500/10 text-green-700 border-green-200';
    if (riskUpper.includes('MEDIUM')) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    if (riskUpper.includes('HIGH')) return 'bg-red-500/10 text-red-700 border-red-200';
    return 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'STOCK':
        return 'bg-brand-blue/10/10 text-brand-blue border-blue-200';
      case 'BOND':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'MUTUAL_FUND':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-200';
      case 'ETF':
        return 'bg-cyan-500/10 text-cyan-700 border-cyan-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const formatType = (type: string) => type.replace('_', ' ');

  // Structured Data for Financial Product
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: instrument.name,
    description: instrument.description || `Invest in ${instrument.name}`,
    identifier: instrument.symbol,
    category: formatType(instrument.type),
    offers: {
      '@type': 'Offer',
      price: instrument.currentPrice,
      priceCurrency: instrument.currency,
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    },
    ...(instrument.isin && { gtin13: instrument.isin }),
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-brand-blue">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/instruments" className="hover:text-brand-blue">
                Instruments
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">{instrument.symbol}</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 lg:py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl md:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {instrument.name}
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-xl text-gray-600 font-mono">{instrument.symbol}</p>
                  {instrument.isin && (
                    <p className="text-sm text-gray-500">ISIN: {instrument.isin}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={getTypeBadgeColor(instrument.type)}>
                  {formatType(instrument.type)}
                </Badge>
                <Badge variant="outline" className={getRiskBadgeColor(instrument.riskRating)}>
                  {instrument.riskRating || 'N/A'}
                </Badge>
              </div>
            </div>

            {/* Current Price */}
            <div className="flex items-baseline gap-4">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {instrument.currency} {instrument.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="text-lg font-semibold">
                  {isPositive ? '+' : ''}
                  {priceChange.toFixed(2)} ({isPositive ? '+' : ''}
                  {priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {format(new Date(instrument.lastPriceUpdate), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>

          {/* Performance Chart */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Price Performance</CardTitle>
                <div className="flex gap-2 self-start sm:self-auto">
                  {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((period) => (
                    <Button
                      key={period}
                      variant={timePeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimePeriod(period)}
                      className="h-8 px-3 flex-1 sm:flex-none"
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `${instrument.currency} ${value.toFixed(2)}`,
                      'Price',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {instrument.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{instrument.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {instrument.exchange && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">Exchange</span>
                        </div>
                        <p className="font-semibold text-lg">{instrument.exchange}</p>
                      </div>
                    )}

                    {instrument.sector && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-sm">Sector</span>
                        </div>
                        <p className="font-semibold text-lg">{instrument.sector}</p>
                      </div>
                    )}

                    {instrument.marketCap !== null && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">Market Cap</span>
                        </div>
                        <p className="font-semibold text-lg">
                          ${(instrument.marketCap / 1000000000).toFixed(2)}B
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Dividend Yield</span>
                      </div>
                      <p className="font-semibold text-lg">{instrument.dividendYield.toFixed(2)}%</p>
                    </div>

                    {instrument.yearlyHigh !== null && (
                      <div>
                        <div className="text-gray-600 text-sm mb-1">52-Week High</div>
                        <p className="font-semibold text-lg">
                          {instrument.currency} {instrument.yearlyHigh.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {instrument.yearlyLow !== null && (
                      <div>
                        <div className="text-gray-600 text-sm mb-1">52-Week Low</div>
                        <p className="font-semibold text-lg">
                          {instrument.currency} {instrument.yearlyLow.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {instrument.peRatio !== null && (
                      <div>
                        <div className="text-gray-600 text-sm mb-1">P/E Ratio</div>
                        <p className="font-semibold text-lg">{instrument.peRatio.toFixed(2)}</p>
                      </div>
                    )}

                    {instrument.launchDate && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Launch Date</span>
                        </div>
                        <p className="font-semibold text-lg">
                          {format(new Date(instrument.launchDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              {instrument.prospectusUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={instrument.prospectusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-brand-blue/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-brand-blue" />
                        <div>
                          <p className="font-semibold">Prospectus</p>
                          <p className="text-sm text-gray-600">
                            Official investment prospectus document
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Investment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Investment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Minimum Investment</p>
                    <p className="text-2xl font-bold">
                      ${instrument.minimumInvestment.toLocaleString()}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Risk Level</p>
                    <Badge variant="outline" className={getRiskBadgeColor(instrument.riskRating)}>
                      {instrument.riskRating || 'Not Rated'}
                    </Badge>
                  </div>
                  <Separator />
                  <Link href="/register">
                    <Button className="w-full" size="lg">
                      Invest Now
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500 text-center">
                    Sign up to start investing in this instrument
                  </p>
                </CardContent>
              </Card>

              {/* Related Instruments */}
              {relatedInstruments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Related Instruments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relatedInstruments.map((related) => (
                      <Link
                        key={related.id}
                        href={`/instruments/${related.id}`}
                        className="block p-3 border rounded-lg hover:bg-brand-blue/5 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="font-semibold">{related.symbol}</p>
                            <p className="text-sm text-gray-600">{related.name}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatType(related.type)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-semibold">
                            ${related.currentPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-green-600">
                            {related.dividendYield.toFixed(2)}% yield
                          </span>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-4 mt-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl md:text-3xl md:text-4xl font-bold mb-4">
              Ready to Invest in {instrument.symbol}?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Create an account to access this investment opportunity and get matched with a
              dedicated relationship manager
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-brand-blue hover:bg-brand-blue/5">
                  Create Account
                </Button>
              </Link>
              <Link href="/instruments">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Browse More Instruments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
