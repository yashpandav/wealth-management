/**
 * DocAdmin Contract Upload API
 * POST /api/docadmin/product-requests/[id]/upload-contract
 *
 * CRITICAL: This is the ONLY place where product request transactions are created
 *
 * Workflow:
 * 1. Validates product request is APPROVED
 * 2. Uploads contract document (INVESTMENT_AGREEMENT)
 * 3. Creates Transaction record
 * 4. Updates ProductPurchaseRequest status to COMPLETED
 * 5. Creates audit log
 * 6. Sends notification to client
 * 7. Generates payout schedules
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { config } from '@/lib/config';
import { sendContractUploadedEmail } from '@/lib/email';
import { generatePayoutSchedules } from '@/lib/services/payout.service';
import { addYears } from 'date-fns';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Only DocAdmin or Admin can upload contracts
    if (user.role !== 'DOCADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only DocAdmin or Admin can upload contracts' },
        { status: 403 }
      );
    }

    const requestId = params.id;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Contract file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF and images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Fetch the product request
    const productRequest = await prisma.productPurchaseRequest.findUnique({
      where: { id: requestId },
      include: {
        client: { include: { user: true } },
        investment: true,
        investmentOption: true,
      },
    });

    if (!productRequest) {
      return NextResponse.json(
        { success: false, error: 'Product request not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Validate request is APPROVED (RM approved, waiting for contract)
    if (productRequest.status !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot upload contract. Request must be APPROVED by RM first. Current status: ${productRequest.status}`,
        },
        { status: 400 }
      );
    }

    // Check if contract already uploaded
    if (productRequest.contractDocumentId) {
      return NextResponse.json(
        { success: false, error: 'Contract has already been uploaded for this request' },
        { status: 400 }
      );
    }

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'contracts');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `contract_${productRequest.trackingNumber}_${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);
    const publicPath = `/uploads/contracts/${fileName}`;

    await writeFile(filePath, buffer);

    const contractStartDate = productRequest.processedAt || new Date();
    const durationMatch = productRequest.investmentOption.duration.match(/(\d+)/);
    const durationYears = durationMatch ? parseInt(durationMatch[1]) : 1;
    const contractEndDate = addYears(contractStartDate, durationYears);

    const metadata = JSON.stringify({
      productRequestId: productRequest.id,
      trackingNumber: productRequest.trackingNumber,
      investmentId: productRequest.investmentId,
      productName: productRequest.investment.name,
      investmentOptionId: productRequest.investmentOptionId,
      duration: productRequest.investmentOption.duration,
      roi: productRequest.investmentOption.roi,
      annualReturn: productRequest.investmentOption.annualReturn,
      contractStartDate: contractStartDate.toISOString(),
      contractEndDate: contractEndDate.toISOString(),
      notes: notes || null,
    });

    const [contractDocument, transaction, updatedRequest] =
      await prisma.$transaction([
        prisma.document.create({
          data: {
            clientId: productRequest.clientId,
            documentType: 'INVESTMENT_AGREEMENT',
            filePath: publicPath,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            description: `Contract for ${productRequest.investment.name}`,
            verificationStatus: 'VERIFIED',
            verifiedById: user.id,
            verifiedAt: new Date(),
          },
        }),

        prisma.transaction.create({
          data: {
            clientId: productRequest.clientId,
            type: 'PURCHASE',
            amount: productRequest.amount,
            total: productRequest.amount,
            netAmount: productRequest.amount,
            status: 'COMPLETED',
            completedAt: new Date(),
            metadata,
          },
        }),

        prisma.productPurchaseRequest.update({
          where: { id: requestId },
          data: {
            status: 'COMPLETED',
            contractStartDate,
            completedAt: new Date(),
            completedBy: { connect: { id: user.id } },
          },
        }),
      ]);

    await prisma.productPurchaseRequest.update({
      where: { id: requestId },
      data: {
        contractDocument: { connect: { id: contractDocument.id } },
      },
    });

    const asyncTasks = [];

    if (config.features.auditLog) {
      asyncTasks.push(
        prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'TRANSACTION_CREATE',
            entityType: 'ProductPurchaseRequest',
            entityId: requestId,
            description: `Completed ${productRequest.trackingNumber}`,
          },
        })
      );
    }

    asyncTasks.push(
      prisma.notification.create({
        data: {
          userId: productRequest.client.user.id,
          type: 'SUCCESS',
          category: 'TRANSACTION',
          title: 'Plan Purchase Completed',
          message: `Your request (${productRequest.trackingNumber}) is complete.`,
        },
      })
    );

    await Promise.all(asyncTasks);

    generatePayoutSchedules(requestId).catch(console.error);

    sendContractUploadedEmail(
      productRequest.client.user.email,
      productRequest.client.user.firstName,
      productRequest.investment.name,
      productRequest.trackingNumber,
      `${process.env.NEXTAUTH_URL}/client/product-requests/${requestId}/contract`
    ).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Contract uploaded successfully',
      data: {
        productRequest: {
          id: updatedRequest.id,
          status: updatedRequest.status,
        },
        transaction: {
          id: transaction.id,
        },
        contract: {
          id: contractDocument.id,
        },
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}