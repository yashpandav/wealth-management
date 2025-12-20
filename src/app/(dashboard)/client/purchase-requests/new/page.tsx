/**
 * Client - New Purchase Request Page
 * Form for clients to submit new purchase requests
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PurchaseRequestForm } from '@/components/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'New Purchase Request | Client',
  description: 'Submit a new purchase request',
};

export default async function NewPurchaseRequestPage() {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and is a client
  if (!session?.user || session.user.role !== 'CLIENT') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Purchase Request</h1>
        <p className="mt-2 text-muted-foreground">
          Submit a request to purchase an investment instrument
        </p>
      </div>

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
