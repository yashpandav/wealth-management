/**
 * DocAdmin Client RM Assignment API
 * PATCH: Assign a Relationship Manager to a verified client
 *
 * IMPORTANT: RM assignment is only allowed AFTER KYC verification is complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { config } from '@/lib/config';
import { runInBackground } from '@/lib/background';

const assignRmSchema = z.object({
  rmId: z.string().uuid('Invalid RM ID format'),
  notes: z.string().max(500).optional(),
});

/**
 * PATCH /api/docadmin/clients/[id]/assign-rm
 * Assign a Relationship Manager to a verified client (DocAdmin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require DocAdmin or Admin role
    const docAdmin = await requireRole('DOCADMIN');
    const { id: clientId } = await params;

    // Validate client ID
    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = assignRmSchema.safeParse(body);

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

    const { rmId, notes } = validationResult.data;

    // Fetch client and RM in parallel — both only need IDs from the validated body
    const [client, rm] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          userId: true,
          verificationStatus: true,
          assignedRMId: true,
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.relationshipManager.findUnique({
        where: { id: rmId },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
              isActive: true,
            },
          },
        },
      }),
    ]);

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Only allow RM assignment if KYC is VERIFIED
    if (client.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        {
          success: false,
          error: 'RM assignment is only allowed after KYC verification is complete',
          details: `Current verification status: ${client.verificationStatus}`,
        },
        { status: 400 }
      );
    }

    // Check if RM is already assigned
    if (client.assignedRMId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client already has an assigned RM. Use reassignment if needed.',
        },
        { status: 400 }
      );
    }

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

    // Update client with RM assignment
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        assignedRMId: rmId,
        assignedAt: new Date(),
      },
      select: {
        id: true,
        verificationStatus: true,
        assignedRMId: true,
        assignedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Fire-and-forget all side effects — audit log + both notifications
    // client.userId is fetched directly (no extra DB call needed)
    const sideEffects = [
      ...(config.features.auditLog ? [prisma.auditLog.create({
        data: {
          userId: docAdmin.id,
          action: 'CLIENT_ASSIGN',
          entityType: 'Client',
          entityId: clientId,
          description: `DocAdmin assigned RM ${rm.user.firstName} ${rm.user.lastName} to client ${client.user.firstName} ${client.user.lastName}`,
          metadata: {
            clientId,
            clientEmail: client.user.email,
            rmId,
            rmName: `${rm.user.firstName} ${rm.user.lastName}`,
            rmEmail: rm.user.email,
            notes: notes || null,
            assignedBy: docAdmin.email,
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })] : []),
      // Notify client — use client.userId directly (no extra DB round-trip)
      prisma.notification.create({
        data: {
          userId: client.userId,
          type: 'SUCCESS',
          category: 'ASSIGNMENT',
          title: 'Relationship Manager Assigned',
          message: `You have been assigned to relationship manager ${rm.user.firstName} ${rm.user.lastName}. They will be your primary point of contact.`,
          isRead: false,
          actionUrl: '/client/my-rm',
          actionText: 'View RM Details',
          entityType: 'Client',
          entityId: clientId,
          priority: 'HIGH',
          metadata: {
            rmId,
            rmName: `${rm.user.firstName} ${rm.user.lastName}`,
            rmEmail: rm.user.email,
            assignedBy: docAdmin.email,
            notes: notes || null,
          },
        },
      }),
      // Notify RM about new client assignment
      prisma.notification.create({
        data: {
          userId: rm.userId,
          type: 'INFO',
          category: 'ASSIGNMENT',
          title: 'New Client Assigned',
          message: `Client ${client.user.firstName} ${client.user.lastName} has been assigned to you. Please review their profile and reach out.`,
          isRead: false,
          actionUrl: '/rm/clients',
          actionText: 'View Client',
          entityType: 'Client',
          entityId: clientId,
          priority: 'HIGH',
          metadata: {
            clientId,
            clientName: `${client.user.firstName} ${client.user.lastName}`,
            clientEmail: client.user.email,
            verificationStatus: client.verificationStatus,
            assignedBy: docAdmin.email,
            notes: notes || null,
          },
        },
      }),
    ];

    runInBackground(...sideEffects);

    return NextResponse.json({
      success: true,
      message: `Client successfully assigned to ${rm.user.firstName} ${rm.user.lastName}`,
      data: {
        client: {
          id: updatedClient.id,
          name: `${updatedClient.user.firstName} ${updatedClient.user.lastName}`,
          email: updatedClient.user.email,
          verificationStatus: updatedClient.verificationStatus,
          assignedAt: updatedClient.assignedAt?.toISOString(),
        },
        assignedRM: {
          id: rm.id,
          userId: rm.user.id,
          name: `${rm.user.firstName} ${rm.user.lastName}`,
          email: rm.user.email,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error assigning RM to client:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: DocAdmin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to assign RM to client' },
      { status: 500 }
    );
  }
}
