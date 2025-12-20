/**
 * Admin - RM Performance API
 * GET /api/admin/rm-performance
 * Fetch performance metrics for all Relationship Managers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET - Fetch all RMs with their performance metrics
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Authorization check - ADMIN only
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all RMs with related data
    const rms = await prisma.relationshipManager.findMany({
      select: {
        id: true,
        specialization: true,
        maxClientLimit: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        assignedClients: {
          include: {
            portfolio: {
              select: {
                totalValue: true,
                totalInvested: true,
                totalGainLoss: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    // Calculate performance metrics for each RM
    const rmPerformance = await Promise.all(
      rms.map(async (rm) => {
        // Get purchase request statistics
        const [
          totalPurchaseRequests,
          approvedPurchaseRequests,
          rejectedPurchaseRequests,
          pendingPurchaseRequests,
        ] = await Promise.all([
          prisma.purchaseRequest.count({
            where: { processedById: rm.id },
          }),
          prisma.purchaseRequest.count({
            where: {
              processedById: rm.id,
              status: 'APPROVED',
            },
          }),
          prisma.purchaseRequest.count({
            where: {
              processedById: rm.id,
              status: 'REJECTED',
            },
          }),
          prisma.purchaseRequest.count({
            where: {
              client: { assignedRMId: rm.id },
              status: 'PENDING',
            },
          }),
        ]);

        // Get withdrawal request statistics
        const [
          totalWithdrawalRequests,
          approvedWithdrawalRequests,
          rejectedWithdrawalRequests,
          pendingWithdrawalRequests,
        ] = await Promise.all([
          prisma.withdrawalRequest.count({
            where: { processedByRMId: rm.id },
          }),
          prisma.withdrawalRequest.count({
            where: {
              processedByRMId: rm.id,
              status: {
                in: ['RM_APPROVED', 'ADMIN_APPROVED', 'COMPLETED'],
              },
            },
          }),
          prisma.withdrawalRequest.count({
            where: {
              processedByRMId: rm.id,
              status: 'RM_REJECTED',
            },
          }),
          prisma.withdrawalRequest.count({
            where: {
              client: { assignedRMId: rm.id },
              status: {
                in: ['PENDING', 'RM_REVIEW'],
              },
            },
          }),
        ]);

        // Calculate client metrics
        const totalClients = rm.assignedClients.length;
        const activeClients = rm.assignedClients.filter(
          (c) => c.portfolio && Number(c.portfolio.totalValue) > 0
        ).length;

        // Calculate AUM (Assets Under Management)
        const totalAUM = rm.assignedClients.reduce((sum, client) => {
          return sum + (client.portfolio ? Number(client.portfolio.totalValue) : 0);
        }, 0);

        const totalInvested = rm.assignedClients.reduce((sum, client) => {
          return sum + (client.portfolio ? Number(client.portfolio.totalInvested) : 0);
        }, 0);

        const totalGainLoss = rm.assignedClients.reduce((sum, client) => {
          return sum + (client.portfolio ? Number(client.portfolio.totalGainLoss) : 0);
        }, 0);

        const avgAUMPerClient = totalClients > 0 ? totalAUM / totalClients : 0;

        // Calculate approval rates
        const purchaseApprovalRate =
          totalPurchaseRequests > 0
            ? (approvedPurchaseRequests / totalPurchaseRequests) * 100
            : 0;

        const withdrawalApprovalRate =
          totalWithdrawalRequests > 0
            ? (approvedWithdrawalRequests / totalWithdrawalRequests) * 100
            : 0;

        return {
          id: rm.id,
          user: rm.user,
          specialization: rm.specialization,
          maxClientLimit: rm.maxClientLimit,
          clients: {
            total: totalClients,
            active: activeClients,
            utilization: rm.maxClientLimit ? (totalClients / rm.maxClientLimit) * 100 : 0,
          },
          aum: {
            total: totalAUM,
            invested: totalInvested,
            gainLoss: totalGainLoss,
            avgPerClient: avgAUMPerClient,
          },
          purchaseRequests: {
            total: totalPurchaseRequests,
            approved: approvedPurchaseRequests,
            rejected: rejectedPurchaseRequests,
            pending: pendingPurchaseRequests,
            approvalRate: purchaseApprovalRate,
          },
          withdrawalRequests: {
            total: totalWithdrawalRequests,
            approved: approvedWithdrawalRequests,
            rejected: rejectedWithdrawalRequests,
            pending: pendingWithdrawalRequests,
            approvalRate: withdrawalApprovalRate,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { rms: rmPerformance },
    });
  } catch (error) {
    console.error('Error fetching RM performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RM performance data' },
      { status: 500 }
    );
  }
}
