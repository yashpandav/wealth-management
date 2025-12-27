/**
 * DocAdmin New Enquiries Page
 * Display and manage user lead submissions (exclusive to DocAdmin)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { LeadsTable } from '@/components/docadmin/LeadsTable';

export const metadata = {
  title: 'New Enquiries | DocAdmin | Wealth Management CRM',
  description: 'View and manage user lead submissions',
};

export default async function DocAdminLeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCADMIN') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Enquiries</h1>
        <p className="text-gray-600 mt-2">
          View and manage all user lead submissions. Assign RMs and track lead status.
        </p>
      </div>

      <LeadsTable />
    </div>
  );
}
