/**
 * DocAdmin Lead RM Assignment API
 * PATCH: Assign a Relationship Manager to a lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { sendRMNewLeadAssignedEmail } from '@/lib/email';
import { runInBackground } from '@/lib/background';

const assignRmSchema = z.object({
  rmId: z.string().uuid('Invalid RM ID format'),
  notes: z.string().max(500).optional(),
});

/**
 * PATCH /api/docadmin/leads/[id]/assign-rm
 * Assign a Relationship Manager to a lead (DocAdmin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require DocAdmin role
    const docAdmin = await requireRole('DOCADMIN');
    const { id: leadId } = await params;

    // Validate lead ID
    if (!leadId || typeof leadId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
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

    // Fetch lead and RM in parallel — both only need IDs from the validated body
    const [lead, rm] = await Promise.all([
      prisma.userLead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          rmReference: true,
          status: true,
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

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
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

    // Update lead with RM assignment (actual FK) and RM reference (display name)
    const updatedLead = await prisma.userLead.update({
      where: { id: leadId },
      data: {
        assignedRMId: rmId, // Store actual RM ID for queries
        rmReference: `${rm.user.firstName} ${rm.user.lastName}`, // Store display name
        status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        leadSource: true,
        assignedRMId: true,
        rmReference: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Fire-and-forget all side effects — audit log, notification, email
    const rmName = `${rm.user.firstName} ${rm.user.lastName}`;
    const leadName = `${lead.firstName} ${lead.lastName}`;

    runInBackground(
      prisma.auditLog.create({
        data: {
          userId: docAdmin.id,
          action: 'CLIENT_ASSIGN',
          entityType: 'UserLead',
          entityId: leadId,
          description: `DocAdmin assigned RM ${rmName} to lead ${leadName}`,
          metadata: {
            leadId,
            leadEmail: lead.email,
            rmId,
            rmName,
            rmEmail: rm.user.email,
            previousRmReference: lead.rmReference,
            newRmReference: updatedLead.rmReference,
            notes: notes || null,
            assignedBy: docAdmin.email,
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      }),
      prisma.notification.create({
        data: {
          userId: rm.userId,
          type: 'INFO',
          category: 'ASSIGNMENT',
          title: 'New Lead Assigned',
          message: `New lead ${leadName} has been assigned to you. Please review and follow up.`,
          isRead: false,
          actionUrl: '/rm/leads',
          actionText: 'View Leads',
          entityType: 'UserLead',
          entityId: leadId,
          priority: 'HIGH',
          metadata: {
            leadId: lead.id,
            leadName,
            leadEmail: lead.email,
            leadPhone: lead.phoneNumber || 'N/A',
            leadStatus: updatedLead.status,
            assignedBy: docAdmin.email,
            notes: notes || null,
          },
        },
      }),
      sendRMNewLeadAssignedEmail(
        rm.user.email,
        rmName,
        leadName,
        lead.email,
        lead.phoneNumber || 'N/A'
      )
    );

    return NextResponse.json({
      success: true,
      message: `Lead successfully assigned to ${rm.user.firstName} ${rm.user.lastName}`,
      data: {
        lead: updatedLead,
        assignedRM: {
          id: rm.id,
          userId: rm.user.id,
          name: `${rm.user.firstName} ${rm.user.lastName}`,
          email: rm.user.email,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error assigning RM to lead:', error);

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
      { success: false, error: 'Failed to assign RM to lead' },
      { status: 500 }
    );
  }
}
