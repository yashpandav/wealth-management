/**
 * RM Product Investment Requests API
 * GET: List product investment requests for RM's assigned clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Prisma, RequestStatus } from '@prisma/client';

/**
 * GET /api/rm/product-requests
 * List product investment requests for RM's assigned clients with filtering and sorting
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as RequestStatus | null;
    const clientId = searchParams.get('clientId');
    const productId = searchParams.get('productId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: Prisma.ProductPurchaseRequestWhereInput = {
      clientId: { in: clientIds }, // Only show requests from RM's clients
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(productId && { productId }),
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
          {
            product: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    // Get total count
    const totalCount = await prisma.productPurchaseRequest.count({ where });

    // Build order by clause
    let orderBy: Prisma.ProductPurchaseRequestOrderByWithRelationInput;
    if (sortBy === 'client') {
      orderBy = { client: { user: { firstName: sortOrder } } };
    } else if (sortBy === 'product') {
      orderBy = { product: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Get requests with related data
    const requests = await prisma.productPurchaseRequest.findMany({
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
        product: {
          select: {
            id: true,
            name: true,
            currency: true,
            minAmount: true,
            maxAmount: true,
          },
        },
        productOption: {
          select: {
            id: true,
            duration: true,
            withdrawalFrequency: true,
            roi: true,
            annualReturn: true,
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
      },
      productId: req.productId,
      product: {
        id: req.product.id,
        name: req.product.name,
        currency: req.product.currency,
        minAmount: Number(req.product.minAmount),
        maxAmount: req.product.maxAmount ? Number(req.product.maxAmount) : null,
      },
      productOption: {
        id: req.productOption.id,
        duration: req.productOption.duration,
        withdrawalFrequency: req.productOption.withdrawalFrequency,
        roi: Number(req.productOption.roi),
        annualReturn: Number(req.productOption.annualReturn),
      },
      amount: Number(req.amount),
      status: req.status,
      clientNotes: req.clientNotes,
      rmNotes: req.rmNotes,
      rejectionReason: req.rejectionReason,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      processedAt: req.processedAt?.toISOString() || null,
    }));

    // Get summary statistics
    const stats = await prisma.productPurchaseRequest.groupBy({
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
    console.error('Error fetching product purchase requests:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch product investment requests' },
      { status: 500 }
    );
  }
}
