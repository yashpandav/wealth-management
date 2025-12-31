/**
 * RM - Registered Clients (No KYC) Page
 * Displays clients who registered but haven't submitted KYC documents
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { RegisteredClientsTable } from '@/components/rm/RegisteredClientsTable';

export const metadata: Metadata = {
  title: 'Registered Clients (No KYC) | RM',
  description: 'Clients who registered but have not submitted KYC documents',
};

export default async function RegisteredClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'RM') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Registered Clients (No KYC)</h1>
        <p className="text-muted-foreground">
          Clients who completed registration but haven&apos;t submitted KYC documents yet
        </p>
      </div>

      <div className="mt-6">
        <RegisteredClientsTable />
      </div>
    </div>
  );
}
