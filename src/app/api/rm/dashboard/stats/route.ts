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
      pendingWithdrawalRequests,
      pendingProductRequests,
      totalAUM,
      allWithdrawalRequests,
      allProductPurchaseRequests,
      clientsWithPortfolios,
    ] = await Promise.all([
      // Total assigned clients
      prisma.client.count({
        where: { id: { in: clientIds } },
      }),

      // Pending withdrawal requests
      prisma.withdrawalRequest.count({
        where: {
          clientId: { in: clientIds },
          status: 'RM_REVIEW',
        },
      }),

      // Pending product purchase requests
      prisma.productPurchaseRequest.count({
        where: {
          clientId: { in: clientIds },
          status: 'PENDING',
        },
      }),

      // Total AUM (Assets Under Management)
      prisma.portfolio.aggregate({
        where: { clientId: { in: clientIds } },
        _sum: { totalValue: true },
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

    // Recent product purchase requests
    const recentProductRequests = await prisma.productPurchaseRequest.findMany({
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
        product: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    });

    // Combine and sort activities
    const combinedActivities = [
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
      ...recentProductRequests.map((req) => ({
        id: req.id,
        type: 'PRODUCT' as const,
        clientName: `${req.client.user.firstName} ${req.client.user.lastName}`,
        instrumentName: req.product.name,
        instrumentSymbol: req.product.currency,
        amount: Number(req.amount),
        status: req.status,
        createdAt: req.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Calculate request status distribution
    const withdrawalStatusCounts = allWithdrawalRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const productStatusCounts = allProductPurchaseRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestStatusData = [
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
      { name: 'Product - Pending', value: productStatusCounts['PENDING'] || 0, fill: '#8b5cf6' },
      { name: 'Product - Approved', value: productStatusCounts['APPROVED'] || 0, fill: '#06b6d4' },
      { name: 'Product - Rejected', value: productStatusCounts['REJECTED'] || 0, fill: '#f43f5e' },
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

      const withdrawalCount = allWithdrawalRequests.filter((req) => {
        const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
        return reqDate === dateStr;
      }).length;

      const productCount = allProductPurchaseRequests.filter((req) => {
        const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
        return reqDate === dateStr;
      }).length;

      activityTrend.push({
        date: dateStr,
        withdrawals: withdrawalCount,
        products: productCount,
      });
    }

    // Approval rates
    const totalWithdrawalRequests = allWithdrawalRequests.length;
    const approvedWithdrawals = allWithdrawalRequests.filter((r) =>
      ['RM_APPROVED', 'ADMIN_APPROVED', 'COMPLETED'].includes(r.status)
    ).length;
    const totalProductRequests = allProductPurchaseRequests.length;
    const approvedProducts = allProductPurchaseRequests.filter((r) => r.status === 'APPROVED').length;

    const approvalRates = {
      withdrawalApprovalRate: totalWithdrawalRequests > 0 ? (approvedWithdrawals / totalWithdrawalRequests) * 100 : 0,
      productApprovalRate: totalProductRequests > 0 ? (approvedProducts / totalProductRequests) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalClients,
          pendingWithdrawalRequests,
          pendingProductRequests,
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
