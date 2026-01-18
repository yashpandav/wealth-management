/**
 * DocAdmin Complete Payout API
 * POST /api/docadmin/payouts/[id]/complete
 * Complete a payout by uploading receipt
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { completePayout } from '@/lib/services/payout.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: payoutId } = await params;

    // Verify authentication and role
    if (!session?.user || (session.user.role !== 'DOCADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Receipt file is required' },
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

    // Fetch the payout
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        productPurchaseRequest: {
          include: {
            investment: {
              select: {
                name: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      );
    }

    // Validate payout is PENDING
    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: `Payout has already been processed. Current status: ${payout.status}`,
        },
        { status: 400 }
      );
    }

    // Save receipt file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payout-receipts');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `payout_receipt_${payoutId}_${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);
    const publicPath = `/uploads/payout-receipts/${fileName}`;

    await writeFile(filePath, buffer);

    // Create receipt document
    const receiptDocument = await prisma.document.create({
      data: {
        clientId: payout.clientId,
        documentType: 'OTHER', // Using OTHER for payout receipts
        filePath: publicPath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        description: notes
          ? `Payout receipt for ${payout.productPurchaseRequest.investment.name} - Period: ${payout.periodStart.toLocaleDateString()} to ${payout.periodEnd.toLocaleDateString()}. Notes: ${notes}`
          : `Payout receipt for ${payout.productPurchaseRequest.investment.name} - Period: ${payout.periodStart.toLocaleDateString()} to ${payout.periodEnd.toLocaleDateString()}`,
        verificationStatus: 'VERIFIED', // Auto-verified since uploaded by DocAdmin
        verifiedById: session.user.id,
        verifiedAt: new Date(),
      },
    });

    // Create audit log for receipt upload
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PAYOUT_RECEIPT_UPLOADED',
          entityType: 'Document',
          entityId: receiptDocument.id,
          description: `Uploaded payout receipt for ${payout.client.user.firstName} ${payout.client.user.lastName} - ${payout.productPurchaseRequest.investment.name}`,
          metadata: {
            payoutId: payout.id,
            receiptDocumentId: receiptDocument.id,
            clientId: payout.clientId,
            clientName: `${payout.client.user.firstName} ${payout.client.user.lastName}`,
            clientEmail: payout.client.user.email,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            amount: payout.amount.toNumber(),
            periodStart: payout.periodStart.toISOString(),
            periodEnd: payout.periodEnd.toISOString(),
            investmentName: payout.productPurchaseRequest.investment.name,
            notes: notes || null,
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          severity: 'INFO',
          success: true,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log for receipt upload:', error);
      // Don't fail the request if audit log creation fails
    }

    // Complete the payout (creates transaction, updates payout, sends email)
    await completePayout(payoutId, receiptDocument.id, session.user.id);

    // Fetch updated payout
    const updatedPayout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        receiptDocument: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
            completedAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payout completed successfully',
      data: {
        payout: {
          id: updatedPayout!.id,
          status: updatedPayout!.status,
          processedAt: updatedPayout!.processedAt,
          receiptDocument: updatedPayout!.receiptDocument,
          transaction: updatedPayout!.transaction,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Complete payout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while completing the payout.',
      },
      { status: 500 }
    );
  }
}
