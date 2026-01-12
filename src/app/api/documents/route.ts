/**
 * Documents API
 * GET /api/documents
 *
 * Fetches all documents for the authenticated client
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Only clients can fetch their own documents
    if (user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only clients can access their documents' },
        { status: 403 }
      );
    }

    // Get the client record
    const client = await prisma.client.findFirst({
      where: { userId: user.id },
      select: { id: true, verificationStatus: true },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client profile not found' },
        { status: 404 }
      );
    }

    // Fetch only Identity Proof document for this client
    const identityProof = await prisma.document.findFirst({
      where: {
        clientId: client.id,
        documentType: 'IDENTITY_PROOF'
      },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        filePath: true,
        description: true,
        verificationStatus: true,
        uploadedAt: true,
        verifiedAt: true,
        rejectionReason: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        identityProof,
        kycStatus: client.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Fetch documents error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while fetching documents.',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
