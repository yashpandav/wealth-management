/**
 * Admin - Withdrawal Request Detail API
 * Get detailed withdrawal request for admin review and approval
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { WithdrawalStatus } from '@prisma/client';

export async function GET(
  _request: never,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin authorization
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;

    // Fetch comprehensive withdrawal request details
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            portfolio: {
              include: {
                holdings: {
                  include: {
                    instrument: {
                      select: {
                        name: true,
                        type: true,
                        currentPrice: true,
                      },
                    },
                  },
                },
              },
            },
            assignedRM: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
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

    if (!withdrawalRequest) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Auto-update status from RM_APPROVED to ADMIN_REVIEW when admin opens the request
    let finalRequest = withdrawalRequest;
    if (withdrawalRequest.status === WithdrawalStatus.RM_APPROVED) {
      finalRequest = await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: WithdrawalStatus.ADMIN_REVIEW,
          approvedByAdminId: session.user.id,
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              portfolio: {
                include: {
                  holdings: {
                    include: {
                      instrument: {
                        select: {
                          name: true,
                          type: true,
                          currentPrice: true,
                        },
                      },
                    },
                  },
                },
              },
              assignedRM: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
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
    }

    // Get recent transactions for context
    const recentTransactions = await prisma.transaction.findMany({
      where: { clientId: withdrawalRequest.clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    // Get other pending withdrawal requests from same client
    const otherPendingRequests = await prisma.withdrawalRequest.findMany({
      where: {
        clientId: withdrawalRequest.clientId,
        id: { not: id },
        status: {
          in: [
            WithdrawalStatus.PENDING,
            WithdrawalStatus.RM_REVIEW,
            WithdrawalStatus.RM_APPROVED,
            WithdrawalStatus.ADMIN_REVIEW,
          ],
        },
      },
      select: {
        id: true,
        trackingNumber: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    // Serialize Decimal fields
    const serializedRequest = {
      ...finalRequest,
      amount: Number(finalRequest.amount),
      client: {
        ...finalRequest.client,
        portfolio: finalRequest.client.portfolio
          ? {
              ...finalRequest.client.portfolio,
              totalValue: Number(finalRequest.client.portfolio.totalValue),
              totalGainLoss: Number(finalRequest.client.portfolio.totalGainLoss),
              totalInvested: Number(finalRequest.client.portfolio.totalInvested),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              holdings: finalRequest.client.portfolio.holdings.map((holding: any) => ({
                ...holding,
                quantity: Number(holding.quantity),
                averageBuyPrice: Number(holding.averageBuyPrice),
                currentValue: Number(holding.currentValue),
                gainLoss: Number(holding.gainLoss),
                instrument: {
                  ...holding.instrument,
                  currentPrice: Number(holding.instrument.currentPrice),
                },
              })),
            }
          : null,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedTransactions = recentTransactions.map((tx: any) => ({
      ...tx,
      amount: Number(tx.amount),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedOtherRequests = otherPendingRequests.map((req: any) => ({
      ...req,
      amount: Number(req.amount),
    }));

    return NextResponse.json({
      success: true,
      data: {
        request: serializedRequest,
        recentTransactions: serializedTransactions,
        otherPendingRequests: serializedOtherRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawal request details for admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal request details' },
      { status: 500 }
    );
  }
}
