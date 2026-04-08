/**
 * Email Reminders Cron Jobs
 * Handles time-based email notifications
 *
 * NOTE: This file requires a cron job scheduler to be set up.
 * Recommended libraries: node-cron, agenda, bull, or native cron
 *
 * Setup Instructions:
 * 1. Install cron library: pnpm add node-cron @types/node-cron
 * 2. Add this file to your server startup (e.g., in a Next.js API route or standalone server)
 * 3. Configure environment variables for cron timing if needed
 */

import { prisma } from '@/lib/db/prisma';
import {
  sendKYCReminderDay3,
  sendKYCReminderDay6,
  sendMonthlyPayoutReminderEmail,
  sendContractRenewalReminderEmail,
} from '@/lib/email';
import {
  getEligibleUsersForArchival,
  archiveUsersBatch,
} from '@/lib/services/archival.service';
import cron from 'node-cron';

/**
 * Send KYC reminder to users 3 days after email verification
 * Runs daily at 9:00 AM
 */
export async function sendKYCDay3Reminders() {
  try {
    // Calculate date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    const fourDaysAgo = new Date(threeDaysAgo);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 1);

    // Find users who registered exactly 3 days ago, verified email, and haven't submitted KYC
    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
        createdAt: {
          gte: fourDaysAgo,
          lt: threeDaysAgo,
        },
        client: {
          verificationStatus: 'NOT_SUBMITTED',
        },
      },
      select: {
        email: true,
        firstName: true,
      },
    });

    // eslint-disable-next-line no-console
    console.log(`Sending KYC Day 3 reminders to ${users.length} users`);

    for (const user of users) {
      await sendKYCReminderDay3(user.email, user.firstName);
    }

    return {
      success: true,
      count: users.length,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending KYC Day 3 reminders:', error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Send KYC reminder with deactivation warning 6 days after email verification
 * Runs daily at 9:00 AM
 */
export async function sendKYCDay6Reminders() {
  try {
    // Calculate date 6 days ago
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    sixDaysAgo.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(sixDaysAgo);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);

    // Find users who registered exactly 6 days ago, verified email, and haven't submitted KYC
    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
        createdAt: {
          gte: sevenDaysAgo,
          lt: sixDaysAgo,
        },
        client: {
          verificationStatus: 'NOT_SUBMITTED',
        },
      },
      select: {
        email: true,
        firstName: true,
      },
    });

    // eslint-disable-next-line no-console
    console.log(`Sending KYC Day 6 warnings to ${users.length} users`);

    for (const user of users) {
      await sendKYCReminderDay6(user.email, user.firstName);
    }

    return {
      success: true,
      count: users.length,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending KYC Day 6 reminders:', error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Archive accounts and send expiry emails 7 days after email verification
 * Runs daily at 9:00 AM
 *
 * Enhanced with full archival workflow:
 * - Archives user and client data (read-only, not deleted)
 * - Marks associated UserLead as LOST
 * - Sends final notification email
 * - Creates comprehensive audit trail
 * - Prevents future emails and transactions
 */
export async function handleKYCExpiry() {
  try {
    // eslint-disable-next-line no-console
    console.log('[CRON] Starting KYC expiry archival process...');

    // Get eligible users for archival
    const eligibleUserIds = await getEligibleUsersForArchival();

    if (eligibleUserIds.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[CRON] No users eligible for archival today');
      return {
        success: true,
        count: 0,
        message: 'No users eligible for archival',
      };
    }

    // eslint-disable-next-line no-console
    console.log(`[CRON] Found ${eligibleUserIds.length} users eligible for archival`);

    // Archive users in batch
    const result = await archiveUsersBatch(eligibleUserIds, 'KYC_EXPIRED_DAY_7');

    // eslint-disable-next-line no-console
    console.log(`[CRON] Archival complete: ${result.archivedCount} archived, ${result.errors.length} errors`);

    if (result.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.error('[CRON] Archival errors:', result.errors);
    }

    return {
      success: result.success,
      count: result.archivedCount,
      errors: result.errors,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[CRON] Error handling KYC expiry:', error);
    return {
      success: false,
      count: 0,
      error,
    };
  }
}

/**
 * Send monthly payout reminders on the 15th of each month
 * Runs once per month on the 15th at 9:00 AM
 */
export async function sendMonthlyPayoutReminders() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Query would need to be based on actual ProductPurchaseRequest or Investment table
    // This is a placeholder - adjust based on your actual schema
    const activeInvestments = await prisma.productPurchaseRequest.findMany({
      where: {
        status: 'APPROVED',
        // Add conditions based on payout schedule
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        },
        investment: {
          select: {
            name: true,
            currency: true,
          },
        },
        investmentOption: {
          select: {
            roi: true,
          },
        },
      },
    });

    // eslint-disable-next-line no-console
    console.log(`Sending monthly payout reminders to ${activeInvestments.length} clients`);

    for (const investment of activeInvestments) {
      // Calculate expected payout based on investment amount and ROI
      const expectedPayout = Number(investment.amount) * (Number(investment.investmentOption.roi) / 100) / 12; // Monthly
      const payoutDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`;

      await sendMonthlyPayoutReminderEmail(
        investment.client.user.email,
        investment.client.user.firstName,
        expectedPayout,
        investment.investment.currency,
        payoutDate
      );
    }

    return {
      success: true,
      count: activeInvestments.length,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending monthly payout reminders:', error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Send contract renewal reminders 60 days before expiry
 * Runs daily at 9:00 AM
 */
export async function sendContractRenewalReminders() {
  try {
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    sixtyDaysFromNow.setHours(23, 59, 59, 999);

    const fiftyNineDaysFromNow = new Date(sixtyDaysFromNow);
    fiftyNineDaysFromNow.setDate(fiftyNineDaysFromNow.getDate() - 1);
    fiftyNineDaysFromNow.setHours(0, 0, 0, 0);

    // Find contracts expiring in exactly 60 days
    // This assumes you have a contract expiry date field - adjust based on your schema
    const expiringInvestments = await prisma.productPurchaseRequest.findMany({
      where: {
        status: 'APPROVED',
        // Add conditions for contract expiry date if available
        // expiryDate: {
        //   gte: fiftyNineDaysFromNow,
        //   lte: sixtyDaysFromNow,
        // },
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        },
        investment: {
          select: {
            name: true,
          },
        },
      },
    });

    // eslint-disable-next-line no-console
    console.log(`Sending contract renewal reminders to ${expiringInvestments.length} clients`);

    for (const investment of expiringInvestments) {
      // Calculate expiry date and days remaining
      // This is placeholder - replace with actual calculation
      const expiryDate = new Date(sixtyDaysFromNow).toISOString().split('T')[0];
      const daysRemaining = 60;

      await sendContractRenewalReminderEmail(
        investment.client.user.email,
        investment.client.user.firstName,
        investment.investment.name,
        expiryDate,
        daysRemaining
      );
    }

    return {
      success: true,
      count: expiringInvestments.length,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending contract renewal reminders:', error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Initialize all cron jobs
 * Call this function in your server startup (e.g., in a Next.js API route or standalone server)
 */
export function initializeEmailCronJobs() {
  // KYC reminders - Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    // eslint-disable-next-line no-console
    console.log('Running KYC Day 3 reminders...');
    await sendKYCDay3Reminders();
  });

  cron.schedule('0 9 * * *', async () => {
    // eslint-disable-next-line no-console
    console.log('Running KYC Day 6 reminders...');
    await sendKYCDay6Reminders();
  });

  cron.schedule('0 9 * * *', async () => {
    // eslint-disable-next-line no-console
    console.log('Running KYC expiry checks...');
    await handleKYCExpiry();
  });

  // Monthly payout reminder - Run on 15th of every month at 9:00 AM
  cron.schedule('0 9 15 * *', async () => {
    // eslint-disable-next-line no-console
    console.log('Running monthly payout reminders...');
    await sendMonthlyPayoutReminders();
  });

  // Contract renewal reminders - Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    // eslint-disable-next-line no-console
    console.log('Running contract renewal reminders...');
    await sendContractRenewalReminders();
  });

  // eslint-disable-next-line no-console
  console.log('Email cron jobs initialized successfully');
}

// Example: Manual trigger endpoints for testing
// You can call these from API routes for testing before setting up cron
export const emailCronHandlers = {
  kycDay3: sendKYCDay3Reminders,
  kycDay6: sendKYCDay6Reminders,
  kycExpiry: handleKYCExpiry,
  monthlyPayout: sendMonthlyPayoutReminders,
  contractRenewal: sendContractRenewalReminders,
};
