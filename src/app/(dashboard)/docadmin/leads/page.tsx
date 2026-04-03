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
    <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div>
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">New Enquiries</h1>
        <p className="font-georgia text-brand-grey mt-2">
          View and manage all user lead submissions. Assign RMs and track lead status.
        </p>
      </div>

      <LeadsTable />
    </div>
  );
}
