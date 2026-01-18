/**
 * Client My Payouts Page
 * View payout history and upcoming payouts (read-only)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PayoutHistory } from '@/components/client/PayoutHistory';

export const metadata = {
  title: 'My Payouts | Client | Wealth Management CRM',
  description: 'View your payout history and upcoming interest payments',
};

export default async function ClientPayoutsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/login');
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">My Payouts</h1>
        <p className="font-georgia text-brand-grey mt-2">
          View your interest payout history and upcoming scheduled payments.
        </p>
      </div>

      <PayoutHistory />
    </div>
  );
}
