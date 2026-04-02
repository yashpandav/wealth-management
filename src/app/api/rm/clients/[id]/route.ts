/**
 * RM - Client Detail API
 * GET /api/rm/clients/[id]
 * Fetch detailed information about a specific assigned client
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
 * GET - Fetch detailed information about a specific client
 * Only accessible to the assigned RM
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

    // Authorization check - RM only
    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;

    // Fetch RM record and client details in parallel
    const [rm, client] = await Promise.all([
      prisma.relationshipManager.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.client.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
          productPurchaseRequests: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              investment: {
                select: {
                  name: true,
                  description: true,
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
          payouts: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              amount: true,
              status: true,
              scheduledDate: true,
              processedAt: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'Relationship Manager profile not found' },
        { status: 404 }
      );
    }

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Authorization check - ensure this is the RM's assigned client
    if (client.assignedRMId !== rm.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your assigned clients' },
        { status: 403 }
      );
    }

    // Calculate investment summary
    const activeInvestments = client.productPurchaseRequests.filter(
      (req) => req.status === 'APPROVED' || req.status === 'COMPLETED'
    );

    const totalInvested = activeInvestments.reduce(
      (sum, req) => sum + Number(req.amount),
      0
    );

    const completedPayouts = client.payouts.filter((p) => p.status === 'COMPLETED');
    const totalInterestEarned = completedPayouts.reduce(
      (sum, payout) => sum + Number(payout.amount),
      0
    );

    // Serialize Decimal fields and build response
    const serializedClient = {
      id: client.id,
      kycVerified: client.kycVerified,
      assignedAt: client.assignedAt.toISOString(),
      user: client.user,
      investmentSummary: {
        totalInvested,
        totalInterestEarned,
        activeInvestmentsCount: activeInvestments.length,
        totalValue: totalInvested + totalInterestEarned,
      },
      productPurchaseRequests: client.productPurchaseRequests.map((pr) => ({
        id: pr.id,
        trackingNumber: pr.trackingNumber,
        status: pr.status,
        amount: Number(pr.amount),
        createdAt: pr.createdAt.toISOString(),
        investment: pr.investment,
        investmentOption: pr.investmentOption ? {
          duration: pr.investmentOption.duration,
          withdrawalFrequency: pr.investmentOption.withdrawalFrequency,
          roi: Number(pr.investmentOption.roi),
          annualReturn: Number(pr.investmentOption.annualReturn),
        } : null,
      })),
      payouts: client.payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        scheduledDate: p.scheduledDate.toISOString(),
        processedAt: p.processedAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: { client: serializedClient },
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}
