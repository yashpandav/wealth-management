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
    <div className="container mx-auto py-4 md:py-6 lg:py-8">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">RM Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your assigned clients and pending requests
      </p>

      <div className="mt-8">
        <RMDashboard />
      </div>
    </div>
  );
}
