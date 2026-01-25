/**
 * API Route: RM Dashboard Stats (Updated for Investment Product Model)
 * GET - Fetch dashboard statistics for the logged-in RM
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    // Role authorization
    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    // Get RM's assigned client IDs
    // CRITICAL: Exclude archived users from dashboard stats
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      include: {
        assignedClients: {
          where: {
            user: {
              isArchived: false, // Exclude archived users
            },
          },
          select: { id: true },
        },
      },
    });

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'RM profile not found' },
        { status: 404 }
      );
    }

    const clientIds = rm.assignedClients.map((c) => c.id);

    // Fetch all statistics in parallel
    const [
      totalClients,
      pendingProductRequests,
      totalAUM,
      allProductPurchaseRequests,
      topClientsByAUM,
    ] = await Promise.all([
      // Total assigned clients
      prisma.client.count({
        where: { id: { in: clientIds } },
      }),

      // Pending product purchase requests
      prisma.productPurchaseRequest.count({
        where: {
          clientId: { in: clientIds },
          status: 'PENDING',
        },
      }),

      // Total AUM (Assets Under Management) from completed product purchases
      prisma.productPurchaseRequest.aggregate({
        where: {
          clientId: { in: clientIds },
          status: { in: ['APPROVED', 'COMPLETED'] },
        },
        _sum: { amount: true },
      }),

      // All product purchase requests for stats
      prisma.productPurchaseRequest.findMany({
        where: { clientId: { in: clientIds } },
        select: {
          id: true,
          status: true,
          createdAt: true,
          amount: true,
        },
      }),

      // Top clients by AUM (based on their total invested amounts)
      prisma.client.findMany({
        where: { id: { in: clientIds } },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          productPurchaseRequests: {
            where: {
              status: { in: ['APPROVED', 'COMPLETED'] },
            },
            select: {
              amount: true,
            },
          },
        },
        take: 10,
      }),
    ]);

    // Recent product purchase requests
    const recentProductRequests = await prisma.productPurchaseRequest.findMany({
      where: { clientId: { in: clientIds } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        investment: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    });

    // Map activities
    const combinedActivities = recentProductRequests.map((req) => ({
      id: req.id,
      type: 'INVESTMENT' as const,
      clientName: `${req.client.user.firstName} ${req.client.user.lastName}`,
      instrumentName: req.investment.name,
      instrumentSymbol: req.investment.currency,
      amount: Number(req.amount),
      status: req.status,
      createdAt: req.createdAt.toISOString(),
    }));

    // Calculate request status distribution
    const productStatusCounts = allProductPurchaseRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestStatusData = [
      { name: 'Plans - Pending', value: productStatusCounts['PENDING'] || 0, fill: '#f59e0b' },
      { name: 'Plans - Processing', value: productStatusCounts['PROCESSING'] || 0, fill: '#3b82f6' },
      { name: 'Plans - Approved', value: productStatusCounts['APPROVED'] || 0, fill: '#10b981' },
      { name: 'Plans - Completed', value: productStatusCounts['COMPLETED'] || 0, fill: '#06b6d4' },
      { name: 'Plans - Rejected', value: productStatusCounts['REJECTED'] || 0, fill: '#ef4444' },
    ].filter((item) => item.value > 0);

    // Top clients by AUM - calculate total invested per client
    const clientsWithAUM = topClientsByAUM.map((client) => {
      const totalInvested = client.productPurchaseRequests.reduce(
        (sum, req) => sum + Number(req.amount),
        0
      );
      return {
        name: `${client.user.firstName} ${client.user.lastName}`,
        value: totalInvested,
      };
    });

    // Sort by AUM and take top 8
    const topClientsByAUMSorted = clientsWithAUM
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Activity trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const productCount = allProductPurchaseRequests.filter((req) => {
        const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
        return reqDate === dateStr;
      }).length;

      activityTrend.push({
        date: dateStr,
        withdrawals: 0, // Removed withdrawal functionality
        products: productCount,
      });
    }

    // Approval rates
    const totalProductRequests = allProductPurchaseRequests.length;
    const approvedProducts = allProductPurchaseRequests.filter((r) =>
      ['APPROVED', 'COMPLETED'].includes(r.status)
    ).length;

    const approvalRates = {
      withdrawalApprovalRate: 0, // Removed withdrawal functionality
      productApprovalRate: totalProductRequests > 0 ? (approvedProducts / totalProductRequests) * 100 : 0,
    };

    // Fetch payout data for clients
    const [payoutStats, recentPayouts] = await Promise.all([
      // Payout statistics by status
      prisma.payout.groupBy({
        by: ['status'],
        where: { clientId: { in: clientIds } },
        _count: true,
        _sum: { amount: true },
      }),

      // Recent payouts for monitoring (last 30 days)
      prisma.payout.findMany({
        where: {
          clientId: { in: clientIds },
          scheduledDate: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          productPurchaseRequest: {
            include: {
              investment: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate payout metrics
    const totalPayoutsPaid = payoutStats
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + (s._sum.amount?.toNumber() || 0), 0);

    const pendingPayoutsCount = payoutStats.find((s) => s.status === 'PENDING')?._count || 0;
    const completedPayoutsCount = payoutStats.find((s) => s.status === 'COMPLETED')?._count || 0;
    const pendingPayoutsAmount = payoutStats.find((s) => s.status === 'PENDING')?._sum.amount?.toNumber() || 0;

    // Payout status distribution for chart
    const payoutStatusData = [
      { name: 'Pending', value: pendingPayoutsCount, fill: '#f59e0b' },
      { name: 'Completed', value: completedPayoutsCount, fill: '#10b981' },
      { name: 'Failed', value: payoutStats.find((s) => s.status === 'FAILED')?._count || 0, fill: '#ef4444' },
    ].filter((item) => item.value > 0);

    // Format recent payouts for display
    const recentPayoutsFormatted = recentPayouts.map((p) => ({
      id: p.id,
      clientName: `${p.client.user.firstName} ${p.client.user.lastName}`,
      planName: p.productPurchaseRequest.investment.name,
      amount: p.amount.toNumber(),
      scheduledDate: p.scheduledDate.toISOString(),
      status: p.status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalClients,
          pendingWithdrawalRequests: 0, // Removed withdrawal functionality
          pendingProductRequests,
          totalAUM: Number(totalAUM._sum.amount || 0),
          pendingPayouts: pendingPayoutsCount,
          pendingPayoutsAmount: pendingPayoutsAmount,
          totalPayoutsPaid: totalPayoutsPaid,
        },
        recentActivities: combinedActivities,
        recentPayouts: recentPayoutsFormatted,
        charts: {
          requestStatusData,
          topClientsByAUM: topClientsByAUMSorted,
          activityTrend,
          approvalRates,
          payoutStatusData,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching RM dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
