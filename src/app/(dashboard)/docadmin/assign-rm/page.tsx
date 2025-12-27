/**
 * DocAdmin - Assign RM to Verified Clients
 * Shows clients with verified documents who need RM assignment
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { AssignRMClient } from './assign-rm-client';

export const metadata = {
  title: 'RM Assignment Pending | Wealth Management CRM',
  description: 'Manage clients with verified KYC awaiting RM assignment',
};

async function getVerifiedClientsWithoutRM() {
  // Get all clients with VERIFIED KYC status but no RM assigned
  // KYC verification must be complete BEFORE RM assignment is allowed
  const clients = await prisma.client.findMany({
    where: {
      verificationStatus: 'VERIFIED',
      assignedRMId: null,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },
      documents: {
        select: {
          id: true,
          documentType: true,
          verificationStatus: true,
          verifiedAt: true,
        },
        orderBy: {
          verifiedAt: 'desc',
        },
      },
    },
    orderBy: {
      user: {
        createdAt: 'desc',
      },
    },
  });

  return clients;
}

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

export default async function AssignRMPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCADMIN') {
    redirect('/login');
  }

  const [clients, rms] = await Promise.all([
    getVerifiedClientsWithoutRM(),
    getRelationshipManagers(),
  ]);

  const formattedClients = clients.map((client) => {
    // Get the most recent verification date from documents
    const verifiedDocs = client.documents.filter((d) => d.verifiedAt);
    const latestVerifiedAt = verifiedDocs.length > 0
      ? verifiedDocs.reduce((latest, doc) =>
          doc.verifiedAt && (!latest || doc.verifiedAt > latest) ? doc.verifiedAt : latest,
          null as Date | null
        )
      : null;

    return {
      id: client.id,
      userId: client.user.id,
      name: `${client.user.firstName} ${client.user.lastName}`,
      email: client.user.email,
      phone: client.user.phone || '',
      documentsCount: client.documents.length,
      registeredAt: client.user.createdAt.toISOString(),
      verifiedAt: latestVerifiedAt?.toISOString() || null,
    };
  });

  const formattedRMs = rms.map((rm) => ({
    id: rm.id,
    name: `${rm.user.firstName} ${rm.user.lastName}`,
    email: rm.user.email,
    clientCount: rm._count.assignedClients,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">RM Assignment Pending</h1>
        <p className="mt-2 text-muted-foreground">
          Manage clients with verified KYC documents who are awaiting Relationship Manager assignment.
        </p>
      </div>

      <AssignRMClient clients={formattedClients} relationshipManagers={formattedRMs} />
    </div>
  );
}
