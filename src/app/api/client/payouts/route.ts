/**
 * Client Payouts API
 * GET /api/client/payouts
 * Get client's payout history (read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get client record
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client record not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';

    // Build where clause
    const where: any = {
      clientId: client.id,
    };

    if (status && status !== 'all') {
      where.status = status;
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

    // Get summary statistics for the client
    const summary = await prisma.payout.groupBy({
      by: ['status'],
      where: {
        clientId: client.id,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get next scheduled payout
    const nextPayout = await prisma.payout.findFirst({
      where: {
        clientId: client.id,
        status: 'PENDING',
        scheduledDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      include: {
        productPurchaseRequest: {
          include: {
            investment: {
              select: {
                name: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    // Calculate total interest earned (all completed payouts)
    const totalEarned = await prisma.payout.aggregate({
      where: {
        clientId: client.id,
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    // Serialize Decimal fields
    const serializedPayouts = payouts.map((payout) => ({
      id: payout.id,
      productPurchaseRequestId: payout.productPurchaseRequestId,
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
          totalEarned: Number(totalEarned._sum.amount || 0),
          byStatus: summary.map((s) => ({
            status: s.status,
            count: s._count.id,
            totalAmount: Number(s._sum.amount || 0),
          })),
          nextPayout: nextPayout ? {
            id: nextPayout.id,
            scheduledDate: nextPayout.scheduledDate.toISOString(),
            amount: Number(nextPayout.amount),
            investment: nextPayout.productPurchaseRequest.investment.name,
            currency: nextPayout.productPurchaseRequest.investment.currency,
          } : null,
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
    console.error('Error fetching client payouts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}
