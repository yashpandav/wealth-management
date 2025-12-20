/**
 * API Route: Admin Analytics Overview
 * GET - Fetch system-wide analytics metrics for admin dashboard
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
      totalAUM,
      totalInstruments,
      pendingPurchaseRequests,
      pendingWithdrawalRequests,
      totalTransactions,
      completedTransactions,
      allRMs,
      allInstruments,
      allPurchaseRequests,
      allWithdrawalRequests,
      allTransactions,
    ] = await Promise.all([
      // Total clients
      prisma.client.count(),

      // Total RMs
      prisma.relationshipManager.count(),

      // Total admins
      prisma.user.count({ where: { role: 'ADMIN' } }),

      // Total AUM (sum of all portfolio values)
      prisma.portfolio.aggregate({
        _sum: { totalValue: true },
      }),

      // Total active instruments
      prisma.instrument.count({ where: { isActive: true } }),

      // Pending purchase requests
      prisma.purchaseRequest.count({ where: { status: 'PENDING' } }),

      // Pending withdrawal requests (RM_REVIEW and ADMIN_REVIEW)
      prisma.withdrawalRequest.count({
        where: {
          status: {
            in: ['RM_REVIEW', 'ADMIN_REVIEW'],
          },
        },
      }),

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
            include: {
              portfolio: {
                select: {
                  totalValue: true,
                },
              },
            },
          },
        },
      }),

      // All instruments by type
      prisma.instrument.findMany({
        where: { isActive: true },
        select: {
          id: true,
          type: true,
        },
      }),

      // All purchase requests for trends
      prisma.purchaseRequest.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
          amount: true,
        },
      }),

      // All withdrawal requests for trends
      prisma.withdrawalRequest.findMany({
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

    // Calculate RM distribution by client count
    const rmDistribution = allRMs.map((rm) => ({
      name: `${rm.user.firstName} ${rm.user.lastName}`,
      clients: rm.assignedClients.length,
      aum: rm.assignedClients.reduce(
        (sum, client) => sum + (client.portfolio ? Number(client.portfolio.totalValue) : 0),
        0
      ),
    })).sort((a, b) => b.aum - a.aum).slice(0, 10);

    // Calculate instrument distribution by type
    const instrumentsByType = allInstruments.reduce((acc, inst) => {
      acc[inst.type] = (acc[inst.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const instrumentDistribution = Object.entries(instrumentsByType).map(([type, count]) => ({
      name: type.replace('_', ' '),
      value: count,
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

    const withdrawalStatusCounts = allWithdrawalRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestStatusDistribution = [
      { name: 'Purchase - Pending', value: purchaseStatusCounts['PENDING'] || 0, fill: '#fbbf24' },
      { name: 'Purchase - Approved', value: purchaseStatusCounts['APPROVED'] || 0, fill: '#10b981' },
      { name: 'Purchase - Rejected', value: purchaseStatusCounts['REJECTED'] || 0, fill: '#ef4444' },
      {
        name: 'Withdrawal - RM Review',
        value: withdrawalStatusCounts['RM_REVIEW'] || 0,
        fill: '#f97316',
      },
      {
        name: 'Withdrawal - Admin Review',
        value: withdrawalStatusCounts['ADMIN_REVIEW'] || 0,
        fill: '#fb923c',
      },
      {
        name: 'Withdrawal - Approved',
        value:
          (withdrawalStatusCounts['RM_APPROVED'] || 0) +
          (withdrawalStatusCounts['ADMIN_APPROVED'] || 0) +
          (withdrawalStatusCounts['COMPLETED'] || 0),
        fill: '#22c55e',
      },
      {
        name: 'Withdrawal - Rejected',
        value: (withdrawalStatusCounts['RM_REJECTED'] || 0) + (withdrawalStatusCounts['ADMIN_REJECTED'] || 0),
        fill: '#dc2626',
      },
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
          totalAUM: totalAUM._sum.totalValue ? Number(totalAUM._sum.totalValue) : 0,
          totalInstruments,
          pendingRequests: pendingPurchaseRequests + pendingWithdrawalRequests,
          pendingPurchaseRequests,
          pendingWithdrawalRequests,
          totalTransactions,
          completedTransactions,
          transactionSuccessRate:
            totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
        },
        charts: {
          rmDistribution,
          instrumentDistribution,
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
