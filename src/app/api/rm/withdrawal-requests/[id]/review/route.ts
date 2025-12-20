/**
 * RM Withdrawal Request Review API
 * POST /api/rm/withdrawal-requests/[id]/review
 * Submit RM review and recommendation for withdrawal request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WithdrawalStatus, AuditAction } from '@prisma/client';
import {
  rmWithdrawalReviewSchema,
  type RmWithdrawalReviewInput,
} from '@/lib/validation/withdrawal-request.validation';
import {
  sendWithdrawalRequestRMApprovedEmail,
  sendWithdrawalRequestRejectedEmail,
} from '@/lib/email/email.service';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST - Submit RM review and recommendation
 * Updates status based on recommendation:
 * - APPROVE → RM_APPROVED (sent to admin for final approval)
 * - REJECT → RM_REJECTED (request ends, client notified)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Authorization check - RM only
    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = rmWithdrawalReviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid review data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data: RmWithdrawalReviewInput = validationResult.data;

    // Get RM's assigned client IDs for authorization
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedClients: {
          select: { id: true },
        },
      },
    });

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'Relationship Manager not found' },
        { status: 404 }
      );
    }

    const clientIds = rm.assignedClients.map((c) => c.id);

    // Fetch existing withdrawal request
    const existingRequest = await prisma.withdrawalRequest.findUnique({
      where: { id },
      select: {
        id: true,
        trackingNumber: true,
        clientId: true,
        status: true,
        amount: true,
      },
    });

    // Check if request exists
    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Authorization check - ensure request is for RM's assigned client
    if (!clientIds.includes(existingRequest.clientId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only review requests from your assigned clients' },
        { status: 403 }
      );
    }

    // Business rule: Can only review PENDING or RM_REVIEW requests
    if (
      existingRequest.status !== WithdrawalStatus.PENDING &&
      existingRequest.status !== WithdrawalStatus.RM_REVIEW
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot review request with status: ${existingRequest.status}`,
        },
        { status: 400 }
      );
    }

    // Prepare update data based on recommendation
    const now = new Date();
    const updateData = {
      processedByRMId: rm.id,
      rmProcessedAt: now,
      rmNotes: data.rmNotes,
      ...(data.recommendation === 'APPROVE'
        ? {
            status: WithdrawalStatus.RM_APPROVED,
            rmApproved: true,
          }
        : {
            status: WithdrawalStatus.RM_REJECTED,
            rmApproved: false,
            rejectionReason: data.rmNotes,
            rejectedBy: 'RM',
            rejectedAt: now,
          }),
    };

    // Update withdrawal request
    const updatedRequest = await prisma.withdrawalRequest.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Create audit log for RM review
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action:
          data.recommendation === 'APPROVE'
            ? AuditAction.WITHDRAWAL_REQUEST_RM_APPROVE
            : AuditAction.WITHDRAWAL_REQUEST_RM_REJECT,
        entityType: 'WithdrawalRequest',
        entityId: updatedRequest.id,
        description:
          data.recommendation === 'APPROVE'
            ? `Withdrawal request ${updatedRequest.trackingNumber} recommended for approval by RM`
            : `Withdrawal request ${updatedRequest.trackingNumber} rejected by RM`,
        metadata: {
          trackingNumber: updatedRequest.trackingNumber,
          clientId: updatedRequest.clientId,
          clientName: `${updatedRequest.client.user.firstName} ${updatedRequest.client.user.lastName}`,
          amount: Number(updatedRequest.amount),
          recommendation: data.recommendation,
          rmNotes: data.rmNotes,
          verificationStatus: data.verificationStatus,
        },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Send email notification to client
    if (data.recommendation === 'APPROVE') {
      const rmName = `${rm.user.firstName} ${rm.user.lastName}`;
      await sendWithdrawalRequestRMApprovedEmail(
        updatedRequest.client.user.email,
        updatedRequest.client.user.firstName,
        updatedRequest.trackingNumber,
        Number(updatedRequest.amount),
        'USD',
        rmName
      );
    } else {
      await sendWithdrawalRequestRejectedEmail(
        updatedRequest.client.user.email,
        updatedRequest.client.user.firstName,
        updatedRequest.trackingNumber,
        Number(updatedRequest.amount),
        'USD',
        'Relationship Manager',
        data.rmNotes
      );
    }

    // Serialize Decimal fields
    const serializedRequest = {
      ...updatedRequest,
      amount: Number(updatedRequest.amount),
    };

    return NextResponse.json({
      success: true,
      data: {
        request: serializedRequest,
        message:
          data.recommendation === 'APPROVE'
            ? 'Request recommended for approval and sent to admin'
            : 'Request rejected successfully',
      },
    });
  } catch (error) {
    console.error('Error submitting RM review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
