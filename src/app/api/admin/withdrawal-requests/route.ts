/**
 * Admin - Withdrawal Requests API
 * List all withdrawal requests requiring admin approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { WithdrawalStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin authorization
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as WithdrawalStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where = status ? { status } : {};

    // Fetch withdrawal requests with pagination
    const [requests, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
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
                  totalGainLoss: true,
                },
              },
              assignedRM: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
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
                  email: true,
                },
              },
            },
          },
          approvedByAdmin: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // RM_APPROVED first (pending admin review)
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    // Serialize Decimal fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedRequests = requests.map((request: any) => ({
      ...request,
      amount: Number(request.amount),
      client: {
        ...request.client,
        portfolio: request.client.portfolio
          ? {
              totalValue: Number(request.client.portfolio.totalValue),
              totalGainLoss: Number(request.client.portfolio.totalGainLoss),
            }
          : null,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        requests: serializedRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests for admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}
