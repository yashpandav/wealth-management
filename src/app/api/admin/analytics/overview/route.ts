/**
 * API Route: Admin Analytics Overview
 * GET - Fetch system-wide analytics metrics for admin dashboard
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all metrics in parallel
    const [
      totalClients,
      totalRMs,
      totalAdmins,
      totalAUMFromTransactions,
      totalInvestments,
      pendingPurchaseRequests,
      totalTransactions,
      completedTransactions,
      allRMs,
      allInvestments,
      allPurchaseRequests,
      allTransactions,
    ] = await Promise.all([
      // Total clients
      prisma.client.count(),

      // Total RMs
      prisma.relationshipManager.count(),

      // Total admins
      prisma.user.count({ where: { role: 'ADMIN' } }),

      // Total AUM (sum of all completed purchase transactions)
      prisma.transaction.aggregate({
        where: {
          type: 'PURCHASE',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),

      // Total active investment plans
      prisma.investment.count({ where: { isActive: true } }),

      // Pending purchase requests
      prisma.productPurchaseRequest.count({ where: { status: 'PENDING' } }),

      // Total transactions
      prisma.transaction.count(),

      // Completed transactions
      prisma.transaction.count({ where: { status: 'COMPLETED' } }),

      // All RMs with clients for distribution
      prisma.relationshipManager.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          assignedClients: {
            select: {
              id: true,
            },
          },
        },
      }),

      // All investments (no type field in new model)
      prisma.investment.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
        },
      }),

      // All purchase requests for trends
      prisma.productPurchaseRequest.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
          amount: true,
        },
      }),

      // All transactions for trends
      prisma.transaction.findMany({
        select: {
          id: true,
          type: true,
          createdAt: true,
          amount: true,
          status: true,
        },
      }),
    ]);

    // Calculate RM distribution by client count and AUM
    const rmDistribution = await Promise.all(
      allRMs.map(async (rm) => {
        // Calculate AUM for this RM's clients from transactions
        const clientIds = rm.assignedClients.map((c) => c.id);
        const aumAgg = await prisma.transaction.aggregate({
          where: {
            clientId: { in: clientIds },
            type: 'PURCHASE',
            status: 'COMPLETED',
          },
          _sum: { amount: true },
        });

        return {
          name: `${rm.user.firstName} ${rm.user.lastName}`,
          clients: rm.assignedClients.length,
          aum: Number(aumAgg._sum.amount || 0),
        };
      })
    ).then((rms) => rms.sort((a, b) => b.aum - a.aum).slice(0, 10));

    // Calculate investment distribution by name
    const investmentDistribution = allInvestments.map((inv) => ({
      name: inv.name,
      value: 1, // Each investment plan
    }));

    // Transaction volume trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactionTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTransactions = allTransactions.filter((txn) => {
        const txnDate = new Date(txn.createdAt).toISOString().split('T')[0];
        return txnDate === dateStr;
      });

      const purchaseVolume = dayTransactions
        .filter((t) => t.type === 'PURCHASE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const withdrawalVolume = dayTransactions
        .filter((t) => t.type === 'WITHDRAWAL')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      transactionTrend.push({
        date: dateStr,
        purchases: purchaseVolume,
        withdrawals: withdrawalVolume,
        total: purchaseVolume + withdrawalVolume,
      });
    }

    // Request status distribution
    const purchaseStatusCounts = allPurchaseRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestStatusDistribution = [
      { name: 'Purchase - Pending', value: purchaseStatusCounts['PENDING'] || 0, fill: '#fbbf24' },
      { name: 'Purchase - Approved', value: purchaseStatusCounts['APPROVED'] || 0, fill: '#10b981' },
      { name: 'Purchase - Rejected', value: purchaseStatusCounts['REJECTED'] || 0, fill: '#ef4444' },
    ].filter((item) => item.value > 0);

    // User growth trend - simplified (using current counts)
    // For actual historical data, would need a separate analytics table
    const userGrowthTrend = [
      {
        month: 'Current',
        clients: totalClients,
        rms: totalRMs,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalClients,
          totalRMs,
          totalAdmins,
          totalAUM: totalAUMFromTransactions._sum.amount ? Number(totalAUMFromTransactions._sum.amount) : 0,
          totalInstruments: totalInvestments,
          pendingRequests: pendingPurchaseRequests,
          pendingPurchaseRequests,
          totalTransactions,
          completedTransactions,
          transactionSuccessRate:
            totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
        },
        charts: {
          rmDistribution,
          instrumentDistribution: investmentDistribution,
          transactionTrend,
          requestStatusDistribution,
          userGrowthTrend,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
