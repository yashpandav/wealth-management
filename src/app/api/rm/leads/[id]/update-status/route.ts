/**
 * API Route: RM Update Lead Status
 * PATCH - Update the status of an assigned lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'LOST']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: leadId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    // Get RM record
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'RM profile not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateStatusSchema.safeParse(body);

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

    const { status } = validationResult.data;

    // Verify lead exists and is assigned to this RM
    const lead = await prisma.userLead.findFirst({
      where: {
        id: leadId,
        assignedRMId: rm.id,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Update lead status
    const updatedLead = await prisma.userLead.update({
      where: { id: leadId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: `Lead status updated to ${status}`,
      data: {
        lead: {
          id: updatedLead.id,
          status: updatedLead.status,
          updatedAt: updatedLead.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead status' },
      { status: 500 }
    );
  }
}
