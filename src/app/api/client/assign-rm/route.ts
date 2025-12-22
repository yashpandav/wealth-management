/**
 * Client RM Assignment API
 * POST /api/client/assign-rm
 *
 * Assigns a Relationship Manager to a client
 * Only available after all client documents are verified
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { config } from '@/lib/config';
import { z } from 'zod';

const assignRMSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  rmId: z.string().uuid('Invalid RM ID'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Only DocAdmin or Admin can assign RMs
    if (user.role !== 'DOCADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only DocAdmin or Admin can assign RMs' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = assignRMSchema.safeParse(body);

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

    const { clientId, rmId } = validationResult.data;

    // Find the client with their documents
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          select: {
            verificationStatus: true,
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

    // Check if client already has an RM
    if (client.assignedRMId) {
      return NextResponse.json(
        { success: false, error: 'Client already has an assigned Relationship Manager' },
        { status: 400 }
      );
    }

    // Check if all documents are verified
    const hasDocuments = client.documents.length > 0;
    const allVerified = client.documents.every(
      (doc) => doc.verificationStatus === 'VERIFIED'
    );

    if (!hasDocuments) {
      return NextResponse.json(
        { success: false, error: 'Client has no documents to verify' },
        { status: 400 }
      );
    }

    if (!allVerified) {
      return NextResponse.json(
        { success: false, error: 'All documents must be verified before assigning an RM' },
        { status: 400 }
      );
    }

    // Validate the RM exists and is active
    const rm = await prisma.relationshipManager.findUnique({
      where: { id: rmId },
      include: {
        user: {
          select: {
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
        { success: false, error: 'Selected Relationship Manager is not active' },
        { status: 400 }
      );
    }

    // Assign RM to client
    await prisma.client.update({
      where: { id: clientId },
      data: {
        assignedRMId: rmId,
        assignedAt: new Date(),
        verificationStatus: 'VERIFIED',
      },
    });

    // Create audit log
    if (config.features.auditLog) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CLIENT_ASSIGN',
          entityType: 'Client',
          entityId: clientId,
          description: `Client assigned to RM: ${rm.user.firstName} ${rm.user.lastName}`,
          metadata: {
            clientId,
            clientEmail: client.user.email,
            clientName: `${client.user.firstName} ${client.user.lastName}`,
            rmId,
            rmEmail: rm.user.email,
            rmName: `${rm.user.firstName} ${rm.user.lastName}`,
          },
          ipAddress:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            '',
          userAgent: request.headers.get('user-agent') || '',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Relationship Manager assigned successfully',
        data: {
          clientId,
          clientName: `${client.user.firstName} ${client.user.lastName}`,
          rmId,
          rmName: `${rm.user.firstName} ${rm.user.lastName}`,
          rmEmail: rm.user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('RM assignment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while assigning the Relationship Manager.',
      },
      { status: 500 }
    );
  }
}
