/**
 * Cron API: Daily Payout Generation
 * Creates pending payouts from due schedules
 *
 * Trigger: Daily at 00:00
 * Vercel Cron: 0 0 * * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPayoutCronJobs } from '@/lib/cron/payout-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security layer)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the daily payout generation job
    await runPayoutCronJobs('daily');

    return NextResponse.json({
      success: true,
      message: 'Daily payout generation completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Payout generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
