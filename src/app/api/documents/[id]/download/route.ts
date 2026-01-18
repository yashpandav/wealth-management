/**
 * Document Download API
 * GET: Download a document by ID (contract documents for clients, admins, docadmins)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const documentId = params.id;

    // Fetch document details
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        client: {
          select: {
            userId: true,
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

    // Authorization check
    const userRole = session.user.role;
    const isOwner = document.client.userId === session.user.id;
    const isDocAdmin = userRole === 'DOCADMIN';
    const isAdmin = userRole === 'ADMIN';

    // Check if the user is RM assigned to this client
    let isAssignedRM = false;
    if (userRole === 'RM') {
      const rm = await prisma.relationshipManager.findUnique({
        where: { userId: session.user.id },
        include: {
          assignedClients: {
            where: { userId: document.client.userId },
            select: { id: true },
          },
        },
      });
      isAssignedRM = (rm?.assignedClients?.length ?? 0) > 0;
    }

    // Only allow: owner, docadmin, admin, or assigned RM
    if (!isOwner && !isDocAdmin && !isAdmin && !isAssignedRM) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You do not have permission to access this document' },
        { status: 403 }
      );
    }

    // Read file from disk
    const filePath = join(process.cwd(), document.filePath);
    const fileBuffer = await readFile(filePath);

    // Create audit log for document access
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DOCUMENT_VERIFY',
        entityType: 'Document',
        entityId: documentId,
        description: `User downloaded document: ${document.fileName}`,
        metadata: {
          documentId,
          documentType: document.documentType,
          fileName: document.fileName,
          clientId: document.clientId,
          accessedBy: userRole,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'INFO',
        success: true,
      },
    }).catch((err) => {
      console.error('Failed to create audit log for document download:', err);
      // Don't fail the download if audit log creation fails
    });

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Content-Length': (document.fileSize || 0).toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading document:', error);

    // Check if it's a file not found error
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { success: false, error: 'Document file not found on server' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to download document' },
      { status: 500 }
    );
  }
}
