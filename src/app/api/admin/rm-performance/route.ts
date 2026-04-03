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

    // Batch all RM metrics into two queries instead of 5 per RM
    const allRmIds = rms.map((rm) => rm.id);
    const allClientIds = rms.flatMap((rm) => rm.assignedClients.map((c) => c.id));

    const [requestCountsByRmAndStatus, completedAumByClient] = await Promise.all([
      // One groupBy replaces 4 count() calls per RM
      prisma.productPurchaseRequest.groupBy({
        by: ['assignedRMId', 'status'],
        where: { assignedRMId: { in: allRmIds } },
        _count: { _all: true },
      }),
      // One groupBy replaces per-RM findMany for AUM calculation
      prisma.productPurchaseRequest.groupBy({
        by: ['clientId'],
        where: { clientId: { in: allClientIds }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    // Build lookup: rmId → { status → count }
    const rmRequestMap = new Map<string, Record<string, number>>();
    for (const row of requestCountsByRmAndStatus) {
      if (!row.assignedRMId) continue;
      if (!rmRequestMap.has(row.assignedRMId)) rmRequestMap.set(row.assignedRMId, {});
      rmRequestMap.get(row.assignedRMId)![row.status] = row._count._all;
    }

    // Build lookup: clientId → { aum, hasCompleted }
    const clientAumMap = new Map(
      completedAumByClient.map((r) => [r.clientId, Number(r._sum.amount || 0)])
    );

    // Assemble per-RM metrics entirely in JS — zero additional DB calls
    const rmPerformance = rms.map((rm) => {
      const counts = rmRequestMap.get(rm.id) || {};
      const totalPurchaseRequests = Object.values(counts).reduce((s, n) => s + n, 0);
      const approvedPurchaseRequests = counts['APPROVED'] || 0;
      const rejectedPurchaseRequests = counts['REJECTED'] || 0;
      const pendingPurchaseRequests = counts['PENDING'] || 0;

      const totalClients = rm.assignedClients.length;
      let totalAUM = 0;
      let activeClients = 0;
      for (const c of rm.assignedClients) {
        const aum = clientAumMap.get(c.id);
        if (aum !== undefined) {
          totalAUM += aum;
          activeClients++;
        }
      }

      const totalGainLoss = 0;
      const avgAUMPerClient = totalClients > 0 ? totalAUM / totalClients : 0;
      const purchaseApprovalRate =
        totalPurchaseRequests > 0 ? (approvedPurchaseRequests / totalPurchaseRequests) * 100 : 0;

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
          invested: totalAUM,
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
    });

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
