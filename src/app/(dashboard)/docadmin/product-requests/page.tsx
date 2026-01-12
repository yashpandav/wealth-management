/**
 * DocAdmin Product Requests Page
 * Displays product requests in 3 tabs:
 * 1. Product Requested (PENDING) - waiting for RM approval
 * 2. Contract Pending (APPROVED) - RM approved, waiting for contract upload
 * 3. Completed (COMPLETED) - contract uploaded and finalized
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ProductRequestsClient } from './product-requests-client';

export const metadata = {
  title: 'Plan Requests | DocAdmin | Wealth Management CRM',
  description: 'Manage product purchase requests and upload contracts',
};

export default async function DocAdminProductRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCADMIN') {
    redirect('/login');
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Plan Requests</h1>
        <p className="font-georgia text-brand-grey mt-2">
          View product requests submitted by clients that are pending RM approval or rejection.
        </p>
      </div>

      <ProductRequestsClient statusFilter="PENDING" />
    </div>
  );
}
