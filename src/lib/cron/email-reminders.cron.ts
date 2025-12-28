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
  sendKYCExpiredEmail,
  sendMonthlyPayoutReminderEmail,
  sendContractRenewalReminderEmail,
} from '@/lib/email';
// import cron from 'node-cron'; // Uncomment after installing node-cron

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
    // NOTE: Using createdAt as proxy for email verification date
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

    console.log(`Sending KYC Day 3 reminders to ${users.length} users`);

    for (const user of users) {
      await sendKYCReminderDay3(user.email, user.firstName);
    }

    return {
      success: true,
      count: users.length,
    };
  } catch (error) {
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
    // NOTE: Using createdAt as proxy for email verification date
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

    console.log(`Sending KYC Day 6 warnings to ${users.length} users`);

    for (const user of users) {
      await sendKYCReminderDay6(user.email, user.firstName);
    }

    return {
      success: true,
      count: users.length,
    };
  } catch (error) {
    console.error('Error sending KYC Day 6 reminders:', error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Deactivate accounts and send expiry emails 7 days after email verification
 * Runs daily at 9:00 AM
 */
export async function handleKYCExpiry() {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const eightDaysAgo = new Date(sevenDaysAgo);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 1);

    // Find users who registered exactly 7 days ago, verified email, and haven't submitted KYC
    // NOTE: Using createdAt as proxy for email verification date
    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
        createdAt: {
          gte: eightDaysAgo,
          lt: sevenDaysAgo,
        },
        client: {
          verificationStatus: 'NOT_SUBMITTED',
        },
        status: 'ACTIVE', // Only deactivate active accounts
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        client: {
          select: {
            id: true,
          },
        },
      },
    });

    console.log(`Deactivating ${users.length} accounts for KYC expiry`);

    for (const user of users) {
      // Update user status to INACTIVE and client verification to EXPIRED
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { status: 'INACTIVE' },
        }),
        prisma.client.update({
          where: { id: user.client!.id },
          data: { verificationStatus: 'EXPIRED' },
        }),
      ]);

      // Send expiry email
      await sendKYCExpiredEmail(user.email, user.firstName);
    }

    return {
      success: true,
      count: users.length,
    };
  } catch (error) {
    console.error('Error handling KYC expiry:', error);
    return {
      success: false,
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
        product: {
          select: {
            name: true,
            currency: true,
          },
        },
        productOption: {
          select: {
            roi: true,
          },
        },
      },
    });

    console.log(`Sending monthly payout reminders to ${activeInvestments.length} clients`);

    for (const investment of activeInvestments) {
      // Calculate expected payout based on investment amount and ROI
      const expectedPayout = Number(investment.amount) * (Number(investment.productOption.roi) / 100) / 12; // Monthly
      const payoutDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`;

      await sendMonthlyPayoutReminderEmail(
        investment.client.user.email,
        investment.client.user.firstName,
        expectedPayout,
        investment.product.currency,
        payoutDate
      );
    }

    return {
      success: true,
      count: activeInvestments.length,
    };
  } catch (error) {
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
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`Sending contract renewal reminders to ${expiringInvestments.length} clients`);

    for (const investment of expiringInvestments) {
      // Calculate expiry date and days remaining
      // This is placeholder - replace with actual calculation
      const expiryDate = new Date(sixtyDaysFromNow).toISOString().split('T')[0];
      const daysRemaining = 60;

      await sendContractRenewalReminderEmail(
        investment.client.user.email,
        investment.client.user.firstName,
        investment.product.name,
        expiryDate,
        daysRemaining
      );
    }

    return {
      success: true,
      count: expiringInvestments.length,
    };
  } catch (error) {
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
  // Uncomment and configure after installing node-cron

  // // KYC reminders - Run daily at 9:00 AM
  // cron.schedule('0 9 * * *', async () => {
  //   console.log('Running KYC Day 3 reminders...');
  //   await sendKYCDay3Reminders();
  // });

  // cron.schedule('0 9 * * *', async () => {
  //   console.log('Running KYC Day 6 reminders...');
  //   await sendKYCDay6Reminders();
  // });

  // cron.schedule('0 9 * * *', async () => {
  //   console.log('Running KYC expiry checks...');
  //   await handleKYCExpiry();
  // });

  // // Monthly payout reminder - Run on 15th of every month at 9:00 AM
  // cron.schedule('0 9 15 * *', async () => {
  //   console.log('Running monthly payout reminders...');
  //   await sendMonthlyPayoutReminders();
  // });

  // // Contract renewal reminders - Run daily at 9:00 AM
  // cron.schedule('0 9 * * *', async () => {
  //   console.log('Running contract renewal reminders...');
  //   await sendContractRenewalReminders();
  // });

  console.log('Email cron jobs initialized (currently commented out - configure scheduler first)');
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
