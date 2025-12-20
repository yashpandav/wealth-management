/**
 * RM Purchase Request Detail API
 * GET /api/rm/purchase-requests/[id]
 * Returns detailed information about a specific purchase request
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
 * GET - Fetch detailed purchase request information
 * Only accessible to RMs for their assigned clients' requests
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
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

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get RM's assigned client IDs for authorization
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      include: {
        assignedClients: {
          select: { id: true },
        },
      },
    });

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'Relationship Manager not found' },
        { status: 404 }
      );
    }

    const clientIds = rm.assignedClients.map((c) => c.id);

    // Fetch purchase request with comprehensive details
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
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
                        id: true,
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
          },
        },
        instrument: {
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
            isActive: true,
            isPublic: true,
          },
        },
        processedBy: {
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

    // Check if request exists
    if (!purchaseRequest) {
      return NextResponse.json(
        { success: false, error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Authorization check - ensure request is for RM's assigned client
    if (!clientIds.includes(purchaseRequest.clientId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view requests from your assigned clients' },
        { status: 403 }
      );
    }

    // Get client's transaction history for context
    const transactionHistory = await prisma.transaction.findMany({
      where: {
        clientId: purchaseRequest.clientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        instrument: {
          select: {
            symbol: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Get other pending requests from this client
    const otherPendingRequests = await prisma.purchaseRequest.findMany({
      where: {
        clientId: purchaseRequest.clientId,
        id: { not: id },
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        instrument: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
    });

    // Serialize Decimal fields for JSON response
    const serializedRequest = {
      ...purchaseRequest,
      amount: Number(purchaseRequest.amount),
      quantity: purchaseRequest.quantity ? Number(purchaseRequest.quantity) : null,
      requestedPrice: purchaseRequest.requestedPrice ? Number(purchaseRequest.requestedPrice) : null,
      instrument: {
        ...purchaseRequest.instrument,
        currentPrice: Number(purchaseRequest.instrument.currentPrice),
        minimumInvestment: purchaseRequest.instrument.minimumInvestment
          ? Number(purchaseRequest.instrument.minimumInvestment)
          : null,
      },
      client: {
        ...purchaseRequest.client,
        portfolio: purchaseRequest.client.portfolio
          ? {
              ...purchaseRequest.client.portfolio,
              totalValue: Number(purchaseRequest.client.portfolio.totalValue),
              totalGainLoss: Number(purchaseRequest.client.portfolio.totalGainLoss),
              totalGainLossPercent: Number(purchaseRequest.client.portfolio.totalGainLossPercent),
              holdings: purchaseRequest.client.portfolio.holdings.map((holding) => ({
                ...holding,
                quantity: Number(holding.quantity),
                averagePurchasePrice: Number(holding.averagePurchasePrice),
                currentValue: Number(holding.currentValue),
                gainLoss: Number(holding.gainLoss),
                gainLossPercent: Number(holding.gainLossPercent),
                instrument: {
                  ...holding.instrument,
                  currentPrice: Number(holding.instrument.currentPrice),
                },
              })),
            }
          : null,
      },
    };

    const serializedHistory = transactionHistory.map((txn) => ({
      ...txn,
      amount: Number(txn.amount),
      quantity: txn.quantity ? Number(txn.quantity) : null,
      price: txn.price ? Number(txn.price) : null,
      total: Number(txn.total),
      fees: Number(txn.fees),
      netAmount: Number(txn.netAmount),
    }));

    const serializedOtherRequests = otherPendingRequests.map((req) => ({
      ...req,
      amount: Number(req.amount),
      quantity: req.quantity ? Number(req.quantity) : null,
      requestedPrice: req.requestedPrice ? Number(req.requestedPrice) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        request: serializedRequest,
        transactionHistory: serializedHistory,
        otherPendingRequests: serializedOtherRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase request details' },
      { status: 500 }
    );
  }
}
