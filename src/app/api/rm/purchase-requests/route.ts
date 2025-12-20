/**
 * RM Purchase Requests API
 * GET: List purchase requests for RM's assigned clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { purchaseRequestQuerySchema } from '@/lib/validation/purchase-request.validation';
import { Prisma } from '@prisma/client';

/**
 * GET /api/rm/purchase-requests
 * List purchase requests for RM's assigned clients with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'RM') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get RM record
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      include: {
        assignedClients: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!rm) {
      return NextResponse.json({ success: false, error: 'RM record not found' }, { status: 404 });
    }

    // Get client IDs for filtering
    const clientIds = rm.assignedClients.map((c) => c.id);

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = purchaseRequestQuerySchema.safeParse(searchParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      status,
      clientId,
      instrumentId,
      minAmount,
      maxAmount,
      fromDate,
      toDate,
      search,
      sortBy,
      sortOrder,
    } = validationResult.data;

    // Build where clause
    const where: Prisma.PurchaseRequestWhereInput = {
      clientId: { in: clientIds }, // Only show requests from RM's clients
      ...(status && { status }),
      ...(clientId && { clientId }), // Additional client filter
      ...(instrumentId && { instrumentId }),
      ...(minAmount && { amount: { gte: minAmount } }),
      ...(maxAmount && {
        amount: maxAmount ? { lte: maxAmount } : undefined,
      }),
      ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
      ...(toDate && {
        createdAt: toDate ? { lte: new Date(toDate) } : undefined,
      }),
      ...(search && {
        OR: [
          { trackingNumber: { contains: search, mode: 'insensitive' } },
          {
            client: {
              user: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      }),
    };

    // Get total count
    const totalCount = await prisma.purchaseRequest.count({ where });

    // Build order by clause
    let orderBy: Prisma.PurchaseRequestOrderByWithRelationInput;
    if (sortBy === 'client') {
      orderBy = { client: { user: { firstName: sortOrder } } };
    } else if (sortBy === 'instrument') {
      orderBy = { instrument: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Get requests with related data
    const requests = await prisma.purchaseRequest.findMany({
      where,
      orderBy,
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
              },
            },
          },
        },
        instrument: {
          select: {
            id: true,
            symbol: true,
            name: true,
            type: true,
            currentPrice: true,
            currency: true,
          },
        },
      },
    });

    // Serialize Decimal fields
    const serializedRequests = requests.map((req) => ({
      id: req.id,
      trackingNumber: req.trackingNumber,
      clientId: req.clientId,
      client: {
        id: req.client.id,
        firstName: req.client.user.firstName,
        lastName: req.client.user.lastName,
        email: req.client.user.email,
        riskTolerance: req.client.riskTolerance,
      },
      instrumentId: req.instrumentId,
      instrument: {
        ...req.instrument,
        currentPrice: Number(req.instrument.currentPrice),
      },
      amount: Number(req.amount),
      quantity: req.quantity ? Number(req.quantity) : null,
      requestedPrice: req.requestedPrice ? Number(req.requestedPrice) : null,
      status: req.status,
      clientNotes: req.clientNotes,
      rmNotes: req.rmNotes,
      rejectionReason: req.rejectionReason,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      processedAt: req.processedAt?.toISOString() || null,
    }));

    // Get summary statistics
    const stats = await prisma.purchaseRequest.groupBy({
      by: ['status'],
      where: { clientId: { in: clientIds } },
      _count: true,
      _sum: {
        amount: true,
      },
    });

    const summary = {
      total: stats.reduce((acc, s) => acc + s._count, 0),
      byStatus: stats.map((s) => ({
        status: s.status,
        count: s._count,
        totalAmount: s._sum.amount ? Number(s._sum.amount) : 0,
      })),
    };

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        requests: serializedRequests,
        summary,
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
  } catch (error: unknown) {
    console.error('Error fetching purchase requests:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase requests' },
      { status: 500 }
    );
  }
}
