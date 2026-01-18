/**
 * Client Analytics API
 * GET: Fetch comprehensive analytics for client's portfolio
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import {
  calculateROI,
  calculateGainLoss,
  calculateAnnualizedReturn,
  calculateAllocationPercentages,
  calculateDiversificationScore,
} from '@/lib/analytics/financial-calculations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get Client ID from User ID
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({
        success: true,
        data: { analytics: null, message: 'Client profile not found' },
      });
    }

    // Fetch portfolio with holdings
    const portfolio = await prisma.portfolio.findUnique({
      where: { clientId: client.id },
      include: {
        holdings: {
          where: { deletedAt: null },
          include: {
            instrument: {
              select: {
                id: true,
                symbol: true,
                name: true,
                type: true,
                sector: true,
                currentPrice: true,
              },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json({
        success: true,
        data: {
          analytics: null,
          message: 'No portfolio found',
        },
      });
    }

    // Calculate core metrics
    const totalValue = Number(portfolio.totalValue);
    const totalInvested = Number(portfolio.totalInvested);
    const gainLoss = calculateGainLoss(totalValue, totalInvested);
    const roi = calculateROI(totalValue, totalInvested);

    // Calculate allocation by instrument type
    const holdingsByType = portfolio.holdings.reduce((acc, holding) => {
      const type = holding.instrument.type;
      if (!acc[type]) {
        acc[type] = { type, totalValue: 0, holdings: [] };
      }
      acc[type].totalValue += Number(holding.currentValue);
      acc[type].holdings.push(holding);
      return acc;
    }, {} as Record<string, { type: string; totalValue: number; holdings: unknown[] }>);

    const allocationByType = Object.values(holdingsByType).map(item => ({
      type: item.type,
      value: item.totalValue,
      percentage: (item.totalValue / totalValue) * 100,
      count: item.holdings.length,
    }));

    // Calculate allocation by sector
    const holdingsBySector = portfolio.holdings.reduce((acc, holding) => {
      const sector = holding.instrument.sector || 'Other';
      if (!acc[sector]) {
        acc[sector] = { sector, totalValue: 0, holdings: [] };
      }
      acc[sector].totalValue += Number(holding.currentValue);
      acc[sector].holdings.push(holding);
      return acc;
    }, {} as Record<string, { sector: string; totalValue: number; holdings: unknown[] }>);

    const allocationBySector = Object.values(holdingsBySector).map(item => ({
      sector: item.sector,
      value: item.totalValue,
      percentage: (item.totalValue / totalValue) * 100,
      count: item.holdings.length,
    }));

    // Calculate diversification score
    const allocationPercentages = allocationByType.map(a => a.percentage);
    const diversificationScore = calculateDiversificationScore(allocationPercentages);

    // Top holdings
    const topHoldings = calculateAllocationPercentages(
      portfolio.holdings.map(h => ({
        id: h.id,
        instrumentId: h.instrumentId,
        symbol: h.instrument.symbol,
        name: h.instrument.name,
        type: h.instrument.type,
        quantity: Number(h.quantity),
        avgPrice: Number(h.averagePurchasePrice),
        currentPrice: Number(h.instrument.currentPrice),
        currentValue: Number(h.currentValue),
        gainLoss: Number(h.gainLoss),
        gainLossPercent: Number(h.gainLossPercent),
      }))
    )
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 10);

    // Performance metrics
    const createdDate = new Date(portfolio.createdAt);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const yearsSinceCreation = Math.max(daysSinceCreation / 365, 0.01); // Minimum 0.01 years

    const annualizedReturn = calculateAnnualizedReturn(totalValue, totalInvested, yearsSinceCreation);

    // Fetch payout data
    const [payoutStats, recentPayouts, investmentPlans] = await Promise.all([
      // Payout statistics by status
      prisma.payout.groupBy({
        by: ['status'],
        where: { clientId: client.id },
        _count: true,
        _sum: { amount: true },
      }),

      // Recent payouts for chart (last 6 months)
      prisma.payout.findMany({
        where: {
          clientId: client.id,
          scheduledDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        orderBy: { scheduledDate: 'asc' },
        select: {
          amount: true,
          scheduledDate: true,
          status: true,
        },
      }),

      // Investment plans
      prisma.productPurchaseRequest.findMany({
        where: {
          clientId: client.id,
          status: { in: ['APPROVED', 'COMPLETED'] },
        },
        include: {
          investment: {
            select: {
              name: true,
              currency: true,
            },
          },
          investmentOption: {
            select: {
              annualReturn: true,
            },
          },
        },
      }),
    ]);

    // Calculate payout metrics
    const totalInterestEarned = payoutStats
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + (s._sum.amount?.toNumber() || 0), 0);

    const pendingPayouts = payoutStats.find((s) => s.status === 'PENDING')?._count || 0;
    const completedPayouts = payoutStats.find((s) => s.status === 'COMPLETED')?._count || 0;

    // Format payout history for chart
    const payoutHistory = recentPayouts.map((p) => ({
      date: p.scheduledDate.toLocaleDateString('en-US', { month: 'short' }),
      amount: p.amount.toNumber(),
      status: p.status,
    }));

    // Investment plans distribution
    const investmentDistribution = investmentPlans.reduce((acc, plan) => {
      const planName = plan.investment.name;
      if (!acc[planName]) {
        acc[planName] = {
          value: 0,
          count: 0,
        };
      }
      acc[planName].value += plan.amount.toNumber();
      acc[planName].count += 1;
      return acc;
    }, {} as Record<string, { value: number; count: number }>);

    const investmentDistributionData = Object.entries(investmentDistribution).map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
    }));

    // Analytics response
    const analytics = {
      overview: {
        totalValue,
        totalInvested,
        gainLoss,
        gainLossPercent: roi,
        dayChange: Number(portfolio.dayChange),
        dayChangePercent: Number(portfolio.dayChangePercent),
        annualizedReturn,
      },
      allocation: {
        byType: allocationByType.sort((a, b) => b.value - a.value),
        bySector: allocationBySector.sort((a, b) => b.value - a.value),
        diversificationScore,
      },
      topHoldings,
      performance: {
        annualizedReturn,
        daysSinceCreation,
        yearsSinceCreation: Math.round(yearsSinceCreation * 100) / 100,
      },
      riskMetrics: {
        diversificationScore,
        concentrationRisk: allocationPercentages.length > 0 ? Math.max(...allocationPercentages) : 0,
        numberOfHoldings: portfolio.holdings.length,
      },
      payouts: {
        totalEarned: totalInterestEarned,
        pending: pendingPayouts,
        completed: completedPayouts,
        history: payoutHistory,
      },
      investments: {
        totalPlans: investmentPlans.length,
        distribution: investmentDistributionData,
      },
    };

    return NextResponse.json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    console.error('Error fetching client analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
