/**
 * Payout Cron Jobs
 * Automated tasks for payout generation and reminders
 */

import { createPendingPayouts, getPendingPayouts } from '@/lib/services/payout.service';
import { sendDocAdminPayoutReminder } from '@/lib/email/email.service';
import { prisma } from '@/lib/db/prisma';
import cron from 'node-cron';

/**
 * Daily job: Create Payout records from due PayoutSchedules
 * Runs at 00:00 daily
 * Creates payouts for schedules due within next 3 days
 */
export async function dailyPayoutGenerationJob(): Promise<void> {
  console.log('[CRON] Starting daily payout generation job');

  try {
    const createdCount = await createPendingPayouts(3); // Look ahead 3 days
    console.log(`[CRON] Daily payout generation completed: ${createdCount} payouts created`);
  } catch (error) {
    console.error('[CRON] Daily payout generation failed:', error);
    throw error;
  }
}

/**
 * Reminder job for 15th of month
 * Runs on 14th at 09:00
 * Sends email to DocAdmins about payouts due on 15th
 */
export async function payoutReminder15thJob(): Promise<void> {
  console.log('[CRON] Starting 15th payout reminder job');

  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Check if tomorrow is the 15th
    if (tomorrow.getDate() !== 15) {
      console.log('[CRON] Skipping: Tomorrow is not the 15th');
      return;
    }

    // Get pending payouts for the 15th
    const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 15, 0, 0, 0);
    const endOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 15, 23, 59, 59);

    const pendingPayouts = await getPendingPayouts(startOfDay, endOfDay);

    if (pendingPayouts.length === 0) {
      console.log('[CRON] No pending payouts for the 15th');
      return;
    }

    // Get all DocAdmins
    const docAdmins = await prisma.user.findMany({
      where: {
        role: 'DOCADMIN',
        isActive: true,
      },
    });

    // Send reminder email to each DocAdmin
    for (const docAdmin of docAdmins) {
      await sendDocAdminPayoutReminder(docAdmin.email, startOfDay, pendingPayouts);
    }

    console.log(`[CRON] Sent 15th payout reminders to ${docAdmins.length} DocAdmins`);
  } catch (error) {
    console.error('[CRON] 15th payout reminder failed:', error);
    throw error;
  }
}

/**
 * Reminder job for month-end
 * Runs on 29th at 09:00
 * Sends email to DocAdmins about payouts due on last day of month
 */
export async function payoutReminderMonthEndJob(): Promise<void> {
  console.log('[CRON] Starting month-end payout reminder job');

  try {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Check if we're 1-2 days before month end
    const daysUntilMonthEnd = lastDayOfMonth.getDate() - today.getDate();
    if (daysUntilMonthEnd < 0 || daysUntilMonthEnd > 2) {
      console.log('[CRON] Skipping: Not close enough to month end');
      return;
    }

    // Get pending payouts for last day of month
    const startOfDay = new Date(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate(), 0, 0, 0);
    const endOfDay = new Date(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate(), 23, 59, 59);

    const pendingPayouts = await getPendingPayouts(startOfDay, endOfDay);

    if (pendingPayouts.length === 0) {
      console.log('[CRON] No pending payouts for month-end');
      return;
    }

    // Get all DocAdmins
    const docAdmins = await prisma.user.findMany({
      where: {
        role: 'DOCADMIN',
        isActive: true,
      },
    });

    // Send reminder email to each DocAdmin
    for (const docAdmin of docAdmins) {
      await sendDocAdminPayoutReminder(docAdmin.email, lastDayOfMonth, pendingPayouts);
    }

    console.log(`[CRON] Sent month-end payout reminders to ${docAdmins.length} DocAdmins`);
  } catch (error) {
    console.error('[CRON] Month-end payout reminder failed:', error);
    throw error;
  }
}

/**
 * Master cron job handler
 * Can be called from API route or external cron service
 */
export async function runPayoutCronJobs(jobType: 'daily' | 'reminder-15th' | 'reminder-month-end'): Promise<void> {
  console.log(`[CRON] Running job type: ${jobType}`);

  try {
    switch (jobType) {
      case 'daily':
        await dailyPayoutGenerationJob();
        break;
      case 'reminder-15th':
        await payoutReminder15thJob();
        break;
      case 'reminder-month-end':
        await payoutReminderMonthEndJob();
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }

    console.log(`[CRON] Job ${jobType} completed successfully`);
  } catch (error) {
    console.error(`[CRON] Job ${jobType} failed:`, error);
    throw error;
  }
}

/**
 * Initialize all payout cron jobs
 * Call this function in your server startup alongside email cron jobs
 */
export function initializePayoutCronJobs() {
  // Daily payout generation - Run at 00:00 (midnight) every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily payout generation...');
    await dailyPayoutGenerationJob();
  });

  // 15th reminder - Run on 14th at 9:00 AM
  cron.schedule('0 9 14 * *', async () => {
    console.log('[CRON] Running 15th payout reminder...');
    await payoutReminder15thJob();
  });

  // Month-end reminder - Run on 29th at 9:00 AM
  cron.schedule('0 9 29 * *', async () => {
    console.log('[CRON] Running month-end payout reminder...');
    await payoutReminderMonthEndJob();
  });

  console.log('[CRON] Payout cron jobs initialized successfully');
}

// Manual trigger handlers for testing
export const payoutCronHandlers = {
  dailyGeneration: dailyPayoutGenerationJob,
  reminder15th: payoutReminder15thJob,
  reminderMonthEnd: payoutReminderMonthEndJob,
};
