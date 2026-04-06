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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
      purchaseRequestStatusCounts,
      transactionTrendRaw,
      clientAumByClient,
    ] = await Promise.all([
      // Total clients
      prisma.client.count(),

      // Total RMs
      prisma.relationshipManager.count(),

      // Total admins
      prisma.user.count({ where: { role: 'ADMIN' } }),

      // Total AUM (sum of all completed purchase transactions)
      prisma.transaction.aggregate({
        where: { type: 'PURCHASE', status: 'COMPLETED' },
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
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
          assignedClients: { select: { id: true } },
        },
      }),

      // All active investments for distribution chart
      prisma.investment.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      }),

      // Purchase request status counts via groupBy (replaces unbounded findMany)
      prisma.productPurchaseRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Transaction volume trend — last 30 days grouped by date + type (replaces unbounded findMany)
      prisma.$queryRaw<Array<{ date: Date; type: string; volume: number }>>`
        SELECT
          DATE("createdAt") AS date,
          type,
          SUM(amount)::float AS volume
        FROM transactions
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt"), type
        ORDER BY date
      `,

      // AUM per client (for RM distribution) — one query replacing N per-RM aggregates
      prisma.transaction.groupBy({
        by: ['clientId'],
        where: { type: 'PURCHASE', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    // Build client → AUM map
    const clientAumMap = new Map(
      clientAumByClient.map((r) => [r.clientId, Number(r._sum.amount || 0)])
    );

    // RM distribution: sum client AUMs per RM in JS (no extra DB calls)
    const rmDistribution = allRMs
      .map((rm) => ({
        name: `${rm.user.firstName} ${rm.user.lastName}`,
        clients: rm.assignedClients.length,
        aum: rm.assignedClients.reduce((sum, c) => sum + (clientAumMap.get(c.id) || 0), 0),
      }))
      .sort((a, b) => b.aum - a.aum)
      .slice(0, 10);

    // Calculate investment distribution by name
    const investmentDistribution = allInvestments.map((inv) => ({
      name: inv.name,
      value: 1,
    }));

    // Build transaction trend from grouped DB result
    const trendByDate = new Map<string, { purchases: number; withdrawals: number }>();
    for (const row of transactionTrendRaw) {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (!trendByDate.has(dateStr)) trendByDate.set(dateStr, { purchases: 0, withdrawals: 0 });
      const entry = trendByDate.get(dateStr)!;
      if (row.type === 'PURCHASE') entry.purchases += row.volume;
      else if (row.type === 'WITHDRAWAL') entry.withdrawals += row.volume;
    }

    const transactionTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = trendByDate.get(dateStr) || { purchases: 0, withdrawals: 0 };
      transactionTrend.push({
        date: dateStr,
        purchases: entry.purchases,
        withdrawals: entry.withdrawals,
        total: entry.purchases + entry.withdrawals,
      });
    }

    // Build request status distribution from groupBy result
    const purchaseStatusMap = new Map(
      purchaseRequestStatusCounts.map((r) => [r.status, r._count._all])
    );

    const requestStatusDistribution = [
      { name: 'Purchase - Pending', value: purchaseStatusMap.get('PENDING') || 0, fill: '#fbbf24' },
      { name: 'Purchase - Approved', value: purchaseStatusMap.get('APPROVED') || 0, fill: '#10b981' },
      { name: 'Purchase - Rejected', value: purchaseStatusMap.get('REJECTED') || 0, fill: '#ef4444' },
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
