/**
 * Admin User Account Unlock API
 * Unlock temporarily locked user accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { AccountStatus } from '@prisma/client';

/**
 * POST /api/admin/users/[id]/unlock
 * Unlock a user account that was locked due to failed login attempts
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        accountLockedUntil: true,
        failedLoginAttempts: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if account is actually locked
    const isLocked =
      user.accountLockedUntil && user.accountLockedUntil > new Date();

    if (!isLocked && user.status !== AccountStatus.LOCKED) {
      return NextResponse.json(
        { success: false, error: 'Account is not locked' },
        { status: 400 }
      );
    }

    // Unlock the account
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        accountLockedUntil: null,
        failedLoginAttempts: 0,
        // If status is LOCKED, change to ACTIVE
        ...(user.status === AccountStatus.LOCKED && {
          status: AccountStatus.ACTIVE,
          isActive: true,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'USER_ACTIVATE',
        entityType: 'User',
        entityId: user.id,
        description: `Admin unlocked user account (${user.email})`,
        metadata: {
          previousFailedAttempts: user.failedLoginAttempts,
          previousLockoutTime: user.accountLockedUntil?.toISOString(),
        },
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SUCCESS',
        category: 'SECURITY',
        title: 'Account Unlocked',
        message:
          'Your account has been unlocked by an administrator. You can now log in.',
        metadata: {
          unlockedBy: `${admin.firstName} ${admin.lastName}`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User account unlocked successfully',
    });
  } catch (error) {
    console.error('Error unlocking user account:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to unlock user account' },
      { status: 500 }
    );
  }
}
