/**
 * Admin - Investment Plan Requests Dashboard
 * View and monitor all investment plan requests (Venture A, B, C)
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminProductRequestsTable } from '@/components/admin/AdminProductRequestsTable';

export default function AdminPurchaseRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    router.push('/error?error=AccessDenied');
    return null;
  }

  return (
    <div className="container px-8 py-8">
      <div className="mb-8">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue mb-2">Investment Plan</h1>
        <p className="font-georgia text-brand-grey">
          Monitor and manage all client investment plan
        </p>
      </div>

      <AdminProductRequestsTable />
    </div>
  );
}
