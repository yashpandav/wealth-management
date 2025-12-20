/**
 * RM Withdrawal Requests List API
 * GET /api/rm/withdrawal-requests
 * Returns withdrawal requests for RM's assigned clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WithdrawalStatus } from '@prisma/client';

/**
 * GET - Fetch withdrawal requests for RM's assigned clients
 * Only accessible to RMs for their clients' requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Authorization check - RM only
    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as WithdrawalStatus | null;

    // Get RM's assigned client IDs for authorization
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
        { success: false, error: 'Relationship Manager not found' },
        { status: 404 }
      );
    }

    const clientIds = rm.assignedClients.map((c) => c.id);

    if (clientIds.length === 0) {
      // No assigned clients, return empty list
      return NextResponse.json({
        success: true,
        data: {
          requests: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      });
    }

    // Build where clause
    const where = {
      clientId: { in: clientIds },
      ...(status && { status }),
    };

    // Get total count
    const totalCount = await prisma.withdrawalRequest.count({ where });

    // Get requests
    const requests = await prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            portfolio: {
              select: {
                totalValue: true,
              },
            },
          },
        },
        processedByRM: {
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

    // Serialize Decimal fields
    const serializedRequests = requests.map((req) => ({
      ...req,
      amount: Number(req.amount),
      client: {
        ...req.client,
        portfolio: req.client.portfolio
          ? {
              ...req.client.portfolio,
              totalValue: Number(req.client.portfolio.totalValue),
            }
          : null,
      },
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      rmProcessedAt: req.rmProcessedAt?.toISOString() || null,
      adminProcessedAt: req.adminProcessedAt?.toISOString() || null,
      rejectedAt: req.rejectedAt?.toISOString() || null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        requests: serializedRequests,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}
