/**
 * Document Verification Page
 * View, verify, reject documents and assign RMs
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { DocumentVerificationClient } from './document-verification-client';

export const metadata = {
  title: 'Document Verification | Wealth Management CRM',
  description: 'Review and verify client documents',
};

async function getRelationshipManagers() {
  return prisma.relationshipManager.findMany({
    where: {
      user: {
        status: 'ACTIVE',
        isActive: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          assignedClients: true,
        },
      },
    },
    orderBy: {
      user: {
        firstName: 'asc',
      },
    },
  });
}

export default async function DocumentVerificationPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCADMIN') {
    redirect('/login');
  }

  const rms = await getRelationshipManagers();

  const formattedRMs = rms.map((rm) => ({
    id: rm.id,
    name: `${rm.user.firstName} ${rm.user.lastName}`,
    email: rm.user.email,
    clientCount: rm._count.assignedClients,
  }));

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">Document Verification</h1>
        <p className="font-georgia text-brand-grey mt-2">
          Review client documents, verify or reject them, and assign Relationship Managers.
        </p>
      </div>

      <DocumentVerificationClient relationshipManagers={formattedRMs} />
    </div>
  );
}
