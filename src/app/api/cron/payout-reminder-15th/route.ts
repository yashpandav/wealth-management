/**
 * Cron API: 15th Payout Reminder
 * Sends reminder emails to DocAdmins about payouts due on 15th
 *
 * Trigger: On 14th at 09:00
 * Vercel Cron: 0 9 14 * *
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

    // Run the 15th reminder job
    await runPayoutCronJobs('reminder-15th');

    return NextResponse.json({
      success: true,
      message: '15th payout reminder sent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: '15th reminder failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
