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
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Contract Pending</h1>
        <p className="font-georgia text-brand-grey mt-2">
          Product requests approved by RM. Upload signed contracts to finalize these purchases.
        </p>
      </div>

      <ProductRequestsClient statusFilter="APPROVED" showUploadButton={true} />
    </div>
  );
}
