/**
 * Admin Relationship Managers API
 * List RMs with workload information
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

/**
 * GET /api/admin/rms
 * List all relationship managers with workload stats
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();

    // Fetch all RMs with their assigned clients count
    const rms = await prisma.relationshipManager.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            assignedClients: true,
          },
        },
      },
      orderBy: {
        user: {
          lastName: 'asc',
        },
      },
    });

    // Format response with workload information
    const rmsWithWorkload = rms.map((rm) => ({
      id: rm.id,
      userId: rm.userId,
      email: rm.user.email,
      firstName: rm.user.firstName,
      lastName: rm.user.lastName,
      fullName: `${rm.user.firstName} ${rm.user.lastName}`,
      status: rm.user.status,
      isActive: rm.user.isActive,
      specialization: rm.specialization,
      maxClientLimit: rm.maxClientLimit,
      totalAUM: rm.totalAUM.toString(),
      assignedClientsCount: rm._count.assignedClients,
      availableCapacity: rm.maxClientLimit
        ? rm.maxClientLimit - rm._count.assignedClients
        : null,
      utilizationPercentage: rm.maxClientLimit
        ? Math.round((rm._count.assignedClients / rm.maxClientLimit) * 100)
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: rmsWithWorkload,
    });
  } catch (error) {
    console.error('Error fetching RMs:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch relationship managers' },
      { status: 500 }
    );
  }
}
