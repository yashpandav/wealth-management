/**
 * DocAdmin RMs API
 * GET: Fetch all active Relationship Managers for assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/docadmin/rms
 * List all active Relationship Managers (DocAdmin only)
 */
export async function GET(_request: NextRequest) {
  try {
    // Require DocAdmin role
    await requireRole('DOCADMIN');

    // Fetch all active RMs with their user information
    const rmsData = await prisma.relationshipManager.findMany({
      where: {
        user: {
          isActive: true,
          status: 'ACTIVE',
        },
      },
      select: {
        id: true,
        userId: true,
        specialization: true,
        maxClientLimit: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
          firstName: 'asc',
        },
      },
    });

    // Format response
    const formattedRms = rmsData.map((rm) => ({
      id: rm.id,
      userId: rm.user.id,
      name: `${rm.user.firstName} ${rm.user.lastName}`,
      email: rm.user.email,
      firstName: rm.user.firstName,
      lastName: rm.user.lastName,
      clientCount: rm._count.assignedClients,
      isActive: rm.user.isActive,
      status: rm.user.status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        rms: formattedRms,
        total: formattedRms.length,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching RMs:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: DocAdmin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch RMs' },
      { status: 500 }
    );
  }
}
