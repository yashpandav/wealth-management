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
    const allClientIds = rms.flatMap((rm) => rm.assignedClients.map((c) => c.id));

    // One groupBy replaces per-RM findMany for AUM calculation
    const [requestCountsByClientAndStatus, completedAumByClient] = await Promise.all([
      prisma.productPurchaseRequest.groupBy({
        by: ['clientId', 'status'],
        where: { clientId: { in: allClientIds } },
        _count: { _all: true },
      }),
      prisma.productPurchaseRequest.groupBy({
        by: ['clientId'],
        where: { clientId: { in: allClientIds }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    // Build lookup: clientId → { status → count }
    const clientRequestMap = new Map<string, Record<string, number>>();
    for (const row of requestCountsByClientAndStatus) {
      if (!clientRequestMap.has(row.clientId)) clientRequestMap.set(row.clientId, {});
      clientRequestMap.get(row.clientId)![row.status] = row._count._all;
    }

    // Build lookup: clientId → { aum }
    const clientAumMap = new Map(
      completedAumByClient.map((r) => [r.clientId, Number(r._sum.amount || 0)])
    );

    // Assemble per-RM metrics entirely in JS
    const rmPerformance = rms.map((rm) => {
      let totalPurchaseRequests = 0;
      let approvedPurchaseRequests = 0;
      let rejectedPurchaseRequests = 0;
      let pendingPurchaseRequests = 0;

      let totalAUM = 0;
      let activeClients = 0;
      const totalClients = rm.assignedClients.length;

      for (const c of rm.assignedClients) {
        // Aggregate AUM
        const aum = clientAumMap.get(c.id);
        if (aum !== undefined && aum > 0) {
          totalAUM += aum;
          activeClients++;
        }

        // Aggregate Requests
        const counts = clientRequestMap.get(c.id) || {};
        totalPurchaseRequests += Object.values(counts).reduce((s, n) => s + n, 0);
        approvedPurchaseRequests += counts['APPROVED'] || 0;
        rejectedPurchaseRequests += counts['REJECTED'] || 0;
        pendingPurchaseRequests += counts['PENDING'] || 0;
        // COMPLETED requests are also intrinsically approved at some point but standard enum might just be COMPLETED.
        approvedPurchaseRequests += counts['COMPLETED'] || 0;
      }

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
          gainLoss: 0,
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
