/**
 * API Route: RM Dashboard Stats
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
        { success: false, error: 'RM profile not found' },
        { status: 404 }
      );
    }

    const clientIds = rm.assignedClients.map((c) => c.id);

    // Fetch all statistics in parallel
    const [
      totalClients,
      pendingPurchaseRequests,
      pendingWithdrawalRequests,
      totalAUM,
      recentActivities,
      allPurchaseRequests,
      allWithdrawalRequests,
      clientsWithPortfolios,
    ] = await Promise.all([
      // Total assigned clients
      prisma.client.count({
        where: { id: { in: clientIds } },
      }),

      // Pending purchase requests
      prisma.purchaseRequest.count({
        where: {
          clientId: { in: clientIds },
          status: 'PENDING',
        },
      }),

      // Pending withdrawal requests
      prisma.withdrawalRequest.count({
        where: {
          clientId: { in: clientIds },
          status: 'RM_REVIEW',
        },
      }),

      // Total AUM (Assets Under Management)
      prisma.portfolio.aggregate({
        where: { clientId: { in: clientIds } },
        _sum: { totalValue: true },
      }),

      // Recent activities (last 10 requests)
      prisma.purchaseRequest.findMany({
        where: { clientId: { in: clientIds } },
        take: 5,
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
          instrument: {
            select: {
              symbol: true,
              name: true,
            },
          },
        },
      }),

      // All purchase requests for stats
      prisma.purchaseRequest.findMany({
        where: { clientId: { in: clientIds } },
        select: {
          id: true,
          status: true,
          createdAt: true,
          amount: true,
        },
      }),

      // All withdrawal requests for stats
      prisma.withdrawalRequest.findMany({
        where: { clientId: { in: clientIds } },
        select: {
          id: true,
          status: true,
          createdAt: true,
          amount: true,
        },
      }),

      // Clients with portfolios for distribution
      prisma.client.findMany({
        where: { id: { in: clientIds } },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          portfolio: {
            select: {
              totalValue: true,
            },
          },
        },
        orderBy: {
          portfolio: {
            totalValue: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Recent withdrawal activities
    const recentWithdrawalActivities = await prisma.withdrawalRequest.findMany({
      where: { clientId: { in: clientIds } },
      take: 5,
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
      },
    });

    // Combine and sort activities
    const combinedActivities = [
      ...recentActivities.map((req) => ({
        id: req.id,
        type: 'PURCHASE' as const,
        clientName: `${req.client.user.firstName} ${req.client.user.lastName}`,
        instrumentName: req.instrument?.name || 'Unknown',
        instrumentSymbol: req.instrument?.symbol || '',
        amount: Number(req.amount),
        status: req.status,
        createdAt: req.createdAt.toISOString(),
      })),
      ...recentWithdrawalActivities.map((req) => ({
        id: req.id,
        type: 'WITHDRAWAL' as const,
        clientName: `${req.client.user.firstName} ${req.client.user.lastName}`,
        instrumentName: '',
        instrumentSymbol: '',
        amount: Number(req.amount),
        status: req.status,
        createdAt: req.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Calculate request status distribution
    const purchaseStatusCounts = allPurchaseRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const withdrawalStatusCounts = allWithdrawalRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestStatusData = [
      { name: 'Purchase - Pending', value: purchaseStatusCounts['PENDING'] || 0, fill: '#fbbf24' },
      { name: 'Purchase - Approved', value: purchaseStatusCounts['APPROVED'] || 0, fill: '#10b981' },
      { name: 'Purchase - Rejected', value: purchaseStatusCounts['REJECTED'] || 0, fill: '#ef4444' },
      { name: 'Withdrawal - Pending', value: withdrawalStatusCounts['RM_REVIEW'] || 0, fill: '#f97316' },
      {
        name: 'Withdrawal - Approved',
        value: (withdrawalStatusCounts['RM_APPROVED'] || 0) + (withdrawalStatusCounts['ADMIN_APPROVED'] || 0) + (withdrawalStatusCounts['COMPLETED'] || 0),
        fill: '#22c55e',
      },
      {
        name: 'Withdrawal - Rejected',
        value: (withdrawalStatusCounts['RM_REJECTED'] || 0) + (withdrawalStatusCounts['ADMIN_REJECTED'] || 0),
        fill: '#dc2626',
      },
    ].filter((item) => item.value > 0);

    // Top clients by AUM
    const topClientsByAUM = clientsWithPortfolios
      .filter((client) => client.portfolio)
      .map((client) => ({
        name: `${client.user.firstName} ${client.user.lastName}`,
        value: Number(client.portfolio?.totalValue || 0),
      }))
      .slice(0, 8);

    // Activity trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const purchaseCount = allPurchaseRequests.filter((req) => {
        const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
        return reqDate === dateStr;
      }).length;

      const withdrawalCount = allWithdrawalRequests.filter((req) => {
        const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
        return reqDate === dateStr;
      }).length;

      activityTrend.push({
        date: dateStr,
        purchases: purchaseCount,
        withdrawals: withdrawalCount,
      });
    }

    // Approval rates
    const totalPurchaseRequests = allPurchaseRequests.length;
    const approvedPurchases = allPurchaseRequests.filter((r) => r.status === 'APPROVED').length;
    const totalWithdrawalRequests = allWithdrawalRequests.length;
    const approvedWithdrawals = allWithdrawalRequests.filter((r) =>
      ['RM_APPROVED', 'ADMIN_APPROVED', 'COMPLETED'].includes(r.status)
    ).length;

    const approvalRates = {
      purchaseApprovalRate: totalPurchaseRequests > 0 ? (approvedPurchases / totalPurchaseRequests) * 100 : 0,
      withdrawalApprovalRate: totalWithdrawalRequests > 0 ? (approvedWithdrawals / totalWithdrawalRequests) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalClients,
          pendingPurchaseRequests,
          pendingWithdrawalRequests,
          totalAUM: Number(totalAUM._sum.totalValue || 0),
        },
        recentActivities: combinedActivities,
        charts: {
          requestStatusData,
          topClientsByAUM,
          activityTrend,
          approvalRates,
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
