/**
 * Client Product Purchase Requests API
 * POST: Submit a new product purchase request
 * GET: List client's product purchase requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { RequestStatus } from '@prisma/client';
import { sendEmail, sendProductRequestSubmittedEmail } from '@/lib/email';

// Validation schema for creating a product purchase request
const createProductPurchaseRequestSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  productOptionId: z.string().uuid('Invalid product option ID'),
  amount: z.number().positive('Amount must be positive'),
  clientNotes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

/**
 * Generate unique tracking number
 * Format: PPR-YYYYMMDD-XXXXXX (PPR = Product Purchase Request)
 */
function generateTrackingNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `PPR-${year}${month}${day}-${random}`;
}

/**
 * POST /api/client/product-requests
 * Submit a new product purchase request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get client record with assigned RM
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedRM: {
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

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client record not found' }, { status: 404 });
    }

    // Check if client has an assigned RM
    if (!client.assignedRM) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Relationship Manager assigned. Please contact support to get an RM assigned before requesting products.',
          code: 'NO_RM_ASSIGNED'
        },
        { status: 400 }
      );
    }

    // CRITICAL: Check if all mandatory KYC documents are verified
    const documents = await prisma.document.findMany({
      where: {
        clientId: client.id,
        documentType: {
          in: ['IDENTITY_PROOF', 'ADDRESS_PROOF'], // Mandatory documents
        },
      },
      select: {
        documentType: true,
        verificationStatus: true,
      },
    });

    // Check if both mandatory documents exist and are VERIFIED
    const identityProof = documents.find((d) => d.documentType === 'IDENTITY_PROOF');
    const addressProof = documents.find((d) => d.documentType === 'ADDRESS_PROOF');

    if (!identityProof || identityProof.verificationStatus !== 'VERIFIED') {
      const errorMessage = !identityProof
        ? 'Identity Proof document is required. Please upload your Identity Proof document.'
        : identityProof.verificationStatus === 'REJECTED'
        ? 'Your Identity Proof document was rejected. Please re-upload a valid Identity Proof document.'
        : identityProof.verificationStatus === 'PENDING' || identityProof.verificationStatus === 'UNDER_REVIEW'
        ? 'Your Identity Proof document is still being verified. Please wait for verification to complete.'
        : 'Identity Proof document must be verified before submitting product requests.';

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: 'IDENTITY_PROOF_NOT_VERIFIED',
        },
        { status: 400 }
      );
    }

    if (!addressProof || addressProof.verificationStatus !== 'VERIFIED') {
      const errorMessage = !addressProof
        ? 'Address Proof document is required. Please upload your Address Proof document.'
        : addressProof.verificationStatus === 'REJECTED'
        ? 'Your Address Proof document was rejected. Please re-upload a valid Address Proof document.'
        : addressProof.verificationStatus === 'PENDING' || addressProof.verificationStatus === 'UNDER_REVIEW'
        ? 'Your Address Proof document is still being verified. Please wait for verification to complete.'
        : 'Address Proof document must be verified before submitting product requests.';

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: 'ADDRESS_PROOF_NOT_VERIFIED',
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createProductPurchaseRequestSchema.safeParse(body);

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

    const data = validationResult.data;

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: data.productId, isActive: true },
      select: {
        id: true,
        name: true,
        minAmount: true,
        maxAmount: true,
        currency: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or not available' },
        { status: 404 }
      );
    }

    // Verify product option exists and belongs to the product
    const productOption = await prisma.productOption.findUnique({
      where: {
        id: data.productOptionId,
        productId: data.productId,
        isActive: true,
      },
      select: {
        id: true,
        duration: true,
        withdrawalFrequency: true,
        roi: true,
        annualReturn: true,
      },
    });

    if (!productOption) {
      return NextResponse.json(
        { success: false, error: 'Product option not found or not available' },
        { status: 404 }
      );
    }

    // Validate amount is within product's range
    const minAmount = Number(product.minAmount);
    const maxAmount = product.maxAmount ? Number(product.maxAmount) : null;

    if (data.amount < minAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Investment amount must be at least ${product.currency} ${minAmount.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    if (maxAmount && data.amount > maxAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Investment amount must not exceed ${product.currency} ${maxAmount.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Generate unique tracking number
    let trackingNumber: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      trackingNumber = generateTrackingNumber();

      const existing = await prisma.productPurchaseRequest.findUnique({
        where: { trackingNumber },
      });

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique tracking number. Please try again.' },
        { status: 500 }
      );
    }

    // Create product purchase request
    const purchaseRequest = await prisma.productPurchaseRequest.create({
      data: {
        trackingNumber: trackingNumber!,
        clientId: client.id,
        productId: data.productId,
        productOptionId: data.productOptionId,
        amount: data.amount,
        status: RequestStatus.PENDING,
        assignedRMId: client.assignedRM.id,
        clientNotes: data.clientNotes || null,
      },
      include: {
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

    // Send confirmation email to client
    sendProductRequestSubmittedEmail(
      client.user.email,
      client.user.firstName,
      purchaseRequest.trackingNumber!,
      product.name,
      data.amount,
      product.currency,
      productOption.duration,
      Number(productOption.roi)
    ).catch(err => console.error('Failed to send client confirmation email:', err));

    // Get RM user ID and details for notifications
    const rmUserId = client.assignedRM.userId;
    const rmEmail = client.assignedRM.user.email;
    const rmName = `${client.assignedRM.user.firstName} ${client.assignedRM.user.lastName}`;
    const clientName = `${client.user.firstName} ${client.user.lastName}`;

    // Create in-app notification for RM
    await prisma.notification.create({
      data: {
        userId: rmUserId,
        type: 'ALERT',
        category: 'REQUEST',
        title: 'New Product Purchase Request',
        message: `${clientName} has submitted a new product purchase request for ${product.name} - ${product.currency} ${data.amount.toLocaleString()}`,
        isRead: false,
        actionUrl: '/rm/product-requests',
        actionText: 'Review Request',
        entityType: 'ProductPurchaseRequest',
        entityId: purchaseRequest.id,
        priority: 'HIGH',
        metadata: {
          trackingNumber: purchaseRequest.trackingNumber,
          clientName,
          productName: product.name,
          amount: data.amount,
          currency: product.currency,
          duration: productOption.duration,
          withdrawalFrequency: productOption.withdrawalFrequency,
          roi: Number(productOption.roi),
          annualReturn: Number(productOption.annualReturn),
        },
      },
    });

    // Send email notification to RM

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Product Purchase Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Product Purchase Request</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${rmName},</h2>

            <p style="font-size: 16px; color: #4b5563;">
              A new product purchase request has been submitted by one of your clients and requires your review.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Client Name:</strong> ${clientName}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Tracking Number:</strong> ${purchaseRequest.trackingNumber}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Product:</strong> ${product.name}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Amount:</strong> ${product.currency} ${data.amount.toLocaleString()}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Duration:</strong> ${productOption.duration}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Withdrawal Frequency:</strong> ${productOption.withdrawalFrequency}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">ROI:</strong> ${Number(productOption.roi)}%
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #1f2937;">Annual Return:</strong> ${Number(productOption.annualReturn)}%
              </p>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              Please log in to your dashboard to review and process this request.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Hi ${rmName},

A new product purchase request has been submitted by one of your clients and requires your review.

Request Details:
- Client Name: ${clientName}
- Tracking Number: ${purchaseRequest.trackingNumber}
- Product: ${product.name}
- Amount: ${product.currency} ${data.amount.toLocaleString()}
- Duration: ${productOption.duration}
- Withdrawal Frequency: ${productOption.withdrawalFrequency}
- ROI: ${Number(productOption.roi)}%
- Annual Return: ${Number(productOption.annualReturn)}%

Please log in to your dashboard to review and process this request.

---
(c) ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
    `;

    // Send email (non-blocking)
    sendEmail({
      to: rmEmail,
      subject: `New Product Purchase Request - ${purchaseRequest.trackingNumber}`,
      html: emailHtml,
      text: emailText,
    }).catch((err) => {
      console.error('Failed to send RM notification email:', err);
    });

    // Create audit log for product request creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PURCHASE_REQUEST_CREATE',
        entityType: 'ProductPurchaseRequest',
        entityId: purchaseRequest.id,
        description: `Client ${clientName} submitted product purchase request for ${product.name} - ${product.currency} ${data.amount.toLocaleString()}`,
        metadata: {
          trackingNumber: purchaseRequest.trackingNumber,
          clientId: client.id,
          clientName,
          clientEmail: client.user.email,
          productId: data.productId,
          productName: product.name,
          productOptionId: data.productOptionId,
          amount: data.amount,
          currency: product.currency,
          duration: productOption.duration,
          roi: Number(productOption.roi),
          annualReturn: Number(productOption.annualReturn),
          assignedRMId: client.assignedRM.id,
          rmName,
          rmEmail,
          clientNotes: data.clientNotes || null,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'INFO',
        success: true,
      },
    }).catch((err) => {
      console.error('Failed to create audit log:', err);
      // Don't fail the request if audit log creation fails
    });

    return NextResponse.json({
      success: true,
      message: 'Product purchase request submitted successfully',
      data: {
        id: purchaseRequest.id,
        trackingNumber: purchaseRequest.trackingNumber,
        status: purchaseRequest.status,
        amount: Number(purchaseRequest.amount),
        product: {
          ...purchaseRequest.product,
        },
        productOption: {
          ...purchaseRequest.productOption,
          roi: Number(purchaseRequest.productOption.roi),
          annualReturn: Number(purchaseRequest.productOption.annualReturn),
        },
        createdAt: purchaseRequest.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error submitting product purchase request:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to submit product purchase request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/client/product-requests
 * List client's product purchase requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get Client ID from User ID
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Client profile not found',
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as RequestStatus | null;

    // Build where clause
    const where: Record<string, unknown> = {
      clientId: client.id,
      ...(status && { status }),
    };

    // Get total count
    const totalCount = await prisma.productPurchaseRequest.count({ where });

    // Get requests
    const requests = await prisma.productPurchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            currency: true,
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

    // Serialize Decimal fields
    const serializedRequests = requests.map((req) => ({
      id: req.id,
      trackingNumber: req.trackingNumber,
      amount: Number(req.amount),
      status: req.status,
      clientNotes: req.clientNotes,
      rmNotes: req.rmNotes,
      rejectionReason: req.rejectionReason,
      product: req.product,
      productOption: {
        ...req.productOption,
        roi: Number(req.productOption.roi),
        annualReturn: Number(req.productOption.annualReturn),
      },
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      processedAt: req.processedAt?.toISOString() || null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        requests: serializedRequests,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching product purchase requests:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch product purchase requests' },
      { status: 500 }
    );
  }
}
