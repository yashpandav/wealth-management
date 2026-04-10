/**
 * Document Static File Serving API (Catch-all)
 * GET /documents/[...path]
 *
 * Serves documents from S3 with proper security checks.
 * Path format: /documents/{userId}/{filename}
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { downloadFromS3 } from '@/lib/storage/s3';

export async function GET(
  _request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    const pathSegments = params.path || [];

    if (pathSegments.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid document path' },
        { status: 400 }
      );
    }

    const [userId, ...filenameParts] = pathSegments;
    const filename = filenameParts.join('/');
    const s3Key = `documents/${userId}/${filename}`;

    // Optional authentication check
    const session = await getServerSession(authOptions);

    if (session) {
      const userRole = session.user.role;
      const isOwner = session.user.id === userId;
      const isDocAdmin = userRole === 'DOCADMIN';
      const isAdmin = userRole === 'ADMIN';

      let isAssignedRM = false;
      if (userRole === 'RM') {
        const rm = await prisma.relationshipManager.findUnique({
          where: { userId: session.user.id },
          include: {
            assignedClients: {
              where: { userId },
              select: { id: true },
            },
          },
        });
        isAssignedRM = (rm?.assignedClients?.length ?? 0) > 0;
      }

      if (!isOwner && !isDocAdmin && !isAdmin && !isAssignedRM) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - You do not have permission to access this document' },
          { status: 403 }
        );
      }
    }

    // Fetch from S3
    const fileBuffer = await downloadFromS3(s3Key);

    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${filename.split('/').pop()}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error serving document:', error);
    return NextResponse.json(
      { success: false, error: 'Document file not found' },
      { status: 404 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export const dynamic = 'force-dynamic';
