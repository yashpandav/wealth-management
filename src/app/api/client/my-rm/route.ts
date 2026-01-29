/**
 * Client - My RM API (Updated for Investment Product Model)
 * GET /api/client/my-rm
 * Fetch assigned Relationship Manager details with track record
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET - Fetch assigned RM details for the authenticated client
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Authorization check - CLIENT only
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Client access required' },
        { status: 403 }
      );
    }

    // Fetch client with assigned RM
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      include: {
        assignedRM: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client profile not found' },
        { status: 404 }
      );
    }

    if (!client.assignedRM) {
      return NextResponse.json(
        { success: false, error: 'No Relationship Manager assigned yet' },
        { status: 404 }
      );
    }

    const rm = client.assignedRM;

    // Calculate track record statistics using ProductPurchaseRequest
    const [totalClientsManaged, totalAUM, approvedProductRequests] = await Promise.all([
      // Total clients managed by this RM
      prisma.client.count({
        where: { assignedRMId: rm.id },
      }),

      // Total AUM from completed product purchase requests
      prisma.productPurchaseRequest.aggregate({
        where: {
          assignedRMId: rm.id,
          status: { in: ['APPROVED', 'COMPLETED'] },
        },
        _sum: {
          amount: true,
        },
      }),

      // Approved product purchases
      prisma.productPurchaseRequest.count({
        where: {
          assignedRMId: rm.id,
          status: { in: ['APPROVED', 'COMPLETED'] },
        },
      }),
    ]);

    const totalAUMValue = Number(totalAUM._sum.amount || 0);

    // Response data
    const rmDetails = {
      id: rm.id,
      firstName: rm.user.firstName,
      lastName: rm.user.lastName,
      email: rm.user.email,
      phone: rm.user.phone,
      specialization: rm.specialization,
      trackRecord: {
        totalClients: totalClientsManaged,
        totalAUM: totalAUMValue,
        approvedPurchases: approvedProductRequests,
        approvedWithdrawals: 0, // Removed - legacy field
      },
    };

    return NextResponse.json({
      success: true,
      data: { rm: rmDetails },
    });
  } catch (error) {
    console.error('Error fetching RM details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RM details' },
      { status: 500 }
    );
  }
}
