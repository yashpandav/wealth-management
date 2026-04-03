/**
 * Admin Clients API
 * List and manage client assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const clientSearchSchema = z.object({
  query: z.string().max(100).optional(),
  assignmentStatus: z.enum(['all', 'assigned', 'unassigned']).default('all'),
  rmId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/admin/clients
 * List all clients with their assignment status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();

    // Parse and validate query parameters
    const { searchParams } = request.nextUrl;
    const validationResult = clientSearchSchema.safeParse({
      query: searchParams.get('query') || undefined,
      assignmentStatus: searchParams.get('assignmentStatus') || 'all',
      rmId: searchParams.get('rmId') || undefined,
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

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

    const { query, assignmentStatus, rmId, page, limit } = validationResult.data;

    // Build where clause for users with CLIENT role
    const userWhere: Record<string, unknown> = {
      role: UserRole.CLIENT,
    };

    if (query) {
      userWhere.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Push assignment/RM filters into the DB query so totalCount is accurate
    if (assignmentStatus === 'assigned') {
      userWhere.client = { isNot: null };
    } else if (assignmentStatus === 'unassigned') {
      userWhere.client = { is: null };
    }

    if (rmId) {
      userWhere.client = {
        ...((userWhere.client as object) || {}),
        assignedRMId: rmId,
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch client users
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        include: {
          client: {
            include: {
              assignedRM: {
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
          },
        },
        orderBy: {
          lastName: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: userWhere }),
    ]);

    // Format response
    const clientData = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      status: user.status,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      isAssigned: user.client !== null,
      clientId: user.client?.id || null,
      assignedRM: user.client?.assignedRM
        ? {
            id: user.client.assignedRM.id,
            userId: user.client.assignedRM.userId,
            firstName: user.client.assignedRM.user.firstName,
            lastName: user.client.assignedRM.user.lastName,
            fullName: `${user.client.assignedRM.user.firstName} ${user.client.assignedRM.user.lastName}`,
            email: user.client.assignedRM.user.email,
          }
        : null,
      assignedAt: user.client?.assignedAt || null,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        clients: clientData,
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
  } catch (error) {
    console.error('Error fetching clients:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
