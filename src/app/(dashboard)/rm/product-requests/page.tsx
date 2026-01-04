import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ProductPurchaseRequestsTable } from '@/components/rm/ProductPurchaseRequestsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Product Requests | RM Dashboard',
  description: 'Manage client product purchase requests',
};

export default async function RMProductRequestsPage() {
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
    <div className="container mx-auto py-8 px-8">
      <div className="mb-8">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Product Requests</h1>
        <p className="font-georgia text-brand-grey mt-2">
          Review and process product purchase requests from your assigned clients
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Product Request Processing</CardTitle>
          <CardDescription>
            Review client product requests for Venture A, B, and C products. Verify investment details and approve or reject requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-yellow-600" />
              <div>
                <strong>Pending:</strong> New requests awaiting your review
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-green-600" />
              <div>
                <strong>Approved:</strong> Verified and approved investment requests
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

      <ProductPurchaseRequestsTable />
    </div>
  );
}
