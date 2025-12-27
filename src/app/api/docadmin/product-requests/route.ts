/**
 * DocAdmin Product Requests API
 * GET /api/docadmin/product-requests
 *
 * Fetches product requests for DocAdmin with filtering by status:
 * - PENDING: Product Requested (waiting for RM approval)
 * - APPROVED: Contract Pending (RM approved, waiting for contract upload)
 * - COMPLETED: Completed (contract uploaded and finalized)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Only DocAdmin or Admin can view product requests
    if (user.role !== 'DOCADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only DocAdmin or Admin can view product requests' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause based on status filter
    let whereClause: any = {};

    if (status === 'PENDING') {
      // Product Requested - waiting for RM approval
      whereClause.status = 'PENDING';
    } else if (status === 'APPROVED') {
      // Contract Pending - RM approved, waiting for contract
      whereClause.status = 'APPROVED';
    } else if (status === 'COMPLETED') {
      // Completed - contract uploaded and finalized
      whereClause.status = 'COMPLETED';
    } else if (status !== 'ALL') {
      whereClause.status = status;
    }

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { client: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { client: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { client: { user: { email: { contains: search, mode: 'insensitive' } } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch product requests with pagination
    const [requests, total] = await Promise.all([
      prisma.productPurchaseRequest.findMany({
        where: whereClause,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
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
          contractDocument: {
            select: {
              id: true,
              fileName: true,
              filePath: true,
              uploadedAt: true,
            },
          },
          completedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productPurchaseRequest.count({ where: whereClause }),
    ]);

    // Get summary stats
    const summary = await prisma.productPurchaseRequest.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        requests: requests.map((req) => ({
          id: req.id,
          trackingNumber: req.trackingNumber,
          client: {
            id: req.client.id,
            firstName: req.client.user.firstName,
            lastName: req.client.user.lastName,
            email: req.client.user.email,
          },
          product: req.product,
          productOption: req.productOption,
          amount: req.amount,
          status: req.status,
          assignedRM: req.assignedRM
            ? {
                id: req.assignedRM.id,
                name: `${req.assignedRM.user.firstName} ${req.assignedRM.user.lastName}`,
              }
            : null,
          contractDocument: req.contractDocument,
          contractStartDate: req.contractStartDate,
          completedAt: req.completedAt,
          completedBy: req.completedBy
            ? `${req.completedBy.firstName} ${req.completedBy.lastName}`
            : null,
          clientNotes: req.clientNotes,
          rmNotes: req.rmNotes,
          rejectionReason: req.rejectionReason,
          createdAt: req.createdAt,
          processedAt: req.processedAt,
        })),
        summary: {
          total: total,
          byStatus: summary.map((s) => ({
            status: s.status,
            count: s._count.id,
            totalAmount: s._sum.amount || 0,
          })),
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Fetch product requests error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while fetching product requests.',
      },
      { status: 500 }
    );
  }
}
