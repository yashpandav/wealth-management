/**
 * Client Analytics API (Updated for Investment Product Model)
 * GET: Fetch comprehensive analytics for client's investments
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import {
  calculateROI,
  calculateGainLoss,
  calculateAnnualizedReturn,
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
      select: {
        id: true,
        user: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({
        success: true,
        data: { analytics: null, message: 'Client profile not found' },
      });
    }

    // Fetch active investment purchase requests
    const activeInvestments = await prisma.productPurchaseRequest.findMany({
      where: {
        clientId: client.id,
        status: { in: ['APPROVED', 'COMPLETED'] },
      },
      include: {
        investment: {
          select: {
            id: true,
            name: true,
            description: true,
            currency: true,
          },
        },
        investmentOption: {
          select: {
            duration: true,
            roi: true,
            annualReturn: true,
            withdrawalFrequency: true,
          },
        },
      },
    });

    if (activeInvestments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          analytics: null,
          message: 'No active investments found',
        },
      });
    }

    // Calculate total invested from purchase transactions
    const totalInvestmentAgg = await prisma.transaction.aggregate({
      where: {
        clientId: client.id,
        type: 'PURCHASE',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const totalInvested = Number(totalInvestmentAgg._sum.amount || 0);

    // Fetch payout data
    const [payoutStats, recentPayouts] = await Promise.all([
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
    ]);

    // Calculate payout metrics
    const totalInterestEarned = payoutStats
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + (s._sum.amount?.toNumber() || 0), 0);

    const pendingPayouts = payoutStats.find((s) => s.status === 'PENDING')?._count || 0;
    const completedPayouts = payoutStats.find((s) => s.status === 'COMPLETED')?._count || 0;

    // Calculate core metrics
    const totalValue = totalInvested + totalInterestEarned;
    const gainLoss = calculateGainLoss(totalValue, totalInvested);
    const roi = calculateROI(totalValue, totalInvested);

    // Calculate allocation by investment plan
    const investmentDistribution = activeInvestments.reduce((acc, plan) => {
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

    const allocationByInvestment = Object.entries(investmentDistribution).map(([name, data]) => ({
      name,
      value: data.value,
      percentage: totalInvested > 0 ? (data.value / totalInvested) * 100 : 0,
      count: data.count,
    }));

    // Calculate allocation by duration
    const durationDistribution = activeInvestments.reduce((acc, plan) => {
      const duration = plan.investmentOption.duration;
      if (!acc[duration]) {
        acc[duration] = {
          duration,
          totalValue: 0,
          count: 0,
        };
      }
      acc[duration].totalValue += plan.amount.toNumber();
      acc[duration].count += 1;
      return acc;
    }, {} as Record<string, { duration: string; totalValue: number; count: number }>);

    const allocationByDuration = Object.values(durationDistribution).map((item) => ({
      duration: item.duration,
      value: item.totalValue,
      percentage: totalInvested > 0 ? (item.totalValue / totalInvested) * 100 : 0,
      count: item.count,
    }));

    // Top investments by amount
    const topInvestments = activeInvestments
      .map((inv) => ({
        id: inv.id,
        trackingNumber: inv.trackingNumber,
        investmentName: inv.investment.name,
        amount: inv.amount.toNumber(),
        annualReturn: inv.investmentOption.annualReturn.toNumber(),
        roi: inv.investmentOption.roi.toNumber(),
        expectedAnnualInterest: inv.amount.toNumber() * (inv.investmentOption.annualReturn.toNumber() / 100),
        allocationPercent: totalInvested > 0 ? (inv.amount.toNumber() / totalInvested) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Performance metrics
    const createdDate = new Date(client.user.createdAt);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const yearsSinceCreation = Math.max(daysSinceCreation / 365, 0.01); // Minimum 0.01 years

    const annualizedReturn = calculateAnnualizedReturn(totalValue, totalInvested, yearsSinceCreation);

    // Calculate expected returns
    const expectedAnnualReturn = activeInvestments.reduce((sum, inv) => {
      return sum + (inv.amount.toNumber() * (inv.investmentOption.annualReturn.toNumber() / 100));
    }, 0);

    // Calculate weighted average ROI
    const weightedROI = activeInvestments.reduce((sum, inv) => {
      const weight = inv.amount.toNumber() / totalInvested;
      return sum + (inv.investmentOption.roi.toNumber() * weight);
    }, 0);

    // Format payout history for chart
    const payoutHistory = recentPayouts.map((p) => ({
      date: p.scheduledDate.toLocaleDateString('en-US', { month: 'short' }),
      amount: p.amount.toNumber(),
      status: p.status,
    }));

    // Recent transaction for day change (simplified)
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
      },
    });

    const dayChange = recentTransaction ? Number(recentTransaction.amount) : 0;
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    // Diversification score (based on number of different investment plans)
    const numberOfUniquePlans = Object.keys(investmentDistribution).length;
    const diversificationScore = Math.min((numberOfUniquePlans / 5) * 100, 100); // Max score at 5+ plans

    // Concentration risk (largest single investment as % of total)
    const concentrationRisk = allocationByInvestment.length > 0
      ? Math.max(...allocationByInvestment.map(a => a.percentage))
      : 0;

    // Analytics response
    const analytics = {
      overview: {
        totalValue,
        totalInvested,
        gainLoss,
        gainLossPercent: roi,
        dayChange,
        dayChangePercent,
        annualizedReturn,
        expectedAnnualReturn,
        weightedAverageROI: weightedROI,
      },
      allocation: {
        byInvestment: allocationByInvestment.sort((a, b) => b.value - a.value),
        byDuration: allocationByDuration.sort((a, b) => b.value - a.value),
        diversificationScore,
      },
      topInvestments,
      performance: {
        annualizedReturn,
        expectedAnnualReturn,
        daysSinceCreation,
        yearsSinceCreation: Math.round(yearsSinceCreation * 100) / 100,
      },
      riskMetrics: {
        diversificationScore,
        concentrationRisk,
        numberOfInvestments: activeInvestments.length,
        numberOfUniquePlans,
      },
      payouts: {
        totalEarned: totalInterestEarned,
        pending: pendingPayouts,
        completed: completedPayouts,
        history: payoutHistory,
      },
      investments: {
        totalPlans: activeInvestments.length,
        distribution: allocationByInvestment,
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
