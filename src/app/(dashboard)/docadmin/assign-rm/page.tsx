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
  title: 'Assign RM | Wealth Management CRM',
  description: 'Assign Relationship Managers to verified clients',
};

async function getVerifiedClientsWithoutRM() {
  // Get all clients who have all documents verified but no RM assigned
  const clients = await prisma.client.findMany({
    where: {
      assignedRMId: null,
      documents: {
        some: {},
      },
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
        },
      },
    },
    orderBy: {
      user: {
        createdAt: 'desc',
      },
    },
  });

  // Filter to only include clients where ALL documents are verified
  return clients.filter((client) => {
    const hasDocuments = client.documents.length > 0;
    const allVerified = client.documents.every(
      (doc) => doc.verificationStatus === 'VERIFIED'
    );
    return hasDocuments && allVerified;
  });
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

  const formattedClients = clients.map((client) => ({
    id: client.id,
    userId: client.user.id,
    name: `${client.user.firstName} ${client.user.lastName}`,
    email: client.user.email,
    phone: client.user.phone || '',
    documentsCount: client.documents.length,
    registeredAt: client.user.createdAt.toISOString(),
  }));

  const formattedRMs = rms.map((rm) => ({
    id: rm.id,
    name: `${rm.user.firstName} ${rm.user.lastName}`,
    email: rm.user.email,
    clientCount: rm._count.assignedClients,
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Assign Relationship Manager</h1>
        <p className="text-gray-600 mt-2">
          Assign RMs to clients whose documents have been verified.
        </p>
      </div>

      <AssignRMClient clients={formattedClients} relationshipManagers={formattedRMs} />
    </div>
  );
}
