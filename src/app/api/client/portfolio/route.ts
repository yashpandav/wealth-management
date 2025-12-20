/**
 * Client Portfolio API
 * GET: Fetch client's portfolio with holdings and performance data
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/client/portfolio
 * Fetch client's portfolio with all holdings and performance metrics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Authorization check - CLIENT only
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Client access required' },
        { status: 403 }
      );
    }

    // First get the Client record from the User ID
    const client = await prisma.client.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!client) {
      return NextResponse.json({
        success: true,
        data: {
          portfolio: null,
          message: 'Client profile not found. Please contact support.',
        },
      });
    }

    // Fetch client's portfolio with holdings using the Client ID
    const portfolio = await prisma.portfolio.findUnique({
      where: {
        clientId: client.id,
      },
      include: {
        holdings: {
          where: {
            deletedAt: null, // Only active holdings
          },
          include: {
            instrument: {
              select: {
                id: true,
                symbol: true,
                name: true,
                type: true,
                sector: true,
                currency: true,
                currentPrice: true,
              },
            },
          },
          orderBy: {
            currentValue: 'desc', // Largest holdings first
          },
        },
        client: {
          include: {
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

    // If no portfolio exists, return empty portfolio
    if (!portfolio) {
      return NextResponse.json({
        success: true,
        data: {
          portfolio: null,
          message: 'No portfolio found. Make your first investment to create a portfolio.',
        },
      });
    }

    // Serialize Decimal fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedPortfolio = portfolio as any;

    const serializedPortfolio = {
      id: typedPortfolio.id,
      clientId: typedPortfolio.clientId,
      totalValue: Number(typedPortfolio.totalValue),
      totalInvested: Number(typedPortfolio.totalInvested),
      totalGainLoss: Number(typedPortfolio.totalGainLoss),
      totalGainLossPercent: Number(typedPortfolio.totalGainLossPercent),
      dayChange: Number(typedPortfolio.dayChange),
      dayChangePercent: Number(typedPortfolio.dayChangePercent),
      weekChange: Number(typedPortfolio.weekChange),
      monthChange: Number(typedPortfolio.monthChange),
      yearChange: Number(typedPortfolio.yearChange),
      lastUpdatedAt: typedPortfolio.lastUpdatedAt.toISOString(),
      createdAt: typedPortfolio.createdAt.toISOString(),
      updatedAt: typedPortfolio.updatedAt.toISOString(),
      client: {
        user: typedPortfolio.client.user,
      },
      holdings: typedPortfolio.holdings.map((holding: { id: string; portfolioId: string; instrumentId: string; quantity: number; averagePurchasePrice: number; currentPrice: number; totalValue: number; createdAt: Date; updatedAt: Date; instrument: { id: string; symbol: string; name: string; type: string; riskLevel: string; isActive: boolean } }) => ({
        id: holding.id,
        portfolioId: holding.portfolioId,
        instrumentId: holding.instrumentId,
        quantity: Number(holding.quantity),
        averagePurchasePrice: Number(holding.averagePurchasePrice),
        currentPrice: Number(holding.currentPrice),
        currentValue: Number(holding.totalValue),
        gainLoss: 0, // Calculate if needed
        gainLossPercent: 0, // Calculate if needed
        dayChange: 0, // Calculate if needed
        dayChangePercent: 0, // Calculate if needed
        allocationPercent: 0, // Calculate if needed
        firstPurchasedAt: holding.createdAt.toISOString(),
        lastUpdatedAt: holding.updatedAt.toISOString(),
        instrument: {
          ...holding.instrument,
        },
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        portfolio: serializedPortfolio,
      },
    });
  } catch (error) {
    console.error('Error fetching client portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}
