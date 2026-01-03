/**
 * RM - KYC Pending Page
 * Displays clients with KYC documents under verification (read-only)
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { KYCPendingTable } from '@/components/rm/KYCPendingTable';

export const metadata: Metadata = {
  title: 'KYC Pending | RM',
  description: 'Clients with KYC documents under verification',
};

export default async function KYCPendingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'RM') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">KYC Pending</h1>
        <p className="text-muted-foreground">
          Clients with KYC documents under verification by DocAdmin - view only
        </p>
      </div>

      <div className="mt-6">
        <KYCPendingTable />
      </div>
    </div>
  );
}
