/**
 * RM - Dashboard Page
 * Main dashboard for relationship managers
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { RMDashboard } from '@/components/rm/RMDashboard';

export const metadata: Metadata = {
  title: 'Dashboard | RM',
  description: 'Relationship Manager Dashboard',
};

export default async function RMDashboardPage() {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and is an RM
  if (!session?.user || session.user.role !== 'RM') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">RM Dashboard</h1>
      <p className="font-georgia mt-2 text-brand-grey">
        Manage your assigned clients and pending requests
      </p>

      <div className="mt-6">
        <RMDashboard />
      </div>
    </div>
  );
}
