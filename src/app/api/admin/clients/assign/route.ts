/**
 * Admin Client Assignment API
 * Assign and reassign clients to relationship managers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { sanitizeObject } from '@/lib/security';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { runInBackground } from '@/lib/background';

const clientAssignmentSchema = z.object({
  userId: z.string().uuid(),
  rmId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/admin/clients/assign
 * Assign a client user to a relationship manager
 * Creates Client record if user has CLIENT role but no Client record yet
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);
    const validationResult = clientAssignmentSchema.safeParse(sanitizedBody);

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

    const { userId, rmId, reason } = validationResult.data;

    // Fetch user and RM in parallel
    const [user, rm] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          client: {
            select: {
              id: true,
              assignedRMId: true,
              assignedRM: {
                select: {
                  id: true,
                  userId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.relationshipManager.findUnique({
        where: { id: rmId },
        include: {
          user: {
            select: {
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
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { success: false, error: 'User is not a client' },
        { status: 400 }
      );
    }

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'Relationship Manager not found' },
        { status: 404 }
      );
    }

    // Check if RM is active
    if (!rm.user.isActive || rm.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Relationship Manager is not active' },
        { status: 400 }
      );
    }

    // Check RM capacity
    if (rm.maxClientLimit && rm._count.assignedClients >= rm.maxClientLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Relationship Manager has reached maximum client capacity (${rm.maxClientLimit})`,
        },
        { status: 400 }
      );
    }

    let client;
    let isReassignment = false;
    let previousRM = null;

    if (user.client) {
      // Client record exists - this is a reassignment
      isReassignment = true;
      previousRM = user.client.assignedRM;

      // Check if already assigned to this RM
      if (user.client.assignedRMId === rmId) {
        return NextResponse.json(
          { success: false, error: 'Client is already assigned to this RM' },
          { status: 400 }
        );
      }

      // Update assignment
      client = await prisma.client.update({
        where: { id: user.client.id },
        data: {
          assignedRMId: rmId,
          assignedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedRM: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    } else {
      // No Client record - create new assignment
      client = await prisma.client.create({
        data: {
          userId: userId,
          assignedRMId: rmId,
          assignedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedRM: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    }

    // Audit log + notifications are non-critical side-effects
    const sideEffects: Promise<unknown>[] = [
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: isReassignment ? 'CLIENT_REASSIGN' : 'CLIENT_ASSIGN',
          entityType: 'Client',
          entityId: client.id,
          description: isReassignment
            ? `Admin reassigned client ${user.firstName} ${user.lastName} from RM ${previousRM?.user.firstName} ${previousRM?.user.lastName} to RM ${rm.user.firstName} ${rm.user.lastName}${reason ? `: ${reason}` : ''}`
            : `Admin assigned client ${user.firstName} ${user.lastName} to RM ${rm.user.firstName} ${rm.user.lastName}${reason ? `: ${reason}` : ''}`,
          metadata: {
            clientId: client.id,
            clientUserId: userId,
            newRMId: rmId,
            previousRMId: isReassignment ? previousRM?.id : null,
            reason: reason || undefined,
          },
        },
      }),
      // Notify client
      prisma.notification.create({
        data: {
          userId: userId,
          type: 'INFO',
          category: 'ASSIGNMENT',
          title: isReassignment ? 'Relationship Manager Changed' : 'Relationship Manager Assigned',
          message: isReassignment
            ? `Your relationship manager has been changed to ${rm.user.firstName} ${rm.user.lastName}.`
            : `You have been assigned to relationship manager ${rm.user.firstName} ${rm.user.lastName}.`,
          metadata: {
            rmId: rmId,
            rmName: `${rm.user.firstName} ${rm.user.lastName}`,
            reason: reason || undefined,
          },
        },
      }),
      // Notify new RM
      prisma.notification.create({
        data: {
          userId: rm.userId,
          type: 'INFO',
          category: 'ASSIGNMENT',
          title: 'New Client Assigned',
          message: `Client ${user.firstName} ${user.lastName} has been assigned to you.`,
          metadata: {
            clientId: client.id,
            clientUserId: userId,
            clientName: `${user.firstName} ${user.lastName}`,
          },
        },
      }),
    ];

    // Notify previous RM if reassignment
    if (isReassignment && previousRM) {
      sideEffects.push(
        prisma.notification.create({
          data: {
            userId: previousRM.userId,
            type: 'INFO',
            category: 'ASSIGNMENT',
            title: 'Client Reassigned',
            message: `Client ${user.firstName} ${user.lastName} has been reassigned to another relationship manager.`,
            metadata: {
              clientId: client.id,
              clientUserId: userId,
              clientName: `${user.firstName} ${user.lastName}`,
              newRMId: rmId,
              reason: reason || undefined,
            },
          },
        })
      );
    }

    runInBackground(...sideEffects);

    return NextResponse.json({
      success: true,
      data: client,
      message: isReassignment
        ? 'Client reassigned successfully'
        : 'Client assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning client:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to assign client' },
      { status: 500 }
    );
  }
}
