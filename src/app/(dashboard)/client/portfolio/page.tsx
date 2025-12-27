/**
 * Client - Portfolio Page
 * View client's investment portfolio
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PortfolioDashboard } from '@/components/client/PortfolioDashboard';
import { ClientStatusBanner } from '@/components/client/ClientStatusBanner';
import { prisma } from '@/lib/db/prisma';

export const metadata: Metadata = {
  title: 'My Portfolio | Client',
  description: 'View your investment portfolio',
};

export default async function ClientPortfolioPage() {
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight">My Portfolio</h1>
      <p className="mt-2 text-muted-foreground">
        View and manage your investment portfolio
      </p>

      {/* Show status banner if client cannot transact */}
      <ClientStatusBanner
        hasRM={!!client.assignedRMId}
        verificationStatus={client.verificationStatus}
        className="mt-6"
      />

      <div className="mt-8">
        <PortfolioDashboard />
      </div>
    </div>
  );
}
