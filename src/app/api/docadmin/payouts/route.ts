/**
 * DocAdmin Payouts API
 * GET /api/docadmin/payouts
 * Get all pending payouts for DocAdmin to process
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication and role
    if (!session?.user || (session.user.role !== 'DOCADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'PENDING';
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Calculate date range for "upcoming" pending payouts (next 2 days)
    const now = new Date();
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(now.getDate() + 2);
    twoDaysFromNow.setHours(23, 59, 59, 999);

    // Build where clause
    const where: Prisma.PayoutWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumPayoutStatusFilter;

      // For PENDING status, only show payouts due in next 2 days
      if (status === 'PENDING' && !dateFrom && !dateTo) {
        where.scheduledDate = {
          lte: twoDaysFromNow,
        };
      }
    }

    // Search by client name or tracking number
    if (search) {
      where.OR = [
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
          productPurchaseRequest: {
            trackingNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Filter by scheduled date range
    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) {
        where.scheduledDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.scheduledDate.lte = new Date(dateTo);
      }
    }

    // Get payouts with pagination
    const [payouts, totalCount] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { scheduledDate: 'desc' },
          { createdAt: 'desc' },
        ],
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
          productPurchaseRequest: {
            include: {
              investment: {
                select: {
                  id: true,
                  name: true,
                  currency: true,
                },
              },
              investmentOption: {
                select: {
                  duration: true,
                  withdrawalFrequency: true,
                  roi: true,
                  annualReturn: true,
                },
              },
            },
          },
          processedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          receiptDocument: {
            select: {
              id: true,
              fileName: true,
              filePath: true,
            },
          },
          transaction: {
            select: {
              id: true,
              status: true,
              completedAt: true,
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    // Get summary statistics
    const summary = await prisma.payout.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Serialize Decimal fields
    const serializedPayouts = payouts.map((payout) => ({
      id: payout.id,
      productPurchaseRequestId: payout.productPurchaseRequestId,
      payoutScheduleId: payout.payoutScheduleId,
      clientId: payout.clientId,
      client: {
        id: payout.client.id,
        firstName: payout.client.user.firstName,
        lastName: payout.client.user.lastName,
        email: payout.client.user.email,
      },
      productPurchaseRequest: {
        id: payout.productPurchaseRequest.id,
        trackingNumber: payout.productPurchaseRequest.trackingNumber,
        investment: {
          id: payout.productPurchaseRequest.investment.id,
          name: payout.productPurchaseRequest.investment.name,
          currency: payout.productPurchaseRequest.investment.currency,
        },
        investmentOption: {
          duration: payout.productPurchaseRequest.investmentOption.duration,
          withdrawalFrequency: payout.productPurchaseRequest.investmentOption.withdrawalFrequency,
          roi: Number(payout.productPurchaseRequest.investmentOption.roi),
          annualReturn: Number(payout.productPurchaseRequest.investmentOption.annualReturn),
        },
      },
      amount: Number(payout.amount),
      periodStart: payout.periodStart.toISOString(),
      periodEnd: payout.periodEnd.toISOString(),
      scheduledDate: payout.scheduledDate.toISOString(),
      status: payout.status,
      processedBy: payout.processedBy ? {
        id: payout.processedBy.id,
        name: `${payout.processedBy.firstName} ${payout.processedBy.lastName}`,
      } : null,
      processedAt: payout.processedAt?.toISOString() || null,
      receiptDocument: payout.receiptDocument,
      transaction: payout.transaction,
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    }));

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        payouts: serializedPayouts,
        summary: {
          total: totalCount,
          byStatus: summary.map((s) => ({
            status: s.status,
            count: s._count.id,
            totalAmount: Number(s._sum.amount || 0),
          })),
        },
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}
