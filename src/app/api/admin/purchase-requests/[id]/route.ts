/**
 * Admin - Purchase Request Detail API
 * GET /api/admin/purchase-requests/[id]
 * Fetch detailed information about a specific purchase request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET - Fetch purchase request details
 */
export async function GET(_request: NextRequest, context: RouteContext) {
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

    const params = await context.params;
    const { id } = params;

    // Fetch purchase request with full details
    const request = await prisma.purchaseRequest.findUnique({
      where: { id },
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
                totalInvested: true,
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
        instrument: {
          select: {
            symbol: true,
            name: true,
            type: true,
            currentPrice: true,
            currency: true,
            description: true,
            riskRating: true,
          },
        },
        processedBy: {
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
    });

    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Serialize Decimal fields
    const serializedRequest = {
      ...request,
      amount: Number(request.amount),
      quantity: request.quantity ? Number(request.quantity) : null,
      requestedPrice: request.requestedPrice ? Number(request.requestedPrice) : null,
      instrument: {
        ...request.instrument,
        currentPrice: Number(request.instrument.currentPrice),
      },
      client: {
        ...request.client,
        portfolio: request.client.portfolio ? {
          totalValue: Number(request.client.portfolio.totalValue),
          totalInvested: Number(request.client.portfolio.totalInvested),
        } : null,
      },
    };

    return NextResponse.json({
      success: true,
      data: { request: serializedRequest },
    });
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase request' },
      { status: 500 }
    );
  }
}
