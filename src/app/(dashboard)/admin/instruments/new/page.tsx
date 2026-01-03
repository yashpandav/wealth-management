/**
 * Admin - Create New Instrument Page
 * Form for creating new investment instruments
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/session';
import { InstrumentForm } from '@/components/admin/InstrumentForm';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Create Instrument | Admin',
  description: 'Create a new investment instrument',
};

export default async function CreateInstrumentPage() {
  // Ensure user is admin
  await requireAdmin();

  return (
    <div className="container mx-auto max-w-4xl py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create Instrument</h1>
            <p className="mt-2 text-muted-foreground">
              Add a new investment instrument to the platform
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/instruments">Back to Instruments</Link>
          </Button>
        </div>
      </div>

      {/* Form */}
      <InstrumentForm mode="create" />
    </div>
  );
}
