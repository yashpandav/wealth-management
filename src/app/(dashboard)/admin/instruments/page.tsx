/**
 * Admin - Instruments List Page
 * View and manage all investment instruments
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { InstrumentTable } from '@/components/admin/InstrumentTable';

export const metadata: Metadata = {
  title: 'Instruments | Admin',
  description: 'Manage investment instruments',
};

export default async function InstrumentsPage() {
  // Ensure user is admin
  await requireAdmin();

  // Fetch initial instruments data
  const instruments = await prisma.instrument.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      name: 'asc',
    },
    take: 20,
    select: {
      id: true,
      symbol: true,
      name: true,
      type: true,
      currentPrice: true,
      currency: true,
      riskRating: true,
      minimumInvestment: true,
      isActive: true,
      isPublic: true,
      createdAt: true,
      _count: {
        select: {
          holdings: true,
          transactions: true,
        },
      },
    },
  });

  // Serialize data for client component
  const serializedInstruments = instruments.map((instrument) => ({
    ...instrument,
    currentPrice: Number(instrument.currentPrice),
    minimumInvestment: instrument.minimumInvestment ? Number(instrument.minimumInvestment) : null,
    createdAt: instrument.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instruments</h1>
            <p className="mt-2 text-muted-foreground">
              Manage investment instruments available on the platform
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/instruments/new">Create Instrument</Link>
          </Button>
        </div>
      </div>

      {/* Instrument Table */}
      <InstrumentTable initialData={serializedInstruments} />
    </div>
  );
}
