/**
 * POST /api/demo/payout-trigger
 *
 * One-click payout cron trigger for live demos.
 * Runs the payout generation job immediately (no schedule required).
 *
 * Protected by DEMO_SECRET env var — set it to anything in .env.local.
 * If DEMO_SECRET is not set, the route is disabled in production.
 *
 * Body (optional):
 * {
 *   "lookAheadDays": 3,   // how many days ahead to look for due schedules (default 3)
 *   "secret": "..."       // must match DEMO_SECRET env var
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPendingPayouts } from '@/lib/services/payout.service';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // ── Guard: disable in production unless DEMO_SECRET is set ──
  const demoSecret = process.env.DEMO_SECRET;

  if (process.env.NODE_ENV === 'production' && !demoSecret) {
    return NextResponse.json(
      { success: false, error: 'Demo endpoint is disabled. Set DEMO_SECRET to enable.' },
      { status: 403 }
    );
  }

  // ── Validate secret if set ──
  if (demoSecret) {
    const body = await request.json().catch(() => ({})) as { secret?: string; lookAheadDays?: number };
    if (body.secret !== demoSecret) {
      return NextResponse.json(
        { success: false, error: 'Invalid demo secret.' },
        { status: 401 }
      );
    }
  }

  const body = await request.json().catch(() => ({})) as { lookAheadDays?: number };
  const lookAheadDays = body.lookAheadDays ?? 3;

  try {
    // Count before
    const beforeCount = await prisma.payout.count({ where: { status: 'PENDING' } });

    // Run the cron job logic
    const created = await createPendingPayouts(lookAheadDays);

    // Count after
    const afterCount = await prisma.payout.count({ where: { status: 'PENDING' } });

    // Fetch the newly created payouts for the response
    const pendingPayouts = await prisma.payout.findMany({
      where: { status: 'PENDING' },
      include: {
        client: { include: { user: true } },
        productPurchaseRequest: {
          include: { investment: true, investmentOption: true },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      message: `Payout cron job executed. ${created} new payout record(s) created.`,
      stats: {
        pendingBefore:    beforeCount,
        pendingAfter:     afterCount,
        newPayoutsCreated: created,
        lookAheadDays,
      },
      pendingPayouts: pendingPayouts.map(p => ({
        id:             p.id,
        clientName:     `${p.client.user.firstName} ${p.client.user.lastName}`,
        clientEmail:    p.client.user.email,
        amount:         Number(p.amount),
        currency:       'AED',
        scheduledDate:  p.scheduledDate,
        periodStart:    p.periodStart,
        periodEnd:      p.periodEnd,
        status:         p.status,
        investment:     p.productPurchaseRequest.investment.name,
        frequency:      p.productPurchaseRequest.investmentOption.withdrawalFrequency,
        trackingNumber: p.productPurchaseRequest.trackingNumber,
      })),
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[DEMO] Payout trigger failed:', error);
    return NextResponse.json(
      {
        success: false,
        error:   'Payout generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/demo/payout-trigger
 * Returns current payout status (useful for demo dashboards)
 */
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, completed, overdue, upcoming] = await Promise.all([
      prisma.payout.count({ where: { status: 'PENDING' } }),
      prisma.payout.count({ where: { status: 'COMPLETED' } }),
      prisma.payout.count({ where: { status: 'PENDING', scheduledDate: { lt: today } } }),
      prisma.payout.count({ where: { status: 'PENDING', scheduledDate: { gte: today } } }),
    ]);

    const unprocessedSchedules = await prisma.payoutSchedule.count({
      where: { isProcessed: false },
    });

    const pendingPayouts = await prisma.payout.findMany({
      where: { status: 'PENDING' },
      include: {
        client: { include: { user: true } },
        productPurchaseRequest: { include: { investment: true } },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      stats: {
        pendingTotal:        pending,
        pendingUpcoming:     upcoming,
        pendingOverdue:      overdue,
        completed,
        unprocessedSchedules,
      },
      pendingPayouts: pendingPayouts.map(p => ({
        id:             p.id,
        clientName:     `${p.client.user.firstName} ${p.client.user.lastName}`,
        clientEmail:    p.client.user.email,
        amount:         Number(p.amount),
        scheduledDate:  p.scheduledDate,
        status:         p.status,
        investment:     p.productPurchaseRequest.investment.name,
        trackingNumber: p.productPurchaseRequest.trackingNumber,
      })),
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payout status' },
      { status: 500 }
    );
  }
}
