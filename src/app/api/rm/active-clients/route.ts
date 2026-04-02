/**
 * API Route: RM Active Clients
 * GET - Fetch assigned clients with verified KYC (eligible for transactions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    // Get RM record
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
    });

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'RM profile not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'assignedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause - assigned to RM and VERIFIED status
    // CRITICAL: Exclude archived users (KYC expired)
    const where: Prisma.ClientWhereInput = {
      assignedRMId: rm.id,
      verificationStatus: 'VERIFIED',
      user: {
        isArchived: false, // Exclude archived users
      },
    };

    // Search filter
    if (search) {
      where.user = {
        isArchived: false, // Maintain archived exclusion
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Build sort
    let orderBy: Prisma.ClientOrderByWithRelationInput;
    if (sortBy === 'name') {
      orderBy = { user: { firstName: sortOrder === 'asc' ? 'asc' : 'desc' } };
    } else {
      orderBy = { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' };
    }

    // Fetch clients and total count
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    // Calculate portfolio values for each client
    const serializedClients = await Promise.all(
      clients.map(async (client) => {
        // Fetch investment and payout aggregates in parallel
        const [investmentAgg, payoutAgg] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              clientId: client.id,
              type: 'PURCHASE',
              status: 'COMPLETED',
            },
            _sum: {
              amount: true,
            },
          }),
          prisma.payout.aggregate({
            where: {
              clientId: client.id,
              status: 'COMPLETED',
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

        const totalInvested = Number(investmentAgg._sum.amount || 0);
        const totalInterestEarned = Number(payoutAgg._sum.amount || 0);
        const totalValue = totalInvested + totalInterestEarned;
        const totalGainLoss = totalInterestEarned;
        const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

        return {
          id: client.id,
          user: client.user,
          kycVerified: client.kycVerified,
          verificationStatus: client.verificationStatus,
          assignedAt: client.assignedAt.toISOString(),
          portfolio: {
            totalValue,
            totalInvested,
            totalGainLoss,
            totalGainLossPercent,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        clients: serializedClients,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching active clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active clients' },
      { status: 500 }
    );
  }
}
