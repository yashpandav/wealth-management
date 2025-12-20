/**
 * Admin Bulk User Status Management API
 * Perform status operations on multiple users at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { sanitizeObject } from '@/lib/security';
import { bulkUserOperationSchema } from '@/lib/validation/user.validation';
import { AccountStatus } from '@prisma/client';

/**
 * Helper function to handle bulk delete operation
 */
async function handleBulkDelete(
  userIds: string[],
  admin: { id: string; firstName: string | null; lastName: string | null },
  reason?: string
): Promise<NextResponse> {
  // Get users to delete
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (users.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No valid users found' },
      { status: 404 }
    );
  }

  // Perform soft delete
  const deleteResult = await prisma.user.updateMany({
    where: {
      id: { in: userIds },
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
      status: AccountStatus.INACTIVE,
    },
  });

  // Create audit logs
  const auditLogPromises = users.map((user) =>
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'USER_DELETE',
        entityType: 'User',
        entityId: user.id,
        description: `Admin soft deleted user account${reason ? `: ${reason}` : ''}`,
        metadata: {
          bulkOperation: true,
          email: user.email,
          reason: reason || undefined,
        },
      },
    })
  );

  await Promise.all(auditLogPromises);

  return NextResponse.json({
    success: true,
    data: {
      deletedCount: deleteResult.count,
      users: users.map((u) => ({ id: u.id, email: u.email })),
    },
    message: `Successfully soft deleted ${deleteResult.count} user(s)`,
  });
}

/**
 * POST /api/admin/users/bulk-status
 * Perform bulk status changes on multiple users
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);
    const validationResult = bulkUserOperationSchema.safeParse(sanitizedBody);

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

    const { userIds, operation, reason } = validationResult.data;

    // Map operation to status
    let newStatus: AccountStatus;
    let auditAction: 'USER_ACTIVATE' | 'USER_DEACTIVATE' | 'USER_DELETE';
    let notificationType: 'SUCCESS' | 'WARNING' | 'ERROR';
    let notificationMessage: string;

    switch (operation) {
      case 'activate':
        newStatus = AccountStatus.ACTIVE;
        auditAction = 'USER_ACTIVATE';
        notificationType = 'SUCCESS';
        notificationMessage = 'Your account has been activated.';
        break;
      case 'deactivate':
        newStatus = AccountStatus.INACTIVE;
        auditAction = 'USER_DEACTIVATE';
        notificationType = 'WARNING';
        notificationMessage = 'Your account has been deactivated. Please contact support.';
        break;
      case 'lock':
        newStatus = AccountStatus.LOCKED;
        auditAction = 'USER_DEACTIVATE';
        notificationType = 'ERROR';
        notificationMessage = 'Your account has been locked. Please contact support.';
        break;
      case 'unlock':
        newStatus = AccountStatus.ACTIVE;
        auditAction = 'USER_ACTIVATE';
        notificationType = 'SUCCESS';
        notificationMessage = 'Your account has been unlocked.';
        break;
      case 'delete':
        // For delete operation, we'll handle it separately with soft delete
        return await handleBulkDelete(userIds, admin, reason);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation' },
          { status: 400 }
        );
    }

    // Prevent admin from including themselves in the operation
    if (userIds.includes(admin.id)) {
      return NextResponse.json(
        { success: false, error: 'Cannot perform bulk operations on your own account' },
        { status: 403 }
      );
    }

    // Get users to update
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid users found' },
        { status: 404 }
      );
    }

    // Perform bulk update
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        status: newStatus,
        isActive: newStatus === AccountStatus.ACTIVE,
        // Clear lockout if activating
        ...(newStatus === AccountStatus.ACTIVE && {
          accountLockedUntil: null,
          failedLoginAttempts: 0,
        }),
      },
    });

    // Create audit logs for each user
    const auditLogPromises = users.map((user) =>
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: auditAction,
          entityType: 'User',
          entityId: user.id,
          description: `Admin performed bulk ${operation} operation from ${user.status} to ${newStatus}${reason ? `: ${reason}` : ''}`,
          metadata: {
            bulkOperation: true,
            operation,
            previousStatus: user.status,
            newStatus,
            reason: reason || undefined,
          },
        },
      })
    );

    // Create notifications for each user
    const notificationPromises = users.map((user) =>
      prisma.notification.create({
        data: {
          userId: user.id,
          type: notificationType,
          category: 'SYSTEM',
          title: 'Account Status Changed',
          message: notificationMessage + (reason ? ` Reason: ${reason}` : ''),
          metadata: {
            bulkOperation: true,
            operation,
            changedBy: `${admin.firstName} ${admin.lastName}`,
            reason: reason || undefined,
          },
        },
      })
    );

    // Execute all operations
    await Promise.all([...auditLogPromises, ...notificationPromises]);

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updateResult.count,
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          previousStatus: u.status,
          newStatus,
        })),
      },
      message: `Successfully updated ${updateResult.count} user(s) to ${newStatus}`,
    });
  } catch (error) {
    console.error('Error performing bulk status operation:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk status operation' },
      { status: 500 }
    );
  }
}
