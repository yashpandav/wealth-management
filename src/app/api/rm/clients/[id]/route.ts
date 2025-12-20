/**
 * RM - Client Detail API
 * GET /api/rm/clients/[id]
 * Fetch detailed information about a specific assigned client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET - Fetch detailed information about a specific client
 * Only accessible to the assigned RM
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Authorization check - RM only
    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;

    // Get RM record
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
    });

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'Relationship Manager profile not found' },
        { status: 404 }
      );
    }

    // Fetch client with full details
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
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
        portfolio: {
          include: {
            holdings: {
              include: {
                instrument: {
                  select: {
                    symbol: true,
                    name: true,
                    type: true,
                    currentPrice: true,
                    currency: true,
                  },
                },
              },
            },
          },
        },
        purchaseRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            instrument: {
              select: {
                symbol: true,
                name: true,
              },
            },
          },
        },
        withdrawalRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Authorization check - ensure this is the RM's assigned client
    if (client.assignedRMId !== rm.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your assigned clients' },
        { status: 403 }
      );
    }

    // Serialize Decimal fields
    const serializedClient = {
      ...client,
      portfolio: client.portfolio ? {
        ...client.portfolio,
        totalValue: Number(client.portfolio.totalValue),
        totalInvested: Number(client.portfolio.totalInvested),
        totalGainLoss: Number(client.portfolio.totalGainLoss),
        totalGainLossPercent: Number(client.portfolio.totalGainLossPercent),
        holdings: client.portfolio.holdings.map(h => ({
          ...h,
          quantity: Number(h.quantity),
          averagePurchasePrice: Number(h.averagePurchasePrice),
          currentValue: Number(h.currentValue),
          gainLoss: Number(h.gainLoss),
          gainLossPercent: Number(h.gainLossPercent),
          instrument: {
            ...h.instrument,
            currentPrice: Number(h.instrument.currentPrice),
          },
        })),
      } : null,
      purchaseRequests: client.purchaseRequests.map(pr => ({
        ...pr,
        amount: Number(pr.amount),
        quantity: pr.quantity ? Number(pr.quantity) : null,
        requestedPrice: pr.requestedPrice ? Number(pr.requestedPrice) : null,
      })),
      withdrawalRequests: client.withdrawalRequests.map(wr => ({
        ...wr,
        amount: Number(wr.amount),
      })),
    };

    return NextResponse.json({
      success: true,
      data: { client: serializedClient },
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}
