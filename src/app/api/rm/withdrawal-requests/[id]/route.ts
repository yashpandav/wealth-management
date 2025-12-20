/**
 * RM Withdrawal Request Detail API
 * GET /api/rm/withdrawal-requests/[id]
 * Returns detailed information about a specific withdrawal request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WithdrawalStatus } from '@prisma/client';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET - Fetch detailed withdrawal request information
 * Automatically updates status from PENDING to RM_REVIEW
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

    // Fetch withdrawal request with comprehensive details
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
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
        processedByRM: {
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
        approvedByAdmin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Check if request exists
    if (!withdrawalRequest) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Authorization check - ensure request is for RM's assigned client
    if (!clientIds.includes(withdrawalRequest.clientId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view requests from your assigned clients' },
        { status: 403 }
      );
    }

    // Auto-update status from PENDING to RM_REVIEW when RM opens the request
    if (withdrawalRequest.status === WithdrawalStatus.PENDING) {
      await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: WithdrawalStatus.RM_REVIEW,
          processedByRMId: rm.id,
        },
      });
      withdrawalRequest.status = WithdrawalStatus.RM_REVIEW;
      withdrawalRequest.processedByRMId = rm.id;
    }

    // Get client's transaction history for context
    const transactionHistory = await prisma.transaction.findMany({
      where: {
        clientId: withdrawalRequest.clientId,
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

    // Get other pending withdrawal requests from this client
    const otherPendingRequests = await prisma.withdrawalRequest.findMany({
      where: {
        clientId: withdrawalRequest.clientId,
        id: { not: id },
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.RM_REVIEW, WithdrawalStatus.RM_APPROVED, WithdrawalStatus.ADMIN_REVIEW] },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Serialize Decimal fields for JSON response
    const serializedRequest = {
      ...withdrawalRequest,
      amount: Number(withdrawalRequest.amount),
      client: {
        ...withdrawalRequest.client,
        portfolio: withdrawalRequest.client.portfolio
          ? {
              ...withdrawalRequest.client.portfolio,
              totalValue: Number(withdrawalRequest.client.portfolio.totalValue),
              totalGainLoss: Number(withdrawalRequest.client.portfolio.totalGainLoss),
              totalGainLossPercent: Number(withdrawalRequest.client.portfolio.totalGainLossPercent),
              holdings: withdrawalRequest.client.portfolio.holdings.map((holding) => ({
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
    console.error('Error fetching withdrawal request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal request details' },
      { status: 500 }
    );
  }
}
