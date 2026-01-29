/**
 * Client Portfolio API (Updated for Investment Product Model)
 * GET: Fetch client's active investments and portfolio summary
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/client/portfolio
 * Fetch client's investment portfolio with all active investments and performance metrics
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
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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

    // Fetch active investment purchase requests (APPROVED or COMPLETED status)
    const activeInvestments = await prisma.productPurchaseRequest.findMany({
      where: {
        clientId: client.id,
        status: {
          in: ['APPROVED', 'COMPLETED'],
        },
      },
      include: {
        investment: {
          select: {
            id: true,
            name: true,
            description: true,
            minAmount: true,
            maxAmount: true,
            currency: true,
          },
        },
        investmentOption: {
          select: {
            id: true,
            duration: true,
            withdrawalFrequency: true,
            roi: true,
            annualReturn: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch payout statistics
    const [completedPayouts, totalInvestmentTransactions] = await Promise.all([
      // Total interest earned from completed payouts
      prisma.payout.aggregate({
        where: {
          clientId: client.id,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),
      // Total invested amount from purchase transactions
      prisma.transaction.aggregate({
        where: {
          clientId: client.id,
          type: 'PURCHASE',
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Calculate portfolio metrics
    const totalInvested = Number(totalInvestmentTransactions._sum.amount || 0);
    const totalInterestEarned = Number(completedPayouts._sum.amount || 0);
    const totalValue = totalInvested + totalInterestEarned;
    const totalGainLoss = totalInterestEarned;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    // Calculate expected annual returns based on active investments
    const expectedAnnualReturn = activeInvestments.reduce((sum, inv) => {
      const investmentAmount = Number(inv.amount);
      const annualReturn = Number(inv.investmentOption.annualReturn);
      return sum + (investmentAmount * (annualReturn / 100));
    }, 0);

    // Get recent transaction for "day change" (simplified - can be enhanced)
    const recentTransaction = await prisma.transaction.findFirst({
      where: {
        clientId: client.id,
        type: 'INTEREST_PAYOUT',
        status: 'COMPLETED',
      },
      orderBy: {
        completedAt: 'desc',
      },
      select: {
        amount: true,
        completedAt: true,
      },
    });

    const dayChange = recentTransaction ? Number(recentTransaction.amount) : 0;
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    // If no investments exist
    if (activeInvestments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          portfolio: {
            summary: {
              totalValue: 0,
              totalInvested: 0,
              totalGainLoss: 0,
              totalGainLossPercent: 0,
              totalInterestEarned: 0,
              expectedAnnualReturn: 0,
              dayChange: 0,
              dayChangePercent: 0,
              activeInvestmentsCount: 0,
            },
            investments: [],
            client: client.user,
          },
          message: 'No active investments found. Make your first investment to start building your portfolio.',
        },
      });
    }

    // Serialize investment data
    const serializedInvestments = activeInvestments.map((inv) => ({
      id: inv.id,
      trackingNumber: inv.trackingNumber,
      investmentName: inv.investment.name,
      investmentDescription: inv.investment.description,
      amount: Number(inv.amount),
      currency: inv.investment.currency,
      duration: inv.investmentOption.duration,
      withdrawalFrequency: inv.investmentOption.withdrawalFrequency,
      roi: Number(inv.investmentOption.roi),
      annualReturn: Number(inv.investmentOption.annualReturn),
      status: inv.status,
      contractStartDate: inv.contractStartDate?.toISOString(),
      completedAt: inv.completedAt?.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      // Calculate expected returns
      expectedAnnualInterest: Number(inv.amount) * (Number(inv.investmentOption.annualReturn) / 100),
      expectedMonthlyInterest: Number(inv.amount) * (Number(inv.investmentOption.roi) / 100),
    }));

    const portfolioData = {
      summary: {
        totalValue,
        totalInvested,
        totalGainLoss,
        totalGainLossPercent,
        totalInterestEarned,
        expectedAnnualReturn,
        dayChange,
        dayChangePercent,
        activeInvestmentsCount: activeInvestments.length,
      },
      investments: serializedInvestments,
      client: client.user,
    };

    return NextResponse.json({
      success: true,
      data: {
        portfolio: portfolioData,
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
