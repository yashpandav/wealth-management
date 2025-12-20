/**
 * Admin Dashboard Page
 * Main analytics dashboard for administrators
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard | Wealth Management CRM',
  description: 'Comprehensive analytics and system-wide insights for administrators',
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System-wide analytics and insights</p>
      </div>

      <AdminDashboard />
    </div>
  );
}
