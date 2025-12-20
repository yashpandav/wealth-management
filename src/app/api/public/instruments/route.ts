/**
 * API Route: Public Instruments Browse
 * GET - Fetch instruments for public browsing (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const riskRating = searchParams.get('riskRating');
    const minInvestment = searchParams.get('minInvestment');
    const maxInvestment = searchParams.get('maxInvestment');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build where clause - only show active instruments
    const where: Prisma.InstrumentWhereInput = {
      isActive: true,
    };

    // Type filter
    if (type && type !== 'all') {
      where.type = type as Prisma.EnumInstrumentTypeFilter;
    }

    // Risk rating filter
    if (riskRating && riskRating !== 'all') {
      where.riskRating = { equals: riskRating, mode: 'insensitive' };
    }

    // Minimum investment range filter
    if (minInvestment || maxInvestment) {
      const investmentFilter: { gte?: number; lte?: number } = {};
      if (minInvestment) {
        investmentFilter.gte = parseFloat(minInvestment);
      }
      if (maxInvestment) {
        investmentFilter.lte = parseFloat(maxInvestment);
      }
      where.minimumInvestment = investmentFilter;
    }

    // Search filter (name, symbol, or description)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Build sort
    let orderBy: Prisma.InstrumentOrderByWithRelationInput;
    if (sortBy === 'dividendYield') {
      orderBy = { dividendYield: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'minimumInvestment') {
      orderBy = { minimumInvestment: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'riskRating') {
      orderBy = { riskRating: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else {
      orderBy = { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' };
    }

    // Fetch instruments and total count in parallel
    const [instruments, totalCount] = await Promise.all([
      prisma.instrument.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          symbol: true,
          type: true,
          description: true,
          riskRating: true,
          minimumInvestment: true,
          dividendYield: true,
          currentPrice: true,
          isActive: true,
        },
      }),
      prisma.instrument.count({ where }),
    ]);

    // Serialize Decimal fields
    const serializedInstruments = instruments.map((instrument) => ({
      ...instrument,
      minimumInvestment: instrument.minimumInvestment ? Number(instrument.minimumInvestment) : 0,
      dividendYield: instrument.dividendYield ? Number(instrument.dividendYield) : 0,
      currentPrice: Number(instrument.currentPrice),
    }));

    return NextResponse.json({
      success: true,
      data: {
        instruments: serializedInstruments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching public instruments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instruments' },
      { status: 500 }
    );
  }
}
