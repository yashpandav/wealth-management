/**
 * Admin User Leads Page
 * Display and manage user lead submissions
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { UserLeadsTable } from '@/components/admin/UserLeadsTable';

export const metadata = {
  title: 'User Leads | Admin | Wealth Management CRM',
  description: 'View and manage user lead submissions',
};

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Leads</h1>
        <p className="text-gray-600 mt-2">
          View all user lead submissions from the wealth management form
        </p>
      </div>

      <UserLeadsTable />
    </div>
  );
}
