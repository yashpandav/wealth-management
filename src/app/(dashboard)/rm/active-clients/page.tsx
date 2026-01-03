/**
 * RM - Active Clients Page
 * Displays verified clients eligible for transactions
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ActiveClientsTable } from '@/components/rm/ActiveClientsTable';

export const metadata: Metadata = {
  title: 'Active Clients | RM',
  description: 'Verified clients eligible for transactions',
};

export default async function ActiveClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'RM') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Active Clients</h1>
        <p className="text-muted-foreground">
          Verified clients with completed KYC - eligible for investments and transactions
        </p>
      </div>

      <div className="mt-6">
        <ActiveClientsTable />
      </div>
    </div>
  );
}
