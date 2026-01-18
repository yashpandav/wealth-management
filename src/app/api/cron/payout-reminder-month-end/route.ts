/**
 * Cron API: Month-End Payout Reminder
 * Sends reminder emails to DocAdmins about payouts due on last day of month
 *
 * Trigger: On 29th at 09:00
 * Vercel Cron: 0 9 29 * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPayoutCronJobs } from '@/lib/cron/payout-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the month-end reminder job
    await runPayoutCronJobs('reminder-month-end');

    return NextResponse.json({
      success: true,
      message: 'Month-end payout reminder sent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Month-end reminder failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
