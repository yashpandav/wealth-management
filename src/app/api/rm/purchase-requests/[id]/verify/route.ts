/**
 * RM Purchase Request Verification API
 * POST /api/rm/purchase-requests/[id]/verify
 * Update purchase request with verification information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { RequestStatus, AuditAction } from '@prisma/client';
import {
  sendPurchaseRequestApprovedEmail,
  sendPurchaseRequestRejectedEmail,
} from '@/lib/email/email.service';

interface RouteContext {
  params: {
    id: string;
  };
}

interface VerificationData {
  bankStatementRef?: string;
  paymentProof?: string;
  rmNotes?: string;
  verificationChecks?: {
    amountMatch: boolean;
    accountVerified: boolean;
    dateValid: boolean;
  };
  updateStatus?: RequestStatus;
}

/**
 * POST - Update verification information for a purchase request
 * Only accessible to RMs for their assigned clients' requests
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
    const data: VerificationData = await request.json();

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get RM's assigned client IDs for authorization
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      include: {
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

    // Fetch existing purchase request
    const existingRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        status: true,
      },
    });

    // Check if request exists
    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Authorization check - ensure request is for RM's assigned client
    if (!clientIds.includes(existingRequest.clientId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only verify requests from your assigned clients' },
        { status: 403 }
      );
    }

    // Business rule: Can only verify pending or processing requests
    if (existingRequest.status === RequestStatus.APPROVED ||
        existingRequest.status === RequestStatus.COMPLETED ||
        existingRequest.status === RequestStatus.REJECTED ||
        existingRequest.status === RequestStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, error: `Cannot verify request with status: ${existingRequest.status}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      bankStatementRef?: string;
      paymentProof?: string;
      rmNotes?: string;
      status?: RequestStatus;
      processedById?: string;
      processedAt?: Date;
    } = {};

    // Only update fields that are provided
    if (data.bankStatementRef !== undefined) {
      updateData.bankStatementRef = data.bankStatementRef;
    }

    if (data.paymentProof !== undefined) {
      updateData.paymentProof = data.paymentProof;
    }

    if (data.rmNotes !== undefined) {
      updateData.rmNotes = data.rmNotes;
    }

    // If updating status to PROCESSING, set processedBy and processedAt
    if (data.updateStatus) {
      updateData.status = data.updateStatus;

      if (data.updateStatus === RequestStatus.PROCESSING && !existingRequest.status) {
        updateData.processedById = rm.id;
        updateData.processedAt = new Date();
      }
    }

    // Update purchase request
    const updatedRequest = await prisma.purchaseRequest.update({
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
        instrument: {
          select: {
            symbol: true,
            name: true,
            currency: true,
          },
        },
      },
    });

    // Send email notification if status was updated to APPROVED or REJECTED
    let emailSent = false;
    if (data.updateStatus === RequestStatus.APPROVED) {
      emailSent = await sendPurchaseRequestApprovedEmail(
        updatedRequest.client.user.email,
        updatedRequest.client.user.firstName,
        updatedRequest.trackingNumber,
        updatedRequest.instrument.name,
        updatedRequest.instrument.symbol,
        Number(updatedRequest.amount),
        updatedRequest.instrument.currency
      );
    } else if (data.updateStatus === RequestStatus.REJECTED) {
      emailSent = await sendPurchaseRequestRejectedEmail(
        updatedRequest.client.user.email,
        updatedRequest.client.user.firstName,
        updatedRequest.trackingNumber,
        updatedRequest.instrument.name,
        updatedRequest.instrument.symbol,
        Number(updatedRequest.amount),
        updatedRequest.instrument.currency,
        updateData.rmNotes
      );
    }

    // Create audit log for approval/rejection actions
    if (data.updateStatus === RequestStatus.APPROVED || data.updateStatus === RequestStatus.REJECTED) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: data.updateStatus === RequestStatus.APPROVED
            ? AuditAction.PURCHASE_REQUEST_APPROVE
            : AuditAction.PURCHASE_REQUEST_REJECT,
          entityType: 'PurchaseRequest',
          entityId: updatedRequest.id,
          description: data.updateStatus === RequestStatus.APPROVED
            ? `Purchase request ${updatedRequest.trackingNumber} approved`
            : `Purchase request ${updatedRequest.trackingNumber} rejected`,
          metadata: {
            trackingNumber: updatedRequest.trackingNumber,
            clientId: updatedRequest.clientId,
            clientName: `${updatedRequest.client.user.firstName} ${updatedRequest.client.user.lastName}`,
            instrumentSymbol: updatedRequest.instrument.symbol,
            instrumentName: updatedRequest.instrument.name,
            amount: Number(updatedRequest.amount),
            currency: updatedRequest.instrument.currency,
            rmNotes: updateData.rmNotes,
            bankStatementRef: updateData.bankStatementRef,
            paymentProof: updateData.paymentProof,
            emailNotificationSent: emailSent,
          },
          ipAddress: request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    }

    // Serialize Decimal fields
    const serializedRequest = {
      ...updatedRequest,
      amount: Number(updatedRequest.amount),
      quantity: updatedRequest.quantity ? Number(updatedRequest.quantity) : null,
      requestedPrice: updatedRequest.requestedPrice ? Number(updatedRequest.requestedPrice) : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        request: serializedRequest,
        message: 'Verification information updated successfully',
        emailSent: data.updateStatus === RequestStatus.APPROVED || data.updateStatus === RequestStatus.REJECTED ? emailSent : undefined,
      },
    });
  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update verification information' },
      { status: 500 }
    );
  }
}
