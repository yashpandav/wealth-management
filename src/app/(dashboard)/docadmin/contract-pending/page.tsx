/**
 * DocAdmin Contract Pending Page
 * Shows product requests approved by RM, awaiting contract upload
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ProductRequestsClient } from '../product-requests/product-requests-client';

export const metadata = {
  title: 'Contract Pending | DocAdmin | Wealth Management CRM',
  description: 'Upload contracts for approved product requests',
};

export default async function ContractPendingPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCADMIN') {
    redirect('/login');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contract Pending</h1>
        <p className="text-gray-600 mt-2">
          Product requests approved by RM. Upload signed contracts to finalize these purchases.
        </p>
      </div>

      <ProductRequestsClient statusFilter="APPROVED" showUploadButton={true} />
    </div>
  );
}
