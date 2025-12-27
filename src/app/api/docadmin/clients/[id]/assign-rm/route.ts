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

const assignRmSchema = z.object({
  rmId: z.string().uuid('Invalid RM ID format'),
  notes: z.string().max(500).optional(),
});

/**
 * Assigns a Relationship Manager (RM) to a verified client; action is restricted to DocAdmin users.
 *
 * Validates the route `id` as the client identifier and the request body against the `assignRmSchema`
 * (requires `rmId` UUID, optional `notes`). Ensures the client exists and has verificationStatus `VERIFIED`,
 * that no RM is already assigned, and that the specified RM exists and is active. On success updates the client
 * record with `assignedRMId` and `assignedAt`, optionally creates an audit log when audit logging is enabled,
 * and returns the updated client and assigned RM details.
 *
 * @param request - The incoming NextRequest
 * @param params - An object containing route parameters; expects `id` (the client ID)
 * @returns JSON with `success`, a human-readable `message`, and `data` containing `client` (id, name, email, verificationStatus, assignedAt)
 *          and `assignedRM` (id, userId, name, email). On error returns an appropriate status and `success: false` with an `error` message.
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

    // Verify client exists and get current status
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        verificationStatus: true,
        assignedRMId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

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

    // Verify RM exists and is active
    const rm = await prisma.relationshipManager.findUnique({
      where: { id: rmId },
      include: {
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
    });

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

    // Create audit log
    if (config.features.auditLog) {
      await prisma.auditLog.create({
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
      });
    }

    // TODO: Send notification email to client about RM assignment
    // TODO: Send notification email to RM about new client

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