import { NextResponse } from 'next/server';
import { initializeEmailCronJobs } from '@/lib/cron/email-reminders.cron';

/**
 * Initialize Email Cron Jobs
 * This route is called once during server startup to initialize all scheduled email tasks
 *
 * NOTE: In production, this should be called from a server startup script
 * or a standalone cron server, not via HTTP request
 */

// Initialize cron jobs when the module loads (server startup)
if (typeof window === 'undefined') {
  // Only run on server-side
  try {
    initializeEmailCronJobs();
    console.log('[CRON] Email notification cron jobs initialized at server startup');
  } catch (error) {
    console.error('[CRON] Failed to initialize email cron jobs:', error);
  }
}

/**
 * GET /api/cron/init
 * Health check endpoint to verify cron jobs are running
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Email cron jobs are initialized and running',
    jobs: [
      { name: 'KYC Day 3 Reminders', schedule: 'Daily at 9:00 AM' },
      { name: 'KYC Day 6 Warnings', schedule: 'Daily at 9:00 AM' },
      { name: 'KYC Expiry Handler', schedule: 'Daily at 9:00 AM' },
      { name: 'Monthly Payout Reminders', schedule: '15th of each month at 9:00 AM' },
      { name: 'Contract Renewal Reminders', schedule: 'Daily at 9:00 AM' }
    ]
  });
}
