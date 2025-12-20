/**
 * Admin - Purchase Requests API
 * GET /api/admin/purchase-requests
 * Fetch all purchase requests for admin review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { RequestStatus } from '@prisma/client';

/**
 * GET - Fetch all purchase requests
 * Supports filtering by status
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

    // Authorization check - ADMIN only
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as RequestStatus | null;

    // Build where clause
    const where: { status?: RequestStatus } = {};
    if (status) {
      where.status = status;
    }

    // Fetch purchase requests
    const requests = await prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            assignedRM: {
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
        },
        instrument: {
          select: {
            symbol: true,
            name: true,
            type: true,
            currentPrice: true,
            currency: true,
          },
        },
        processedBy: {
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
    const serializedRequests = requests.map(req => ({
      ...req,
      amount: Number(req.amount),
      quantity: req.quantity ? Number(req.quantity) : null,
      requestedPrice: req.requestedPrice ? Number(req.requestedPrice) : null,
      instrument: {
        ...req.instrument,
        currentPrice: Number(req.instrument.currentPrice),
      },
    }));

    return NextResponse.json({
      success: true,
      data: { requests: serializedRequests },
    });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase requests' },
      { status: 500 }
    );
  }
}
