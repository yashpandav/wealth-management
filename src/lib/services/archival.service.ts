/**
 * Archival Service
 * Handles safe, auditable, and reversible archival of KYC-expired users
 *
 * Business Rules:
 * 1. Archive users 7 days after email verification if KYC not verified
 * 2. Send final notification email before archival
 * 3. Mark associated UserLead as LOST (if exists)
 * 4. Prevent all future emails to archived users
 * 5. Exclude archived users from RM dashboards
 * 6. Support reactivation when user re-registers
 * 7. Preserve all audit logs and financial transactions
 */

import { prisma } from '@/lib/db/prisma';
import { sendKYCExpiredEmail } from '@/lib/email';

export interface ArchivalResult {
  success: boolean;
  archivedCount: number;
  errors: Array<{ userId: string; error: string }>;
}

export interface ArchivalDetails {
  userId: string;
  email: string;
  firstName: string;
  clientId: string;
  leadId?: string;
  archivedAt: Date;
  reason: string;
}

export interface ReactivationResult {
  success: boolean;
  wasArchived: boolean;
  userId?: string;
  message: string;
}

/**
 * Archive a single user account due to KYC expiry
 *
 * Steps:
 * 1. Update User: set isArchived=true, archivedAt=now, status=INACTIVE
 * 2. Update Client: set verificationStatus=EXPIRED, archivedReason
 * 3. Update UserLead: set status=LOST (if exists)
 * 4. Create audit log entry
 * 5. Send final notification email
 *
 * @param userId - User ID to archive
 * @param reason - Reason for archival (e.g., "KYC_EXPIRED_DAY_7")
 * @param sendEmail - Whether to send final notification email (default: true)
 * @returns Archival details or null if failed
 */
export async function archiveUser(
  userId: string,
  reason: string = 'KYC_EXPIRED_DAY_7',
  sendEmail: boolean = true
): Promise<ArchivalDetails | null> {
  try {
    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        client: true,
        userLead: true,
      },
    });

    if (!user) {
      console.error(`[ARCHIVAL] User not found: ${userId}`);
      return null;
    }

    if (user.isArchived) {
      console.log(`[ARCHIVAL] User already archived: ${userId}`);
      return null;
    }

    const now = new Date();

    // Execute archival in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update User
      await tx.user.update({
        where: { id: userId },
        data: {
          isArchived: true,
          archivedAt: now,
          status: 'INACTIVE',
        },
      });

      // 2. Update Client
      if (user.client) {
        await tx.client.update({
          where: { id: user.client.id },
          data: {
            verificationStatus: 'EXPIRED',
            archivedReason: reason,
          },
        });
      }

      // 3. Update UserLead (if exists)
      if (user.userLead) {
        await tx.userLead.update({
          where: { id: user.userLead.id },
          data: {
            status: 'LOST',
          },
        });
      }

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          userId: userId,
          action: 'CLIENT_ARCHIVE',
          description: `User archived due to: ${reason}`,
          entityType: 'User',
          entityId: userId,
          metadata: {
            reason,
            clientId: user.client?.id,
            leadId: user.userLead?.id,
            archivedAt: now.toISOString(),
            email: user.email,
            verificationStatus: user.client?.verificationStatus,
          },
          severity: 'INFO',
          success: true,
        },
      });
    });

    // 5. Send final notification email (outside transaction)
    if (sendEmail) {
      try {
        await sendKYCExpiredEmail(user.email, user.firstName);
        console.log(`[ARCHIVAL] Final email sent to: ${user.email}`);
      } catch (emailError) {
        console.error(`[ARCHIVAL] Failed to send email to ${user.email}:`, emailError);
        // Don't fail archival if email fails
      }
    }

    const archivalDetails: ArchivalDetails = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      clientId: user.client!.id,
      leadId: user.userLead?.id,
      archivedAt: now,
      reason,
    };

    console.log(`[ARCHIVAL] Successfully archived user: ${user.email} (${userId})`);
    return archivalDetails;

  } catch (error) {
    console.error(`[ARCHIVAL] Error archiving user ${userId}:`, error);
    return null;
  }
}

/**
 * Archive multiple users in batch
 * Used by cron job to process all eligible users
 *
 * @param userIds - Array of user IDs to archive
 * @param reason - Reason for archival
 * @returns Archival result summary
 */
export async function archiveUsersBatch(
  userIds: string[],
  reason: string = 'KYC_EXPIRED_DAY_7'
): Promise<ArchivalResult> {
  const errors: Array<{ userId: string; error: string }> = [];
  let archivedCount = 0;

  for (const userId of userIds) {
    try {
      const result = await archiveUser(userId, reason, true);
      if (result) {
        archivedCount++;
      } else {
        errors.push({ userId, error: 'Archival returned null' });
      }
    } catch (error) {
      errors.push({
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    success: errors.length === 0,
    archivedCount,
    errors,
  };
}

/**
 * Check if a user is archived
 *
 * @param userId - User ID to check
 * @returns true if archived, false otherwise
 */
export async function isUserArchived(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isArchived: true },
  });

  return user?.isArchived || false;
}

