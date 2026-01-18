/**
 * DocAdmin Pending Payouts Page
 * Shows pending payouts that need to be processed
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PendingPayoutsTable } from '@/components/docadmin/PendingPayoutsTable';

export const metadata = {
  title: 'Pending Payouts | DocAdmin | Wealth Management CRM',
  description: 'Process pending interest payouts',
};

export default async function PendingPayoutsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'DOCADMIN' && session.user.role !== 'ADMIN')) {
    redirect('/login');
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Pending Payouts</h1>
        <p className="font-georgia text-brand-grey mt-2">
          Process interest payouts by uploading payment receipts.
        </p>
      </div>

      <PendingPayoutsTable />
    </div>
  );
}
