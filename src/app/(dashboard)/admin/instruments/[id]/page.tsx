/**
 * Admin - Instrument Detail Page
 * View and edit a single instrument
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { InstrumentForm, InstrumentStatusDialog, InstrumentAuditLog } from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Instrument Details | Admin',
  description: 'View and edit instrument details',
};

interface InstrumentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InstrumentDetailPage({ params }: InstrumentDetailPageProps) {
  // Ensure user is admin
  await requireAdmin();

  // Fetch instrument
  const instrument = await prisma.instrument.findUnique({
    where: {
      id: params.id,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          holdings: true,
          transactions: true,
        },
      },
    },
  });

  if (!instrument) {
    notFound();
  }

  // Serialize data for client component
  const serializedInstrument = {
    symbol: instrument.symbol,
    name: instrument.name,
    type: instrument.type,
    isin: instrument.isin,
    description: instrument.description,
    currentPrice: Number(instrument.currentPrice),
    currency: instrument.currency,
    exchange: instrument.exchange,
    sector: instrument.sector,
    marketCap: instrument.marketCap ? Number(instrument.marketCap) : null,
    yearlyHigh: instrument.yearlyHigh ? Number(instrument.yearlyHigh) : null,
    yearlyLow: instrument.yearlyLow ? Number(instrument.yearlyLow) : null,
    dividendYield: instrument.dividendYield ? Number(instrument.dividendYield) : null,
    peRatio: instrument.peRatio ? Number(instrument.peRatio) : null,
    riskRating: instrument.riskRating as 'LOW' | 'MEDIUM' | 'HIGH' | null,
    minimumInvestment: instrument.minimumInvestment ? Number(instrument.minimumInvestment) : null,
    isActive: instrument.isActive,
    isPublic: instrument.isPublic,
    launchDate: instrument.launchDate?.toISOString() || null,
    prospectusUrl: instrument.prospectusUrl,
  };

  return (
    <div className="container mx-auto max-w-4xl py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{instrument.name}</h1>
              <Badge variant={instrument.isActive ? 'default' : 'secondary'}>
                {instrument.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              {instrument.symbol} • {instrument.type.replace('_', ' ')}
            </p>
          </div>
          <div className="flex gap-2">
            <InstrumentStatusDialog
              instrumentId={params.id}
              instrumentName={instrument.name}
              currentStatus={instrument.isActive}
              holdingsCount={instrument._count.holdings}
            />
            <Button variant="outline" asChild>
              <Link href="/admin/instruments">Back to Instruments</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Current Price</CardDescription>
            <CardTitle className="text-2xl">
              {instrument.currency} {Number(instrument.currentPrice).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Holdings</CardDescription>
            <CardTitle className="text-2xl">{instrument._count.holdings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-2xl">{instrument._count.transactions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Edit Form */}
      <InstrumentForm mode="edit" initialData={serializedInstrument} instrumentId={params.id} />

      {/* Audit Trail */}
      <div className="mt-8">
        <InstrumentAuditLog instrumentId={params.id} />
      </div>
    </div>
  );
}
