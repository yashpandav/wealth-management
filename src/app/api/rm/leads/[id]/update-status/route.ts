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

/**
 * Handles PATCH requests to update the status of a lead assigned to the authenticated Relationship Manager.
 *
 * Validates the session and RM role, ensures the RM profile exists, validates the request body against the status schema,
 * verifies the lead is assigned to the RM, updates the lead's status, and returns the updated lead metadata.
 *
 * @param _request - The incoming NextRequest (body contains `{ status }`).
 * @param params - Route parameters promise resolving to an object with `id` (the lead id to update).
 * @returns A NextResponse with JSON:
 * - Success: `{ success: true, message: string, data: { lead: { id: string, status: string, updatedAt: string } } }`
 * - Error: `{ success: false, error: string, details?: any }`
 * Appropriate HTTP status codes are used for unauthorized (401), forbidden (403), not found (404), validation failure (400), and internal errors (500).
 */
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