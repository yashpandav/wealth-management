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

/**
 * Retrieve clients whose KYC verification status is VERIFIED and who do not have an assigned relationship manager.
 *
 * The returned client records include nested `user` and `documents` data:
 * - `user`: id, firstName, lastName, email, phone, createdAt
 * - `documents`: id, documentType, verificationStatus, verifiedAt (ordered by `verifiedAt` descending)
 *
 * @returns An array of client records with nested `user` and `documents`; clients are ordered by `user.createdAt` descending.
 */
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

/**
 * Fetches active relationship managers along with their user details and assigned-client counts.
 *
 * @returns An array of relationship manager records, each including the related `user` (id, firstName, lastName, email) and `_count.assignedClients` indicating how many clients are assigned to that manager.
 */
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

/**
 * Page that displays verified clients without an assigned Relationship Manager and enables RM assignment.
 *
 * This server-rendered page fetches verified clients who lack an assigned RM and active relationship managers,
 * formats both datasets for the UI, and renders a header and the AssignRMClient component with those lists.
 *
 * Redirects to `/login` when the current session is missing or the user is not in the `DOCADMIN` role.
 *
 * @returns A React element containing the page header and the AssignRMClient component populated with formatted clients and relationship managers.
 */
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