/**
 * Admin Leads API
 * GET: List all user leads with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { leadQuerySchema, type LeadQuery } from '@/lib/validation/lead.validation';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/leads
 * List all user leads with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

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

    const { page, limit, query, sortBy, sortOrder }: LeadQuery = validationResult.data;

    // Build where clause for filtering
    const where: Prisma.UserLeadWhereInput = {
      ...(query && {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      }),
    };

    // Get total count for pagination
    const totalCount = await prisma.userLead.count({ where });

    // Get leads with pagination
    const leads = await prisma.userLead.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        age: true,
        monthlyIncome: true,
        monthlyExpenses: true,
        familyExpenses: true,
        financialGoals: true,
        currentSavings: true,
        investmentExperience: true,
        riskTolerance: true,
        investmentHorizon: true,
        createdAt: true,
        updatedAt: true,
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

    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
