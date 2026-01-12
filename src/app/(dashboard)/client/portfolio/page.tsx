/**
 * Client - Portfolio Page
 * View client's investment portfolio
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
    <div className="container px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">My Portfolio</h1>
          <p className="font-georgia text-brand-grey mt-2">
            View and manage your investment portfolio
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/client/products"
            className="inline-flex items-center justify-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 font-optima transition-colors shadow-sm"
          >
            Go to Investment Plans
          </Link>
        </div>
      </div>

      {/* Show status banner if client cannot transact */}
      <ClientStatusBanner
        hasRM={!!client.assignedRMId}
        verificationStatus={client.verificationStatus}
        className="mb-6"
      />

      <PortfolioDashboard />
    </div>
  );
}
