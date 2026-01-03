/**
 * DocAdmin Contract Created Page
 * Shows completed product requests with uploaded contracts
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ProductRequestsClient } from '../product-requests/product-requests-client';

export const metadata = {
  title: 'Contract Created | DocAdmin | Wealth Management CRM',
  description: 'View completed product requests with uploaded contracts',
};

export default async function ContractCreatedPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCADMIN') {
    redirect('/login');
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Contract Created</h1>
        <p className="font-georgia text-brand-grey mt-2">
          Completed product requests with contracts uploaded and finalized.
        </p>
      </div>

      <ProductRequestsClient statusFilter="COMPLETED" showUploadButton={false} />
    </div>
  );
}
