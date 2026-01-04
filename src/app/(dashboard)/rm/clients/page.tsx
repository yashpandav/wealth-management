/**
 * RM - Assigned Clients List Page
 * View and manage assigned clients
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AssignedClientsTable } from '@/components/rm/AssignedClientsTable';

export const metadata: Metadata = {
  title: 'Assigned Clients | RM',
  description: 'Manage your assigned clients',
};

export default async function AssignedClientsPage() {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and is an RM
  if (!session?.user || session.user.role !== 'RM') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Assigned Clients</h1>
      <p className="font-georgia mt-2 text-brand-grey">
        View and manage your assigned client portfolio
      </p>

      <div className="mt-8">
        <AssignedClientsTable />
      </div>
    </div>
  );
}
