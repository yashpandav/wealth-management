/**
 * Admin Instrument Status API
 * PUT: Update instrument activation status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { instrumentStatusSchema } from '@/lib/validation/instrument.validation';
import { AuditAction } from '@prisma/client';

/**
 * PUT /api/admin/instruments/[id]/status
 * Update instrument activation status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    // Check if instrument exists
    const instrument = await prisma.instrument.findUnique({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            holdings: true,
          },
        },
      },
    });

    if (!instrument) {
      return NextResponse.json(
        { success: false, error: 'Instrument not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = instrumentStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { isActive, reason } = validationResult.data;

    // No change needed
    if (instrument.isActive === isActive) {
      return NextResponse.json({
        success: true,
        message: 'Instrument status unchanged',
        data: instrument,
      });
    }

    // Business rule: Cannot deactivate instruments with active holdings
    if (!isActive && instrument._count.holdings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot deactivate instrument with active holdings',
          details: {
            holdingsCount: instrument._count.holdings,
          },
        },
        { status: 400 }
      );
    }

    // Update instrument status
    const updatedInstrument = await prisma.instrument.update({
      where: { id: params.id },
      data: { isActive },
    });

    // Create audit log
    const action = isActive ? AuditAction.INSTRUMENT_ACTIVATE : AuditAction.INSTRUMENT_DEACTIVATE;
    const actionText = isActive ? 'activated' : 'deactivated';

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action,
        entityType: 'Instrument',
        entityId: updatedInstrument.id,
        description: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} instrument: ${updatedInstrument.name} (${updatedInstrument.symbol})${reason ? ` - Reason: ${reason}` : ''}`,
        metadata: {
          symbol: updatedInstrument.symbol,
          previousStatus: instrument.isActive,
          newStatus: isActive,
          reason: reason || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Instrument ${actionText} successfully`,
      data: updatedInstrument,
    });
  } catch (error: unknown) {
    console.error('Error updating instrument status:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update instrument status' },
      { status: 500 }
    );
  }
}
