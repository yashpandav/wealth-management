/**
 * DocAdmin Clients API
 * GET: List clients for DocAdmin management (verified clients pending RM assignment)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/docadmin/clients
 * List clients for DocAdmin - specifically for RM assignment workflow
 * By default, shows VERIFIED clients without RM assigned
 */
export async function GET(request: NextRequest) {
  try {
    // Require DocAdmin role
    await requireRole('DOCADMIN');

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const query = searchParams.get('query') || '';
    const filter = searchParams.get('filter') || 'pending_rm'; // pending_rm, all_verified, all

    // Build where clause based on filter
    let where: Prisma.ClientWhereInput = {};

    switch (filter) {
      case 'pending_rm':
        // Clients with verified KYC but no RM assigned
        where = {
          verificationStatus: 'VERIFIED',
          assignedRMId: null,
        };
        break;
      case 'all_verified':
        // All verified clients
        where = {
          verificationStatus: 'VERIFIED',
        };
        break;
      case 'all':
        // All clients
        where = {};
        break;
      default:
        where = {
          verificationStatus: 'VERIFIED',
          assignedRMId: null,
        };
    }

    // Add search filter
    if (query) {
      where.user = {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };
    }

    // Get total count
    const totalCount = await prisma.client.count({ where });

    // Get clients with pagination
    const clients = await prisma.client.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        verificationStatus: true,
        assignedRMId: true,
        assignedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        assignedRM: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            verificationStatus: true,
            verifiedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        clients: clients.map((client) => ({
          id: client.id,
          name: `${client.user.firstName} ${client.user.lastName}`,
          email: client.user.email,
          phone: client.user.phone,
          userId: client.user.id,
          verificationStatus: client.verificationStatus,
          registeredAt: client.user.createdAt.toISOString(),
          assignedAt: client.assignedAt?.toISOString(),
          assignedRM: client.assignedRM
            ? {
                id: client.assignedRM.id,
                name: `${client.assignedRM.user.firstName} ${client.assignedRM.user.lastName}`,
                email: client.assignedRM.user.email,
              }
            : null,
          documentsCount: client.documents.length,
          verifiedDocumentsCount: client.documents.filter((d) => d.verificationStatus === 'VERIFIED').length,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching clients for DocAdmin:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: DocAdmin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
