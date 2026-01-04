/**
 * RM - Leads Page
 * Displays leads assigned to RM (not yet registered)
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { RMLeadsTable } from '@/components/rm/RMLeadsTable';

export const metadata: Metadata = {
  title: 'Leads | RM',
  description: 'Manage assigned leads',
};

export default async function RMLeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'RM') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="space-y-2">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Leads</h1>
        <p className="font-georgia text-brand-grey">
          Unregistered leads assigned to you - follow up to convert them to clients
        </p>
      </div>

      <div className="mt-6">
        <RMLeadsTable />
      </div>
    </div>
  );
}
