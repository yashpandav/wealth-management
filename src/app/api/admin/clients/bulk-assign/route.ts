/**
 * Admin Bulk Client Assignment API
 * Perform bulk assignment operations on multiple clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { sanitizeObject } from '@/lib/security';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { runInBackground } from '@/lib/background';

const bulkAssignmentSchema = z.object({
  clientUserIds: z.array(z.string().uuid()).min(1, 'At least one client required'),
  rmId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/admin/clients/bulk-assign
 * Assign multiple clients to a relationship manager
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);
    const validationResult = bulkAssignmentSchema.safeParse(sanitizedBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { clientUserIds, rmId, reason } = validationResult.data;

    // Fetch RM and users in parallel
    const [rm, users] = await Promise.all([
      prisma.relationshipManager.findUnique({
        where: { id: rmId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              assignedClients: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          id: { in: clientUserIds },
        },
        include: {
          client: {
            select: {
              id: true,
              assignedRMId: true,
            },
          },
        },
      }),
    ]);

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'Relationship Manager not found' },
        { status: 404 }
      );
    }

    if (!rm.user.isActive || rm.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Relationship Manager is not active' },
        { status: 400 }
      );
    }

    // Check RM capacity
    const currentLoad = rm._count.assignedClients;
    const newLoad = currentLoad + clientUserIds.length;

    if (rm.maxClientLimit && newLoad > rm.maxClientLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Bulk assignment would exceed RM capacity. Current: ${currentLoad}, Attempted: ${clientUserIds.length}, Max: ${rm.maxClientLimit}`,
        },
        { status: 400 }
      );
    }

    if (users.length !== clientUserIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some users not found' },
        { status: 404 }
      );
    }

    // Check all users are clients
    const nonClients = users.filter((u) => u.role !== UserRole.CLIENT);
    if (nonClients.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `${nonClients.length} user(s) are not clients`,
          details: nonClients.map((u) => ({ id: u.id, email: u.email, role: u.role })),
        },
        { status: 400 }
      );
    }

    // Separate into new assignments and reassignments
    const usersNeedingClient = users.filter((u) => !u.client);
    const usersNeedingReassignment = users.filter((u) => u.client && u.client.assignedRMId !== rmId);
    const alreadyAssigned = users.filter((u) => u.client && u.client.assignedRMId === rmId);

    const results = {
      newAssignments: 0,
      reassignments: 0,
      skipped: alreadyAssigned.length,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    // Create new client records for users without one
    if (usersNeedingClient.length > 0) {
      try {
        const createResult = await prisma.client.createMany({
          data: usersNeedingClient.map((u) => ({
            userId: u.id,
            assignedRMId: rmId,
            assignedAt: new Date(),
          })),
        });
        results.newAssignments = createResult.count;

        // Fire-and-forget audit logs and notifications for new assignments
        const newAssignmentSideEffects = usersNeedingClient.flatMap((user) => [
          prisma.auditLog.create({
            data: {
              userId: admin.id,
              action: 'CLIENT_ASSIGN',
              entityType: 'Client',
              entityId: user.id,
              description: `Admin bulk assigned client ${user.firstName} ${user.lastName} to RM ${rm.user.firstName} ${rm.user.lastName}${reason ? `: ${reason}` : ''}`,
              metadata: {
                bulkOperation: true,
                clientUserId: user.id,
                rmId: rmId,
                reason: reason || undefined,
              },
            },
          }),
          prisma.notification.create({
            data: {
              userId: user.id,
              type: 'INFO',
              category: 'ASSIGNMENT',
              title: 'Relationship Manager Assigned',
              message: `You have been assigned to relationship manager ${rm.user.firstName} ${rm.user.lastName}.`,
              metadata: {
                bulkOperation: true,
                rmId: rmId,
                rmName: `${rm.user.firstName} ${rm.user.lastName}`,
                reason: reason || undefined,
              },
            },
          }),
        ]);

        newAssignmentSideEffects.push(
          prisma.notification.create({
            data: {
              userId: rm.userId,
              type: 'INFO',
              category: 'ASSIGNMENT',
              title: 'Bulk Client Assignment',
              message: `${usersNeedingClient.length} new client(s) have been assigned to you.`,
              metadata: {
                bulkOperation: true,
                clientCount: usersNeedingClient.length,
                clientNames: usersNeedingClient.map((u) => `${u.firstName} ${u.lastName}`),
              },
            },
          })
        );

        runInBackground(...newAssignmentSideEffects);
      } catch (err) {
        console.error('Error creating new assignments:', err);
        usersNeedingClient.forEach((u) => {
          results.errors.push({
            userId: u.id,
            error: 'Failed to create assignment',
          });
        });
      }
    }

    // Update existing client records (reassignments)
    for (const user of usersNeedingReassignment) {
      try {
        await prisma.client.update({
          where: { id: user.client!.id },
          data: {
            assignedRMId: rmId,
            assignedAt: new Date(),
          },
        });

        results.reassignments++;

        runInBackground(
          prisma.auditLog.create({
            data: {
              userId: admin.id,
              action: 'CLIENT_REASSIGN',
              entityType: 'Client',
              entityId: user.client!.id,
              description: `Admin bulk reassigned client ${user.firstName} ${user.lastName} to RM ${rm.user.firstName} ${rm.user.lastName}${reason ? `: ${reason}` : ''}`,
              metadata: {
                bulkOperation: true,
                clientUserId: user.id,
                previousRMId: user.client!.assignedRMId,
                newRMId: rmId,
                reason: reason || undefined,
              },
            },
          }),
          prisma.notification.create({
            data: {
              userId: user.id,
              type: 'INFO',
              category: 'ASSIGNMENT',
              title: 'Relationship Manager Changed',
              message: `Your relationship manager has been changed to ${rm.user.firstName} ${rm.user.lastName}.`,
              metadata: {
                bulkOperation: true,
                rmId: rmId,
                rmName: `${rm.user.firstName} ${rm.user.lastName}`,
                reason: reason || undefined,
              },
            },
          })
        );
      } catch (err) {
        console.error(`Error reassigning user ${user.id}:`, err);
        results.errors.push({
          userId: user.id,
          error: 'Failed to update assignment',
        });
      }
    }

    // Single notification to RM about bulk reassignment
    if (usersNeedingReassignment.length > 0) {
      runInBackground(
        prisma.notification.create({
          data: {
            userId: rm.userId,
            type: 'INFO',
            category: 'ASSIGNMENT',
            title: 'Bulk Client Reassignment',
            message: `${usersNeedingReassignment.length} client(s) have been reassigned to you.`,
            metadata: {
              bulkOperation: true,
              clientCount: usersNeedingReassignment.length,
              clientNames: usersNeedingReassignment.map((u) => `${u.firstName} ${u.lastName}`),
            },
          },
        })
      );
    }

    const totalProcessed = results.newAssignments + results.reassignments;
    const message = `Bulk assignment completed: ${results.newAssignments} new assignment(s), ${results.reassignments} reassignment(s)${results.skipped > 0 ? `, ${results.skipped} skipped (already assigned)` : ''}${results.errors.length > 0 ? `, ${results.errors.length} error(s)` : ''}`;

    return NextResponse.json({
      success: results.errors.length === 0 || totalProcessed > 0,
      data: results,
      message,
    });
  } catch (error) {
    console.error('Error performing bulk assignment:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk assignment' },
      { status: 500 }
    );
  }
}
