/**
 * API Route: RM Registered Clients (No KYC)
 * GET - Fetch assigned clients who registered but haven't submitted KYC
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    // Get RM record
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
    });

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'RM profile not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    // Build where clause - assigned to RM and NOT_SUBMITTED, REJECTED, or EXPIRED status
    // These are clients who need to submit or resubmit KYC documents
    const where: Prisma.ClientWhereInput = {
      assignedRMId: rm.id,
      verificationStatus: { in: ['NOT_SUBMITTED', 'REJECTED', 'EXPIRED'] },
    };

    // Search filter
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch clients and total count
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assignedAt: 'desc' },
        select: {
          id: true,
          verificationStatus: true,
          assignedAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    // Serialize data
    const serializedClients = clients.map((client) => ({
      id: client.id,
      user: client.user,
      verificationStatus: client.verificationStatus,
      assignedAt: client.assignedAt.toISOString(),
      createdAt: client.user.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        clients: serializedClients,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching registered clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registered clients' },
      { status: 500 }
    );
  }
}
