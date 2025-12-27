/**
 * DocAdmin Leads API
 * GET: List all user leads with pagination and filtering (DocAdmin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { leadQuerySchema, type LeadQuery } from '@/lib/validation/lead.validation';
import { Prisma } from '@prisma/client';

/**
 * Returns a paginated, filterable list of user leads visible to DocAdmin users.
 *
 * Validates query parameters and returns leads matching status, query (searched across firstName,
 * lastName, email, phoneNumber, rmReference), and leadSource, ordered and paginated by page, limit,
 * sortBy, and sortOrder.
 *
 * @returns JSON with `success: true` and `data` containing `leads` (selected lead fields including
 * `assignedRM` user info) and `pagination` metadata (`page`, `limit`, `totalCount`, `totalPages`,
 * `hasNextPage`, `hasPrevPage`). On validation or authorization errors returns `success: false`
 * with an `error` message and an appropriate HTTP status code.
 */
export async function GET(request: NextRequest) {
  try {
    // Require DocAdmin role
    await requireRole('DOCADMIN');

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = leadQuerySchema.safeParse(searchParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { page, limit, query, sortBy, sortOrder, leadSource, status }: LeadQuery =
      validationResult.data;

    // Build where clause for filtering
    // DocAdmin only sees leads with status NEW, CONTACTED, or INTERESTED (not CONVERTED/LOST/NOT_INTERESTED)
    const where: Prisma.UserLeadWhereInput = {
      status: status ? status : { in: ['NEW', 'CONTACTED', 'INTERESTED'] },
      ...(query && {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query, mode: 'insensitive' } },
          { rmReference: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(leadSource && { leadSource }),
    };

    // Get total count for pagination
    const totalCount = await prisma.userLead.count({ where });

    // Get leads with pagination - ALL fields visible to DocAdmin
    const leads = await prisma.userLead.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        leadSource: true,
        rmReference: true,
        assignedRMId: true,
        userId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        leads,
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
    console.error('Error fetching leads:', error);

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
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}