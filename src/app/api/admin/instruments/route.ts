/**
 * Admin Instruments API
 * GET: List instruments with pagination and filtering
 * POST: Create new instrument
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  createInstrumentSchema,
  instrumentQuerySchema,
  type CreateInstrumentInput,
  type InstrumentQuery,
} from '@/lib/validation/instrument.validation';
import { AuditAction, Prisma } from '@prisma/client';

/**
 * GET /api/admin/instruments
 * List all instruments with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = instrumentQuerySchema.safeParse(searchParams);

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

    const {
      page,
      limit,
      query,
      type,
      riskRating,
      isActive,
      isPublic,
      minPrice,
      maxPrice,
      sector,
      exchange,
      sortBy,
      sortOrder,
    }: InstrumentQuery = validationResult.data;

    // Build where clause for filtering
    const where: Prisma.InstrumentWhereInput = {
      deletedAt: null,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { symbol: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
      ...(riskRating && { riskRating }),
      ...(isActive !== undefined && { isActive }),
      ...(isPublic !== undefined && { isPublic }),
      ...(minPrice && { currentPrice: { gte: minPrice } }),
      ...(maxPrice && { currentPrice: { lte: maxPrice } }),
      ...(sector && { sector: { contains: sector, mode: 'insensitive' } }),
      ...(exchange && { exchange: { contains: exchange, mode: 'insensitive' } }),
    };

    // Get total count for pagination
    const totalCount = await prisma.instrument.count({ where });

    // Get instruments with pagination
    const instruments = await prisma.instrument.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        symbol: true,
        name: true,
        type: true,
        isin: true,
        description: true,
        currentPrice: true,
        currency: true,
        lastPriceUpdate: true,
        exchange: true,
        sector: true,
        marketCap: true,
        yearlyHigh: true,
        yearlyLow: true,
        dividendYield: true,
        peRatio: true,
        riskRating: true,
        minimumInvestment: true,
        isActive: true,
        isPublic: true,
        launchDate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            holdings: true,
            transactions: true,
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
        instruments,
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
    console.error('Error fetching instruments:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch instruments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/instruments
 * Create new instrument
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = createInstrumentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid instrument data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data: CreateInstrumentInput = validationResult.data;

    // Check if symbol already exists
    const existingSymbol = await prisma.instrument.findUnique({
      where: { symbol: data.symbol },
    });

    if (existingSymbol && !existingSymbol.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Instrument with this symbol already exists' },
        { status: 409 }
      );
    }

    // Check if ISIN already exists (if provided)
    if (data.isin) {
      const existingISIN = await prisma.instrument.findUnique({
        where: { isin: data.isin },
      });

      if (existingISIN && !existingISIN.deletedAt) {
        return NextResponse.json(
          { success: false, error: 'Instrument with this ISIN already exists' },
          { status: 409 }
        );
      }
    }

    // Create instrument
    const instrument = await prisma.instrument.create({
      data: {
        ...data,
        launchDate: data.launchDate ? new Date(data.launchDate) : null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.INSTRUMENT_CREATE,
        entityType: 'Instrument',
        entityId: instrument.id,
        description: `Created instrument: ${instrument.name} (${instrument.symbol})`,
        metadata: {
          instrumentType: instrument.type,
          symbol: instrument.symbol,
          currentPrice: instrument.currentPrice.toString(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Instrument created successfully',
        data: instrument,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating instrument:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Instrument with this symbol or ISIN already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create instrument' },
      { status: 500 }
    );
  }
}
