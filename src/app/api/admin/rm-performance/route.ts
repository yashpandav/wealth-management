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
          select: {
            id: true,
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
        // Get product purchase request statistics
        const [
          totalPurchaseRequests,
          approvedPurchaseRequests,
          rejectedPurchaseRequests,
          pendingPurchaseRequests,
        ] = await Promise.all([
          prisma.productPurchaseRequest.count({
            where: { assignedRMId: rm.id },
          }),
          prisma.productPurchaseRequest.count({
            where: {
              assignedRMId: rm.id,
              status: 'APPROVED',
            },
          }),
          prisma.productPurchaseRequest.count({
            where: {
              assignedRMId: rm.id,
              status: 'REJECTED',
            },
          }),
          prisma.productPurchaseRequest.count({
            where: {
              assignedRMId: rm.id,
              status: 'PENDING',
            },
          }),
        ]);

        // Calculate client metrics
        const totalClients = rm.assignedClients.length;

        // Get completed product purchase requests for this RM's clients
        const clientIds = rm.assignedClients.map((c) => c.id);
        const completedRequests = await prisma.productPurchaseRequest.findMany({
          where: {
            clientId: { in: clientIds },
            status: 'COMPLETED',
          },
          select: {
            amount: true,
            clientId: true,
          },
        });

        // Calculate AUM (Assets Under Management) from completed requests
        const totalAUM = completedRequests.reduce((sum, req) => {
          return sum + Number(req.amount);
        }, 0);

        const totalInvested = totalAUM; // For product purchases, invested = total value

        // Count active clients (clients with at least one completed purchase)
        const activeClientIds = new Set(completedRequests.map((req) => req.clientId));
        const activeClients = activeClientIds.size;

        // Note: totalGainLoss calculation would require payout tracking
        // For now, set to 0 as payouts are tracked separately
        const totalGainLoss = 0;

        const avgAUMPerClient = totalClients > 0 ? totalAUM / totalClients : 0;

        // Calculate approval rates
        const purchaseApprovalRate =
          totalPurchaseRequests > 0
            ? (approvedPurchaseRequests / totalPurchaseRequests) * 100
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
