/**
 * Document Verification API
 * POST /api/documents/verify
 *
 * Allows DocAdmin/Admin to verify or reject documents
 * - Updates Document.verificationStatus to VERIFIED or REJECTED
 * - Updates verifiedBy and verifiedAt
 * - Optionally assigns RM to client after verification
 * - Updates client verification status based on all documents
 * - Sends email notification to user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { sendDocumentVerificationResult } from '@/lib/email';
import { config } from '@/lib/config';
import { documentVerificationSchema } from '@/lib/validation/document.validation';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Only DocAdmin or Admin can verify documents
    if (user.role !== 'DOCADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only DocAdmin or Admin can verify documents' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = documentVerificationSchema.safeParse(body);

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

    const { documentId, action, rejectionReason } = validationResult.data;

    // Validate rejection reason is provided for rejections
    if (action === 'REJECT' && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required when rejecting a document' },
        { status: 400 }
      );
    }

    // Find the document with client and user info
    const document = await prisma.document.findUnique({
      where: { id: documentId },
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
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document is already verified or rejected
    if (document.verificationStatus === 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'Document has already been verified' },
        { status: 400 }
      );
    }

    // Determine new verification status
    const newStatus = action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';

    // Perform updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update document status
      const updatedDocument = await tx.document.update({
        where: { id: documentId },
        data: {
          verificationStatus: newStatus,
          verifiedById: user.id,
          verifiedAt: new Date(),
          rejectionReason: action === 'REJECT' ? rejectionReason : null,
        },
      });

      // Update client verification status based on mandatory documents
      const allClientDocs = await tx.document.findMany({
        where: { clientId: document.clientId },
        select: {
          documentType: true,
          verificationStatus: true
        },
      });

      // Define mandatory document types - ONLY Identity Proof is required now
      const MANDATORY_DOCUMENTS = ['IDENTITY_PROOF'] as const;

      // Determine overall client verification status
      let clientVerificationStatus: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' = 'PENDING';

      // Check if any document is rejected
      const hasRejected = allClientDocs.some((d) => d.verificationStatus === 'REJECTED');

      // Check if Identity Proof is verified
      const mandatoryDocs = allClientDocs.filter((d) =>
        MANDATORY_DOCUMENTS.includes(d.documentType as typeof MANDATORY_DOCUMENTS[number])
      );
      const allMandatoryVerified = MANDATORY_DOCUMENTS.every(mandatoryType =>
        mandatoryDocs.some(d =>
          d.documentType === mandatoryType && d.verificationStatus === 'VERIFIED'
        )
      );

      // Check if any document is pending or under review
      const hasPending = allClientDocs.some(
        (d) => d.verificationStatus === 'PENDING' || d.verificationStatus === 'UNDER_REVIEW'
      );

      if (hasRejected) {
        // If any document is rejected, status is REJECTED
        clientVerificationStatus = 'REJECTED';
      } else if (allMandatoryVerified) {
        // If both mandatory documents are verified, status is VERIFIED
        clientVerificationStatus = 'VERIFIED';
      } else if (hasPending) {
        // If mandatory docs not complete but some docs are pending/under review
        clientVerificationStatus = 'UNDER_REVIEW';
      }

      await tx.client.update({
        where: { id: document.clientId },
        data: { verificationStatus: clientVerificationStatus },
      });

      // Create audit log
      if (config.features.auditLog) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: action === 'VERIFY' ? 'DOCUMENT_VERIFY' : 'DOCUMENT_REJECT',
            entityType: 'Document',
            entityId: documentId,
            description: `Document ${action.toLowerCase()}ed: ${document.documentType}`,
            metadata: {
              documentType: document.documentType,
              clientId: document.clientId,
              clientEmail: document.client.user.email,
              rejectionReason: rejectionReason || null,
            },
            ipAddress:
              request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              '',
            userAgent: request.headers.get('user-agent') || '',
          },
        });

      }

      return {
        document: updatedDocument,
        clientVerificationStatus,
      };
    });

    // Send email notification to user (non-blocking)
    sendDocumentVerificationResult(
      document.client.user.email,
      document.client.user.firstName,
      document.documentType,
      action === 'VERIFY',
      rejectionReason
    ).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message: `Document ${action === 'VERIFY' ? 'verified' : 'rejected'} successfully`,
        document: {
          id: result.document.id,
          documentType: result.document.documentType,
          verificationStatus: result.document.verificationStatus,
          verifiedAt: result.document.verifiedAt,
        },
        clientVerificationStatus: result.clientVerificationStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Document verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during document verification. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/verify
 * Get list of documents pending verification
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Only DocAdmin or Admin can view pending documents
    if (user.role !== 'DOCADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only DocAdmin or Admin can view pending documents' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Validate status
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ALL'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    // Build where clause
    // Build where clause
    type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
    const whereClause: Prisma.DocumentWhereInput = status === 'ALL' ? {} : { verificationStatus: status as VerificationStatus };

    // Filter only Identity Proof documents
    whereClause.documentType = 'IDENTITY_PROOF';

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          client: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
              assignedRM: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          verifiedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where: whereClause }),
    ]);

    return NextResponse.json(
      {
        success: true,
        documents: documents.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          verificationStatus: doc.verificationStatus,
          uploadedAt: doc.uploadedAt,
          verifiedAt: doc.verifiedAt,
          rejectionReason: doc.rejectionReason,
          client: {
            id: doc.clientId,
            name: `${doc.client.user.firstName} ${doc.client.user.lastName}`,
            email: doc.client.user.email,
            assignedRM: doc.client.assignedRM
              ? `${doc.client.assignedRM.user.firstName} ${doc.client.assignedRM.user.lastName}`
              : null,
          },
          verifiedBy: doc.verifiedBy
            ? `${doc.verifiedBy.firstName} ${doc.verifiedBy.lastName}`
            : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while fetching documents.',
      },
      { status: 500 }
    );
  }
}
