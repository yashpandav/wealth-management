/**
 * Client - New Purchase Request Page
 * Form for clients to submit new purchase requests
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PurchaseRequestForm } from '@/components/client';
import { ClientStatusBanner } from '@/components/client/ClientStatusBanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db/prisma';

export const metadata: Metadata = {
  title: 'New Investment Request | Client',
  description: 'Submit a new investment request',
};

export default async function NewPurchaseRequestPage() {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and is a client
  if (!session?.user || session.user.role !== 'CLIENT') {
    redirect('/login');
  }

  // Fetch client data to determine eligibility for transactions
  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: {
      assignedRMId: true,
      verificationStatus: true,
    },
  });

  if (!client) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto max-w-4xl py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New Investment Request</h1>
        <p className="mt-2 text-muted-foreground">
          Submit a request to invest in an investment instrument
        </p>
      </div>

      {/* Show status banner if client cannot transact */}
      <ClientStatusBanner
        hasRM={!!client.assignedRMId}
        verificationStatus={client.verificationStatus}
        className="mb-6"
      />

      {/* Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Before You Begin</CardTitle>
          <CardDescription>Please review the following information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Ensure you have sufficient funds in your bank account</li>
            <li>Your request will be reviewed by your Relationship Manager</li>
            <li>You will receive email notifications about the status of your request</li>
            <li>
              Once approved, the investment will be reflected in your portfolio within 1-2 business
              days
            </li>
            <li>
              You may need to provide bank statement verification during the approval process
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Purchase Request Form */}
      <PurchaseRequestForm />
    </div>
  );
}
