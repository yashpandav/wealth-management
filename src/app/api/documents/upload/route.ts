/**
 * Document Upload API
 * POST /api/documents/upload
 *
 * Handles document uploads for KYC verification
 * - Validates file type (JPG, PNG, PDF)
 * - Validates file size (max 5MB)
 * - Sanitizes filenames
 * - Stores files in /public/documents/{userId}/{timestamp}-{documentType}.ext
 * - Saves document metadata in DB
 * - Updates client verification status to PENDING
 * - Triggers email notification to DocAdmin
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { sendDocumentUploadNotification } from '@/lib/email';
import { config } from '@/lib/config';
import {
  documentUploadSchema,
  isValidMimeType,
  isValidFileSize,
  sanitizeFilename,
  generateStorageFilename,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  formatFileSize,
} from '@/lib/validation/document.validation';

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

    // Only clients can upload documents
    if (user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only clients can upload documents' },
        { status: 403 }
      );
    }

    // Get the client record
    const client = await prisma.client.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client profile not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;
    const description = formData.get('description') as string | null;
    const expiryDate = formData.get('expiryDate') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { success: false, error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Validate document metadata
    const validationResult = documentUploadSchema.safeParse({
      documentType,
      description: description || undefined,
      expiryDate: expiryDate || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid document metadata',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds limit. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`,
        },
        { status: 400 }
      );
    }

    // Sanitize and generate filename
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const storageFilename = generateStorageFilename(
      user.id,
      validationResult.data.documentType,
      sanitizedOriginalName
    );

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'documents', user.id);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, storageFilename);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // Relative path for storage in DB (accessible via URL)
    const relativePath = `/documents/${user.id}/${storageFilename}`;

    // Check if a document of the same type already exists for this client
    const existingDocument = await prisma.document.findFirst({
      where: {
        clientId: client.id,
        documentType: validationResult.data.documentType,
      },
    });

    let document;
    if (existingDocument) {
      // Update existing document instead of creating a new one
      document = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          filePath: relativePath,
          fileName: sanitizedOriginalName,
          fileSize: file.size,
          mimeType: file.type,
          description: validationResult.data.description,
          expiryDate: validationResult.data.expiryDate
            ? new Date(validationResult.data.expiryDate)
            : null,
          verificationStatus: 'PENDING',
          // Reset verification fields
          verifiedById: null,
          verifiedAt: null,
          rejectionReason: null,
          // Update upload timestamp
          uploadedAt: new Date(),
        },
      });
    } else {
      // Create new document record in database
      document = await prisma.document.create({
        data: {
          clientId: client.id,
          documentType: validationResult.data.documentType,
          filePath: relativePath,
          fileName: sanitizedOriginalName,
          fileSize: file.size,
          mimeType: file.type,
          description: validationResult.data.description,
          expiryDate: validationResult.data.expiryDate
            ? new Date(validationResult.data.expiryDate)
            : null,
          verificationStatus: 'PENDING',
        },
      });
    }

    // Update client verification status to PENDING if not already verified
    if (client.verificationStatus === 'NOT_SUBMITTED') {
      await prisma.client.update({
        where: { id: client.id },
        data: { verificationStatus: 'PENDING' },
      });
    }

    // Create audit log
    if (config.features.auditLog) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DOCUMENT_UPLOAD',
          entityType: 'Document',
          entityId: document.id,
          description: existingDocument
            ? `Document re-uploaded: ${validationResult.data.documentType}`
            : `Document uploaded: ${validationResult.data.documentType}`,
          metadata: {
            documentType: validationResult.data.documentType,
            fileName: sanitizedOriginalName,
            fileSize: file.size,
            mimeType: file.type,
            isReupload: !!existingDocument,
          },
          ipAddress:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            '',
          userAgent: request.headers.get('user-agent') || '',
        },
      });
    }

    // Send notification to DocAdmin(s) asynchronously
    notifyDocAdmins(
      client.user.firstName,
      client.user.lastName,
      client.user.email,
      validationResult.data.documentType,
      document.id
    );

    return NextResponse.json(
      {
        success: true,
        message: existingDocument
          ? 'Document updated successfully'
          : 'Document uploaded successfully',
        document: {
          id: document.id,
          documentType: document.documentType,
          fileName: document.fileName,
          fileSize: document.fileSize,
          verificationStatus: document.verificationStatus,
          uploadedAt: document.uploadedAt,
        },
      },
      { status: existingDocument ? 200 : 201 }
    );
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while uploading the document. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * Notify all DocAdmins about new document upload
 * Runs asynchronously to not block the response
 */
async function notifyDocAdmins(
  clientFirstName: string,
  clientLastName: string,
  clientEmail: string,
  documentType: string,
  documentId: string
): Promise<void> {
  try {
    // Find all active DocAdmins and Admins
    const docAdmins = await prisma.user.findMany({
      where: {
        role: { in: ['DOCADMIN', 'ADMIN'] },
        status: 'ACTIVE',
        isActive: true,
      },
      select: {
        email: true,
        firstName: true,
      },
    });

    // Send email to each DocAdmin
    const emailPromises = docAdmins.map((admin) =>
      sendDocumentUploadNotification(
        admin.email,
        admin.firstName,
        `${clientFirstName} ${clientLastName}`,
        clientEmail,
        documentType,
        documentId
      ).catch((err) => {
        console.error(`Failed to send notification to ${admin.email}:`, err);
      })
    );

    await Promise.allSettled(emailPromises);
  } catch (error) {
    console.error('Failed to notify DocAdmins:', error);
  }
}

// Configure route segment to allow larger request bodies
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
