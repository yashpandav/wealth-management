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
  title: 'Product Requests | DocAdmin | Wealth Management CRM',
  description: 'Manage product purchase requests and upload contracts',
};

export default async function DocAdminProductRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCADMIN') {
    redirect('/login');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Product Requests</h1>
        <p className="text-gray-600 mt-2">
          View product requests submitted by clients that are pending RM approval or rejection.
        </p>
      </div>

      <ProductRequestsClient statusFilter="PENDING" />
    </div>
  );
}
