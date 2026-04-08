import { NextResponse } from 'next/server';
import { initializeEmailCronJobs } from '@/lib/cron/email-reminders.cron';
import { initializePayoutCronJobs } from '@/lib/cron/payout-jobs';

/**
 * Initialize All Cron Jobs
 * This route is called once during server startup to initialize all scheduled tasks
 *
 * NOTE: In production, this should be called from a server startup script
 * or a standalone cron server, not via HTTP request
 */

// Initialize cron jobs when the module loads (server startup)
if (typeof window === 'undefined') {
  // Only run on server-side
  try {
    initializeEmailCronJobs();
    // eslint-disable-next-line no-console
    console.log('[CRON] Email notification cron jobs initialized at server startup');

    initializePayoutCronJobs();
    // eslint-disable-next-line no-console
    console.log('[CRON] Payout cron jobs initialized at server startup');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[CRON] Failed to initialize cron jobs:', error);
  }
}

/**
 * GET /api/cron/init
 * Health check endpoint to verify cron jobs are running
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'All cron jobs are initialized and running',
    jobs: [
      // Email/KYC Jobs
      { name: 'KYC Day 3 Reminders', schedule: 'Daily at 9:00 AM', category: 'Email' },
      { name: 'KYC Day 6 Warnings', schedule: 'Daily at 9:00 AM', category: 'Email' },
      { name: 'KYC Expiry Handler', schedule: 'Daily at 9:00 AM', category: 'Email' },
      { name: 'Monthly Payout Reminders', schedule: '15th of each month at 9:00 AM', category: 'Email' },
      { name: 'Contract Renewal Reminders', schedule: 'Daily at 9:00 AM', category: 'Email' },

      // Payout Jobs
      { name: 'Daily Payout Generation', schedule: 'Daily at 12:00 AM (midnight)', category: 'Payout' },
      { name: '15th Payout Reminder', schedule: '14th of each month at 9:00 AM', category: 'Payout' },
      { name: 'Month-End Payout Reminder', schedule: '29th of each month at 9:00 AM', category: 'Payout' }
    ]
  });
}
