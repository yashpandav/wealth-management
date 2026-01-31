/**
 * Document Static File Serving API (Catch-all)
 * GET /documents/[...path]
 *
 * Serves documents from public/documents directory with proper security
 * Works with Cloudflare tunnel and other proxies by handling requests through Next.js API routes
 * instead of relying on static file serving
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    const pathSegments = params.path || [];

    // Must have at least userId and filename
    if (pathSegments.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid document path' },
        { status: 400 }
      );
    }

    const [userId, ...filenameParts] = pathSegments;
    const filename = filenameParts.join('/');

    // Construct file path
    const filePath = join(process.cwd(), 'public', 'documents', userId, filename);

    // Security: Prevent directory traversal
    const normalizedPath = join(process.cwd(), 'public', 'documents', userId);
    if (!filePath.startsWith(normalizedPath)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Optional authentication check
    // For authenticated users, verify they have permission
    const session = await getServerSession(authOptions);

    if (session) {
      const userRole = session.user.role;
      const isOwner = session.user.id === userId;
      const isDocAdmin = userRole === 'DOCADMIN';
      const isAdmin = userRole === 'ADMIN';

      // Check if user is assigned RM
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

      // Allow access if: owner, docadmin, admin, or assigned RM
      // For unauthenticated users, allow access (you can change this based on requirements)
      if (!isOwner && !isDocAdmin && !isAdmin && !isAssignedRM) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - You do not have permission to access this document' },
          { status: 403 }
        );
      }
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine MIME type from extension
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

    // Return file with proper headers that work through Cloudflare tunnel
    return new NextResponse(fileBuffer, {
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

    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { success: false, error: 'Document file not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to serve document' },
      { status: 500 }
    );
  }
}

// Enable CORS for document access
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
