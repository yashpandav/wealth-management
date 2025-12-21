/**
 * RM Product Purchase Request Detail API
 * GET: Get a single product purchase request
 * PATCH: Update product purchase request (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { RequestStatus } from '@prisma/client';
import { sendEmail } from '@/lib/email';

// Validation schema for updating a product purchase request
const updateProductRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rmNotes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  rejectionReason: z.string().max(1000, 'Rejection reason must be less than 1000 characters').optional(),
});

/**
 * GET /api/rm/product-requests/[id]
 * Get a single product purchase request details
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
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            currency: true,
            minAmount: true,
            maxAmount: true,
          },
        },
        productOption: {
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
      return NextResponse.json({ success: false, error: 'Product request not found' }, { status: 404 });
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
      productId: productRequest.productId,
      product: {
        id: productRequest.product.id,
        name: productRequest.product.name,
        description: productRequest.product.description,
        currency: productRequest.product.currency,
        minAmount: Number(productRequest.product.minAmount),
        maxAmount: productRequest.product.maxAmount ? Number(productRequest.product.maxAmount) : null,
      },
      productOption: {
        id: productRequest.productOption.id,
        duration: productRequest.productOption.duration,
        withdrawalFrequency: productRequest.productOption.withdrawalFrequency,
        roi: Number(productRequest.productOption.roi),
        annualReturn: Number(productRequest.productOption.annualReturn),
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
    console.error('Error fetching product purchase request:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch product purchase request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rm/product-requests/[id]
 * Approve or reject a product purchase request
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
        product: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        productOption: {
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
      return NextResponse.json({ success: false, error: 'Product request not found' }, { status: 404 });
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
    const productName = productRequest.product.name;
    const currency = productRequest.product.currency;
    const amount = Number(productRequest.amount);

    // Create in-app notification for client
    await prisma.notification.create({
      data: {
        userId: clientUserId,
        type: action === 'APPROVE' ? 'SUCCESS' : 'WARNING',
        category: 'REQUEST',
        title: action === 'APPROVE' ? 'Product Request Approved' : 'Product Request Rejected',
        message: action === 'APPROVE'
          ? `Your product purchase request for ${productName} - ${currency} ${amount.toLocaleString()} has been approved.`
          : `Your product purchase request for ${productName} - ${currency} ${amount.toLocaleString()} has been rejected.`,
        isRead: false,
        actionUrl: '/client/product-requests',
        actionText: 'View Details',
        entityType: 'ProductPurchaseRequest',
        entityId: productRequest.id,
        priority: 'HIGH',
        metadata: {
          trackingNumber: productRequest.trackingNumber,
          productName,
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
          <title>Product Request ${statusText}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Product Request ${statusText}</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${clientName},</h2>

            <p style="font-size: 16px; color: #4b5563;">
              Your product purchase request has been ${statusText.toLowerCase()} by your Relationship Manager.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Tracking Number:</strong> ${productRequest.trackingNumber}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Product:</strong> ${productName}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString()}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Duration:</strong> ${productRequest.productOption.duration}
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
      subject: `Product Request ${statusText} - ${productRequest.trackingNumber}`,
      html: emailHtml,
      text: `Hi ${clientName}, Your product purchase request for ${productName} - ${currency} ${amount.toLocaleString()} has been ${statusText.toLowerCase()}.${action === 'REJECT' && rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
    }).catch((err) => {
      console.error('Failed to send client notification email:', err);
    });

    return NextResponse.json({
      success: true,
      message: `Product purchase request ${statusText.toLowerCase()} successfully`,
      data: {
        id: updatedRequest.id,
        trackingNumber: updatedRequest.trackingNumber,
        status: updatedRequest.status,
      },
    });
  } catch (error: unknown) {
    console.error('Error updating product purchase request:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to update product purchase request' },
      { status: 500 }
    );
  }
}
