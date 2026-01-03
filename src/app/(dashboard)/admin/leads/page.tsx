/**
 * Admin Leads Page - FORBIDDEN
 * Lead management has been moved to DocAdmin exclusively
 * Redirect to /docadmin/leads (DocAdmin role) for lead management
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: '403 Forbidden | Admin | Wealth Management CRM',
  description: 'Access denied - Lead management is exclusive to DocAdmin',
};

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Redirect DocAdmin users to the correct page
  if (session.user.role === 'DOCADMIN') {
    redirect('/docadmin/leads');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-red-600">403 - Access Forbidden</h1>
        <p className="text-gray-600 mt-2">
          Lead management is no longer available to Administrators
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            As of the latest system update, <strong>lead management has been transferred exclusively to the DocAdmin role</strong>.
          </p>
          <div className="bg-brand-blue/10 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All lead-related responsibilities (viewing, managing, and assigning RMs to leads)
              are now handled under the <strong>DocAdmin Dashboard → New Enquiries</strong> tab.
            </p>
          </div>
          <p className="text-gray-700">
            If you need to manage leads, please contact your system administrator to grant you DocAdmin access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
