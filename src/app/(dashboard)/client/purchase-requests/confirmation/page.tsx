/**
 * Client - Purchase Request Confirmation Page
 * Displays confirmation of purchase request submission with tracking number
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Request Confirmed | Client',
  description: 'Purchase request confirmation',
};

interface ConfirmationPageProps {
  searchParams: {
    tracking?: string;
  };
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and is a client
  if (!session?.user || session.user.role !== 'CLIENT') {
    redirect('/login');
  }

  const trackingNumber = searchParams.tracking;

  if (!trackingNumber) {
    redirect('/client/purchase-requests/new');
  }

  return (
    <div className="container mx-auto max-w-3xl py-4 md:py-6 lg:py-8">
      {/* Success Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Request Submitted Successfully!</h1>
        <p className="mt-2 text-muted-foreground">
          Your purchase request has been submitted for review
        </p>
      </div>

      {/* Tracking Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tracking Information</CardTitle>
          <CardDescription>Use this tracking number to check your request status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Tracking Number</p>
              <p className="text-2xl font-mono font-bold">{trackingNumber}</p>
            </div>
            <Badge className="bg-yellow-600">Pending Review</Badge>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
          <CardDescription>Your request will go through the following steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <div>
                <h4 className="font-semibold">Review by Relationship Manager</h4>
                <p className="text-sm text-muted-foreground">
                  Your assigned Relationship Manager will review your request and verify the
                  details. This typically takes 1-2 business days.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <div>
                <h4 className="font-semibold">Bank Statement Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Your RM may contact you to verify bank statements or request additional
                  documentation to confirm the transaction.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <div>
                <h4 className="font-semibold">Approval & Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Once approved, the investment will be added to your portfolio. You will receive
                  email notifications at each step.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              You will receive email notifications when your request status changes
            </li>
            <li>
              Please ensure you have sufficient funds in your bank account
            </li>
            <li>
              You can track your request status anytime using the tracking number
            </li>
            <li>
              If you have any questions, please contact your Relationship Manager
            </li>
            <li>
              Request approval typically takes 1-3 business days
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/client/requests">View My Requests</Link>
        </Button>
        <Button asChild>
          <Link href="/client/portfolio">Go to Portfolio</Link>
        </Button>
      </div>
    </div>
  );
}
