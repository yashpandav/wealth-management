import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailCronHandlers } from '@/lib/cron/email-reminders.cron';

/**
 * POST /api/cron/test
 * Manual trigger endpoint for testing cron jobs
 *
 * Request body:
 * {
 *   "job": "kycDay3" | "kycDay6" | "kycExpiry" | "monthlyPayout" | "contractRenewal"
 * }
 *
 * Only accessible by ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { job } = body;

    // Validate job name
    if (!job || !(job in emailCronHandlers)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid job name',
          availableJobs: Object.keys(emailCronHandlers)
        },
        { status: 400 }
      );
    }

    // Execute the cron job handler
    console.log(`[CRON TEST] Admin ${session.user.email} triggered job: ${job}`);
    const handler = emailCronHandlers[job as keyof typeof emailCronHandlers];
    const result = await handler();

    return NextResponse.json({
      success: true,
      message: `Cron job '${job}' executed successfully`,
      result,
      executedBy: session.user.email,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON TEST] Error executing cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute cron job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/test
 * List available cron jobs that can be tested
 */
export async function GET() {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Available cron jobs for manual testing',
      jobs: [
        {
          id: 'kycDay3',
          name: 'KYC Day 3 Reminders',
          description: 'Send KYC reminder to users 3 days after email verification',
          schedule: 'Daily at 9:00 AM'
        },
        {
          id: 'kycDay6',
          name: 'KYC Day 6 Warnings',
          description: 'Send KYC warning with deactivation notice 6 days after verification',
          schedule: 'Daily at 9:00 AM'
        },
        {
          id: 'kycExpiry',
          name: 'KYC Expiry Handler',
          description: 'Deactivate accounts and send expiry emails 7 days after verification',
          schedule: 'Daily at 9:00 AM'
        },
        {
          id: 'monthlyPayout',
          name: 'Monthly Payout Reminders',
          description: 'Send monthly payout reminders to clients with active investments',
          schedule: '15th of each month at 9:00 AM'
        },
        {
          id: 'contractRenewal',
          name: 'Contract Renewal Reminders',
          description: 'Send renewal reminders 60 days before contract expiry',
          schedule: 'Daily at 9:00 AM'
        }
      ],
      usage: {
        endpoint: '/api/cron/test',
        method: 'POST',
        body: {
          job: 'kycDay3 | kycDay6 | kycExpiry | monthlyPayout | contractRenewal'
        }
      }
    });

  } catch (error) {
    console.error('[CRON TEST] Error fetching cron job list:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cron job list',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
