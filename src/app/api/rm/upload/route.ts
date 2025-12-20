/**
 * File Upload API for RMs
 * POST /api/rm/upload
 * Handles file uploads for bank statements and payment proofs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST - Upload file (bank statement or payment proof)
 * Only accessible to RMs
 *
 * In production, this would upload to S3, Azure Blob Storage, or similar
 * For development, we'll simulate by returning a file reference
 */
export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('type') as string; // 'bankStatement' or 'paymentProof'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only PDF and image files are allowed',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'File size exceeds 10MB limit',
        },
        { status: 400 }
      );
    }

    // In production, upload to cloud storage (S3, Azure, etc.)
    // For now, we'll create a simulated file reference
    // In a real implementation, you would:
    // 1. Generate a unique filename
    // 2. Upload to cloud storage
    // 3. Return the storage URL/reference

    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileReference = `${fileType}/${timestamp}_${sanitizedFilename}`;

    // In production, you'd upload the file here
    // const uploadUrl = await uploadToS3(file, fileReference);

    // For development, we'll return a simulated reference
    // In a real app, this would be the actual S3 URL or file path
    const fileUrl = `/uploads/${fileReference}`;

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileReference: fileReference,
        fileUrl: fileUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user.id,
      },
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
