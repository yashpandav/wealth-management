/**
 * Client Instruments API
 * GET: List available instruments for clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/client/instruments
 * List active and public instruments available for investment
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    // Build where clause - only show active and public instruments
    const where: Record<string, unknown> = {
      deletedAt: null,
      isActive: true, // Only active instruments
      isPublic: true, // Only public instruments
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
    };

    // Get total count
    const totalCount = await prisma.instrument.count({ where });

    // Get instruments
    const instruments = await prisma.instrument.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        symbol: true,
        name: true,
        type: true,
        description: true,
        currentPrice: true,
        currency: true,
        riskRating: true,
        minimumInvestment: true,
        sector: true,
        exchange: true,
        prospectusUrl: true,
      },
    });

    // Serialize Decimal fields
    const serializedInstruments = instruments.map((instrument) => ({
      ...instrument,
      currentPrice: Number(instrument.currentPrice),
      minimumInvestment: instrument.minimumInvestment
        ? Number(instrument.minimumInvestment)
        : null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        instruments: serializedInstruments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching instruments:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch instruments' },
      { status: 500 }
    );
  }
}
