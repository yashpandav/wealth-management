/**
 * API Route: Public Plan Detail
 * GET - Fetch single plan details (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch instrument details
    const instrument = await prisma.instrument.findUnique({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        type: true,
        isin: true,
        description: true,
        riskRating: true,
        minimumInvestment: true,
        dividendYield: true,
        currentPrice: true,
        currency: true,
        lastPriceUpdate: true,
        exchange: true,
        sector: true,
        marketCap: true,
        yearlyHigh: true,
        yearlyLow: true,
        peRatio: true,
        launchDate: true,
        prospectusUrl: true,
      },
    });

    if (!instrument) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Fetch related instruments (same type or sector, excluding current)
    const relatedInstruments = await prisma.instrument.findMany({
      where: {
        isActive: true,
        id: { not: id },
        OR: [
          { type: instrument.type },
          ...(instrument.sector ? [{ sector: instrument.sector }] : []),
        ],
      },
      take: 4,
      select: {
        id: true,
        name: true,
        symbol: true,
        type: true,
        riskRating: true,
        dividendYield: true,
        currentPrice: true,
      },
    });

    // Serialize Decimal fields
    const serializedInstrument = {
      ...instrument,
      minimumInvestment: instrument.minimumInvestment ? Number(instrument.minimumInvestment) : 0,
      dividendYield: instrument.dividendYield ? Number(instrument.dividendYield) : 0,
      currentPrice: Number(instrument.currentPrice),
      marketCap: instrument.marketCap ? Number(instrument.marketCap) : null,
      yearlyHigh: instrument.yearlyHigh ? Number(instrument.yearlyHigh) : null,
      yearlyLow: instrument.yearlyLow ? Number(instrument.yearlyLow) : null,
      peRatio: instrument.peRatio ? Number(instrument.peRatio) : null,
    };

    const serializedRelated = relatedInstruments.map((inst) => ({
      ...inst,
      dividendYield: inst.dividendYield ? Number(inst.dividendYield) : 0,
      currentPrice: Number(inst.currentPrice),
    }));

    return NextResponse.json({
      success: true,
      data: {
        instrument: serializedInstrument,
        relatedInstruments: serializedRelated,
      },
    });
  } catch (error) {
    console.error('Error fetching instrument details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan details' },
      { status: 500 }
    );
  }
}
