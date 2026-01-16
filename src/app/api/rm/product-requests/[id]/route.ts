/**
 * RM Product Investment Request Detail API
 * GET: Get a single product investment request
 * PATCH: Update product investment request (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { RequestStatus } from '@prisma/client';
import { sendEmail, sendDocAdminContractUploadRequiredEmail } from '@/lib/email';

// Validation schema for updating a product purchase request
const updateProductRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rmNotes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  rejectionReason: z.string().max(1000, 'Rejection reason must be less than 1000 characters').optional(),
});

/**
 * GET /api/rm/product-requests/[id]
 * Get a single product investment request details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'RM') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get RM record
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      include: {
        assignedClients: {
          select: { id: true },
        },
      },
    });

    if (!rm) {
      return NextResponse.json({ success: false, error: 'RM record not found' }, { status: 404 });
    }

    const clientIds = rm.assignedClients.map((c) => c.id);

    // Get the product purchase request
    const productRequest = await prisma.productPurchaseRequest.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        investment: {
          select: {
            id: true,
            name: true,
            description: true,
            currency: true,
            minAmount: true,
            maxAmount: true,
          },
        },
        investmentOption: {
          select: {
            id: true,
            duration: true,
            withdrawalFrequency: true,
            roi: true,
            annualReturn: true,
          },
        },
      },
    });

    if (!productRequest) {
      return NextResponse.json({ success: false, error: 'Investment request not found' }, { status: 404 });
    }

    // Verify the request belongs to one of RM's clients
    if (!clientIds.includes(productRequest.clientId)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Serialize Decimal fields
    const serializedRequest = {
      id: productRequest.id,
      trackingNumber: productRequest.trackingNumber,
      clientId: productRequest.clientId,
      client: {
        id: productRequest.client.id,
        firstName: productRequest.client.user.firstName,
        lastName: productRequest.client.user.lastName,
        email: productRequest.client.user.email,
        phone: productRequest.client.user.phone,
      },
      investmentId: productRequest.investmentId,
      investment: {
        id: productRequest.investment.id,
        name: productRequest.investment.name,
        description: productRequest.investment.description,
        currency: productRequest.investment.currency,
        minAmount: Number(productRequest.investment.minAmount),
        maxAmount: productRequest.investment.maxAmount ? Number(productRequest.investment.maxAmount) : null,
      },
      investmentOption: {
        id: productRequest.investmentOption.id,
        duration: productRequest.investmentOption.duration,
        withdrawalFrequency: productRequest.investmentOption.withdrawalFrequency,
        roi: Number(productRequest.investmentOption.roi),
        annualReturn: Number(productRequest.investmentOption.annualReturn),
      },
      amount: Number(productRequest.amount),
      status: productRequest.status,
      clientNotes: productRequest.clientNotes,
      rmNotes: productRequest.rmNotes,
      rejectionReason: productRequest.rejectionReason,
      createdAt: productRequest.createdAt.toISOString(),
      updatedAt: productRequest.updatedAt.toISOString(),
      processedAt: productRequest.processedAt?.toISOString() || null,
    };

    return NextResponse.json({
      success: true,
      data: { request: serializedRequest },
    });
  } catch (error: unknown) {
    console.error('Error fetching investment request:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch investment request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rm/product-requests/[id]
 * Approve or reject a product investment request
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'RM') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get RM record
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      include: {
        assignedClients: {
          select: { id: true },
        },
      },
    });

    if (!rm) {
      return NextResponse.json({ success: false, error: 'RM record not found' }, { status: 404 });
    }

    const clientIds = rm.assignedClients.map((c) => c.id);

    // Get the product purchase request
    const productRequest = await prisma.productPurchaseRequest.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        investment: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        investmentOption: {
          select: {
            duration: true,
            withdrawalFrequency: true,
            roi: true,
            annualReturn: true,
          },
        },
      },
    });

    if (!productRequest) {
      return NextResponse.json({ success: false, error: 'Investment request not found' }, { status: 404 });
    }

    // Verify the request belongs to one of RM's clients
    if (!clientIds.includes(productRequest.clientId)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Check if request is still pending
    if (productRequest.status !== RequestStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProductRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { action, rmNotes, rejectionReason } = validationResult.data;

    // Require rejection reason for rejections
    if (action === 'REJECT' && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const newStatus = action === 'APPROVE' ? RequestStatus.APPROVED : RequestStatus.REJECTED;

    // Update the request
    const updatedRequest = await prisma.productPurchaseRequest.update({
      where: { id },
      data: {
        status: newStatus,
        rmNotes: rmNotes || null,
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
        processedAt: new Date(),
      },
    });

    // Get client details for notification
    const clientUserId = productRequest.client.user.id;
    const clientEmail = productRequest.client.user.email;
    const clientName = `${productRequest.client.user.firstName} ${productRequest.client.user.lastName}`;
    const investmentName = productRequest.investment.name;
    const currency = productRequest.investment.currency;
    const amount = Number(productRequest.amount);

    // Create in-app notification for client
    await prisma.notification.create({
      data: {
        userId: clientUserId,
        type: action === 'APPROVE' ? 'SUCCESS' : 'WARNING',
        category: 'REQUEST',
        title: action === 'APPROVE' ? 'Investment Request Approved' : 'Investment Request Rejected',
        message: action === 'APPROVE'
          ? `Your investment request for ${investmentName} - ${currency} ${amount.toLocaleString()} has been approved.`
          : `Your investment request for ${investmentName} - ${currency} ${amount.toLocaleString()} has been rejected.`,
        isRead: false,
        actionUrl: '/client/product-requests',
        actionText: 'View Details',
        entityType: 'ProductPurchaseRequest',
        entityId: productRequest.id,
        priority: 'HIGH',
        metadata: {
          trackingNumber: productRequest.trackingNumber,
          investmentName,
          amount,
          currency,
          status: newStatus,
          rejectionReason: action === 'REJECT' ? rejectionReason : null,
        },
      },
    });

    // Send email notification to client
    const statusText = action === 'APPROVE' ? 'Approved' : 'Rejected';
    const statusColor = action === 'APPROVE' ? '#10b981' : '#ef4444';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Investment Request ${statusText}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Investment Request ${statusText}</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${clientName},</h2>

            <p style="font-size: 16px; color: #4b5563;">
              Your investment request has been ${statusText.toLowerCase()} by your Relationship Manager.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Tracking Number:</strong> ${productRequest.trackingNumber}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Investment:</strong> ${investmentName}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString()}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Duration:</strong> ${productRequest.investmentOption.duration}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
              </p>
              ${action === 'REJECT' && rejectionReason ? `
              <p style="margin: 15px 0 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Reason:</strong> ${rejectionReason}
              </p>
              ` : ''}
              ${rmNotes ? `
              <p style="margin: 15px 0 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Notes:</strong> ${rmNotes}
              </p>
              ` : ''}
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              Please log in to your dashboard to view the details.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email (non-blocking)
    sendEmail({
      to: clientEmail,
      subject: `Investment Request ${statusText} - ${productRequest.trackingNumber}`,
      html: emailHtml,
      text: `Hi ${clientName}, Your investment request for ${investmentName} - ${currency} ${amount.toLocaleString()} has been ${statusText.toLowerCase()}.${action === 'REJECT' && rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
    }).catch((err) => {
      console.error('Failed to send client notification email:', err);
    });

    // Create audit log for approval/rejection
    const auditAction = action === 'APPROVE' ? 'PURCHASE_REQUEST_APPROVE' : 'PURCHASE_REQUEST_REJECT';
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: auditAction,
        entityType: 'ProductPurchaseRequest',
        entityId: productRequest.id,
        description: `RM ${action === 'APPROVE' ? 'approved' : 'rejected'} investment request ${productRequest.trackingNumber} for client ${clientName}`,
        metadata: {
          trackingNumber: productRequest.trackingNumber,
          clientId: productRequest.clientId,
          clientName,
          clientEmail,
          investmentId: productRequest.investmentId,
          investmentName,
          investmentOptionId: productRequest.investmentOptionId,
          amount,
          currency,
          duration: productRequest.investmentOption.duration,
          roi: Number(productRequest.investmentOption.roi),
          annualReturn: Number(productRequest.investmentOption.annualReturn),
          rmId: rm.id,
          rmUserId: session.user.id,
          rmName: `${session.user.firstName} ${session.user.lastName}`,
          rmEmail: session.user.email,
          previousStatus: 'PENDING',
          newStatus: newStatus,
          rmNotes: rmNotes || null,
          rejectionReason: action === 'REJECT' ? rejectionReason : null,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: action === 'APPROVE' ? 'INFO' : 'WARNING',
        success: true,
      },
    }).catch((err) => {
      console.error('Failed to create audit log:', err);
      // Don't fail the request if audit log creation fails
    });

    // If approved, notify all DocAdmins for contract upload
    if (action === 'APPROVE') {
      const docAdmins = await prisma.user.findMany({
        where: {
          role: { in: ['DOCADMIN', 'ADMIN'] },
          status: 'ACTIVE',
          isActive: true
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      // Create in-app notifications and send emails
      const promises = docAdmins.map(async (admin) => {
        // 1. Send Email
        await sendDocAdminContractUploadRequiredEmail(
          admin.email,
          `${admin.firstName} ${admin.lastName}`,
          clientName,
          investmentName,
          productRequest.trackingNumber,
          amount,
          currency
        ).catch(err => console.error('Failed to send DocAdmin notification email:', err));

        // 2. Create In-App Notification
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'INFO',
            category: 'REQUEST',
            title: 'Contract Upload Required',
            message: `Investment request for ${clientName} (${investmentName}) has been approved and requires contract upload.`,
            isRead: false,
            actionUrl: '/docadmin/contract-requests',
            actionText: 'Upload Contract',
            entityType: 'ProductPurchaseRequest',
            entityId: productRequest.id,
            priority: 'HIGH',
            metadata: {
              trackingNumber: productRequest.trackingNumber,
              clientName,
              investmentName,
              amount,
              currency
            }
          }
        }).catch(err => console.error(`Failed to create notification for admin ${admin.id}:`, err));
      });

      await Promise.allSettled(promises);
    }

    return NextResponse.json({
      success: true,
      message: `Investment request ${statusText.toLowerCase()} successfully`,
      data: {
        id: updatedRequest.id,
        trackingNumber: updatedRequest.trackingNumber,
        status: updatedRequest.status,
      },
    });
  } catch (error: unknown) {
    console.error('Error updating investment request:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to update investment request' },
      { status: 500 }
    );
  }
}
