import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PurchaseRequestsTable } from '@/components/rm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Purchase Requests | RM Dashboard',
  description: 'Manage client purchase requests',
};

export default async function RMPurchaseRequestsPage() {
  const session = await getServerSession(authOptions);

  // Authentication check
  if (!session?.user) {
    redirect('/login');
  }

  // Authorization check - RM role only
  if (session.user.role !== 'RM') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Purchase Requests</h1>
        <p className="text-muted-foreground mt-2">
          Review and process purchase requests from your assigned clients
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Purchase Request Processing</CardTitle>
          <CardDescription>
            Review client purchase requests, verify bank statements, and approve or reject transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-yellow-600" />
              <div>
                <strong>Pending:</strong> New requests awaiting review
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-600" />
              <div>
                <strong>Processing:</strong> Requests currently being verified
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-green-600" />
              <div>
                <strong>Approved:</strong> Verified and approved requests ready for execution
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-red-600" />
              <div>
                <strong>Rejected:</strong> Requests that could not be approved
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PurchaseRequestsTable />
    </div>
  );
}
