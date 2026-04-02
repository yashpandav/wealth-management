/**
 * Admin User Status Management API
 * Update user account status (ACTIVE, INACTIVE, LOCKED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { sanitizeObject } from '@/lib/security';
import { userStatusUpdateSchema } from '@/lib/validation/user.validation';
import { AccountStatus } from '@prisma/client';
import { runInBackground } from '@/lib/background';

/**
 * PUT /api/admin/users/[id]/status
 * Update user account status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);
    const validationResult = userStatusUpdateSchema.safeParse(sanitizedBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { status, reason } = validationResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from changing their own status
    if (admin.id === params.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own account status' },
        { status: 403 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status,
        // If setting to ACTIVE, also set isActive to true
        isActive: status === AccountStatus.ACTIVE,
        // Clear lockout if manually unlocking
        ...(status === AccountStatus.ACTIVE && {
          accountLockedUntil: null,
          failedLoginAttempts: 0,
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isActive: true,
        failedLoginAttempts: true,
        accountLockedUntil: true,
      },
    });

    runInBackground(
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: status === AccountStatus.ACTIVE ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
          entityType: 'User',
          entityId: user.id,
          description: `Admin changed user status from ${user.status} to ${status}${reason ? `: ${reason}` : ''}`,
          metadata: {
            previousStatus: user.status,
            newStatus: status,
            reason: reason || undefined,
          },
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: status === AccountStatus.ACTIVE ? 'SUCCESS' : 'WARNING',
          category: 'SYSTEM',
          title: 'Account Status Changed',
          message:
            status === AccountStatus.ACTIVE
              ? 'Your account has been activated.'
              : status === AccountStatus.INACTIVE
                ? 'Your account has been deactivated. Please contact support for more information.'
                : 'Your account has been locked. Please contact support.',
          metadata: {
            changedBy: `${admin.firstName} ${admin.lastName}`,
            reason: reason || undefined,
          },
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating user status:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
