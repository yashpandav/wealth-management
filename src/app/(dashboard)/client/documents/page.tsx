/**
 * Client - KYC Documents Page
 * View and manage KYC verification documents
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { KYCDocumentsPanel } from '@/components/client/KYCDocumentsPanel';

export const metadata: Metadata = {
  title: 'KYC Documents | Client',
  description: 'Upload and manage your KYC verification documents',
};

export default async function ClientDocumentsPage() {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and is a client
  if (!session?.user || session.user.role !== 'CLIENT') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <KYCDocumentsPanel />
    </div>
  );
}