/**
 * Check if a user email is associated with an archived account
 * Used during registration to check for reactivation
 *
 * @param email - Email address to check
 * @returns Archived user data or null
 */
export async function findArchivedUserByEmail(email: string): Promise<{
  userId: string;
  clientId: string;
  archivedAt: Date;
  archivedReason: string | null;
} | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      isArchived: true,
      archivedAt: true,
      client: {
        select: {
          id: true,
          archivedReason: true,
        },
      },
    },
  });

  if (!user || !user.isArchived || !user.archivedAt || !user.client) {
    return null;
  }

  return {
    userId: user.id,
    clientId: user.client.id,
    archivedAt: user.archivedAt,
    archivedReason: user.client.archivedReason,
  };
}

/**
 * Restore an archived user account
 * Used when user re-registers with the same email
 *
 * Steps:
 * 1. Reset User: isArchived=false, archivedAt=null, status=ACTIVE
 * 2. Reset Client: verificationStatus=NOT_SUBMITTED, archivedReason=null
 * 3. Reset email verification (require fresh verification)
 * 4. Do NOT restore old KYC documents (require fresh upload)
 * 5. Remove RM assignment (require manual reassignment)
 * 6. Create audit log entry
 *
 * @param userId - User ID to restore
 * @param restoredById - Admin/system user ID who triggered restoration
 * @returns Reactivation result
 */
export async function restoreArchivedUser(
  userId: string,
  restoredById?: string
): Promise<ReactivationResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });

    if (!user) {
      return {
        success: false,
        wasArchived: false,
        message: 'User not found',
      };
    }

    if (!user.isArchived) {
      return {
        success: false,
        wasArchived: false,
        message: 'User is not archived',
      };
    }

    // Execute restoration in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Reset User
      await tx.user.update({
        where: { id: userId },
        data: {
          isArchived: false,
          archivedAt: null,
          status: 'ACTIVE',
          emailVerified: false, // Require fresh email verification
        },
      });

      // 2. Reset Client
      if (user.client) {
        await tx.client.update({
          where: { id: user.client.id },
          data: {
            verificationStatus: 'NOT_SUBMITTED',
            archivedReason: null,
            assignedRMId: null, // Remove RM assignment
            kycVerified: false,
          },
        });
      }

      // 3. Create audit log
      await tx.auditLog.create({
        data: {
          userId: restoredById || userId,
          action: 'CLIENT_RESTORE',
          description: `User restored from archive: ${user.email}`,
          entityType: 'User',
          entityId: userId,
          metadata: {
            previousArchivedAt: user.archivedAt?.toISOString(),
            previousReason: user.client?.archivedReason,
            restoredAt: new Date().toISOString(),
          },
          severity: 'INFO',
          success: true,
        },
      });
    });

    console.log(`[ARCHIVAL] Successfully restored user: ${user.email} (${userId})`);

    return {
      success: true,
      wasArchived: true,
      userId: userId,
      message: 'User account restored. Please complete email verification and KYC.',
    };

  } catch (error) {
    console.error(`[ARCHIVAL] Error restoring user ${userId}:`, error);
    return {
      success: false,
      wasArchived: true,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get list of users eligible for archival
 * Used by cron job to identify users to archive
 *
 * Criteria:
 * - Email verified = true
 * - Created exactly 7 days ago
 * - Client verification status = NOT_SUBMITTED
 * - User status = ACTIVE (not already inactive)
 * - Not already archived
 *
 * @returns Array of user IDs eligible for archival
 */
export async function getEligibleUsersForArchival(): Promise<string[]> {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const eightDaysAgo = new Date(sevenDaysAgo);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 1);

    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
        createdAt: {
          gte: eightDaysAgo,
          lt: sevenDaysAgo,
        },
        status: 'ACTIVE',
        isArchived: false,
        client: {
          verificationStatus: 'NOT_SUBMITTED',
        },
      },
      select: {
        id: true,
      },
    });

    return users.map(u => u.id);
  } catch (error) {
    console.error('[ARCHIVAL] Error fetching eligible users:', error);
    return [];
  }
}

/**
 * Get archival statistics
 * Useful for admin dashboard and reporting
 *
 * @returns Archival statistics
 */
export async function getArchivalStats() {
  try {
    const [totalArchived, archivedThisMonth, archivedThisWeek] = await Promise.all([
      // Total archived users
      prisma.user.count({
        where: { isArchived: true },
      }),

      // Archived this month
      prisma.user.count({
        where: {
          isArchived: true,
          archivedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Archived this week
      prisma.user.count({
        where: {
          isArchived: true,
          archivedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalArchived,
      archivedThisMonth,
      archivedThisWeek,
    };
  } catch (error) {
    console.error('[ARCHIVAL] Error fetching stats:', error);
    return {
      totalArchived: 0,
      archivedThisMonth: 0,
      archivedThisWeek: 0,
    };
  }
}
