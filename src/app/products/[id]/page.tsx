/**
 * Public Plan Detail Page
 * Detailed view of a single instrument with performance charts
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InstrumentDetail } from '@/components/public/InstrumentDetail';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/instruments/${params.id}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return {
        title: 'Plan Not Found | EMDEE VENTURES',
      };
    }

    const data = await response.json();
    const instrument = data.data.instrument;

    return {
      title: `${instrument.name} (${instrument.symbol}) | EMDEE VENTURES`,
      description: instrument.description || `Invest in ${instrument.name} - ${instrument.type}`,
      keywords: [
        instrument.name,
        instrument.symbol,
        instrument.type,
        'investment',
        'wealth management',
      ],
    };
  } catch {
    return {
      title: 'Plan Details | EMDEE VENTURES',
    };
  }
}

export default async function InstrumentDetailPage({ params }: PageProps) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/instruments/${params.id}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      notFound();
    }

    const data = await response.json();

    return <InstrumentDetail instrument={data.data.instrument} relatedInstruments={data.data.relatedInstruments} />;
  } catch {
    notFound();
  }
}
