/**
 * Admin Bulk Instrument Operations API
 * POST: Perform bulk operations on instruments (activate, deactivate, delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { bulkInstrumentOperationSchema } from '@/lib/validation/instrument.validation';
import { AuditAction } from '@prisma/client';

/**
 * POST /api/admin/instruments/bulk-operations
 * Perform bulk operations on multiple instruments
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = bulkInstrumentOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bulk operation data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { instrumentIds, operation, reason } = validationResult.data;

    // Verify all instruments exist
    const instruments = await prisma.instrument.findMany({
      where: {
        id: { in: instrumentIds },
        deletedAt: null,
      },
      select: {
        id: true,
        symbol: true,
        name: true,
        isActive: true,
        _count: {
          select: {
            holdings: true,
          },
        },
      },
    });

    // Check if all requested instruments were found
    if (instruments.length !== instrumentIds.length) {
      const foundIds = instruments.map((i) => i.id);
      const missingIds = instrumentIds.filter((id) => !foundIds.includes(id));

      return NextResponse.json(
        {
          success: false,
          error: 'Some instruments not found',
          details: {
            missingIds,
            foundCount: instruments.length,
            requestedCount: instrumentIds.length,
          },
        },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {};
    let auditAction: AuditAction;
    let operationDescription: string;
    let successCount = 0;
    const errors: Array<{ id: string; symbol: string; error: string }> = [];

    // Perform operation based on type
    switch (operation) {
      case 'activate':
        updateData = { isActive: true };
        auditAction = AuditAction.INSTRUMENT_ACTIVATE;
        operationDescription = 'activated';
        break;

      case 'deactivate':
        updateData = { isActive: false };
        auditAction = AuditAction.INSTRUMENT_DEACTIVATE;
        operationDescription = 'deactivated';
        break;

      case 'delete': {
        // Check for instruments with active holdings
        const instrumentsWithHoldings = instruments.filter((i) => i._count.holdings > 0);

        if (instrumentsWithHoldings.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot delete instruments with active holdings',
              details: {
                instrumentsWithHoldings: instrumentsWithHoldings.map((i) => ({
                  id: i.id,
                  symbol: i.symbol,
                  name: i.name,
                  holdingsCount: i._count.holdings,
                })),
              },
            },
            { status: 400 }
          );
        }

        updateData = { deletedAt: new Date(), isActive: false };
        auditAction = AuditAction.INSTRUMENT_DELETE;
        operationDescription = 'deleted';
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation type' },
          { status: 400 }
        );
    }

    // Process each instrument
    const results = await Promise.allSettled(
      instruments.map(async (instrument) => {
        // Skip if no change needed (for activate/deactivate)
        if (operation === 'activate' && instrument.isActive) {
          return { id: instrument.id, skipped: true };
        }
        if (operation === 'deactivate' && !instrument.isActive) {
          return { id: instrument.id, skipped: true };
        }

        // Update instrument
        await prisma.instrument.update({
          where: { id: instrument.id },
          data: updateData,
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: admin.id,
            action: auditAction,
            entityType: 'Instrument',
            entityId: instrument.id,
            description: `Bulk ${operationDescription} instrument: ${instrument.name} (${instrument.symbol})${reason ? ` - Reason: ${reason}` : ''}`,
            metadata: {
              bulkOperation: true,
              operation,
              symbol: instrument.symbol,
              reason: reason || null,
              previousStatus: instrument.isActive,
            },
          },
        });

        return { id: instrument.id, success: true };
      })
    );

    // Count successes and collect errors
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (!result.value.skipped) {
          successCount++;
        }
      } else {
        errors.push({
          id: instruments[index].id,
          symbol: instruments[index].symbol,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bulk operation completed: ${successCount} instrument(s) ${operationDescription}`,
      data: {
        operation,
        totalRequested: instrumentIds.length,
        successCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: unknown) {
    console.error('Error performing bulk operation:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
