/**
 * Admin Individual Instrument API
 * GET: Get single instrument by ID
 * PUT: Update instrument
 * DELETE: Soft delete instrument
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { updateInstrumentSchema, type UpdateInstrumentInput } from '@/lib/validation/instrument.validation';
import { AuditAction } from '@prisma/client';

/**
 * GET /api/admin/instruments/[id]
 * Get single instrument by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const instrument = await prisma.instrument.findUnique({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            holdings: true,
            transactions: true,
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

    return NextResponse.json({
      success: true,
      data: instrument,
    });
  } catch (error: unknown) {
    console.error('Error fetching instrument:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch instrument' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/instruments/[id]
 * Update instrument
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    // Check if instrument exists
    const existingInstrument = await prisma.instrument.findUnique({
      where: {
        id: params.id,
        deletedAt: null,
      },
    });

    if (!existingInstrument) {
      return NextResponse.json(
        { success: false, error: 'Instrument not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateInstrumentSchema.safeParse({
      ...body,
      id: params.id,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid instrument data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { id: _id, ...data }: UpdateInstrumentInput = validationResult.data;

    // Check for symbol conflicts (if symbol is being updated)
    if (data.symbol && data.symbol !== existingInstrument.symbol) {
      const conflictingSymbol = await prisma.instrument.findFirst({
        where: {
          symbol: data.symbol,
          id: { not: params.id },
          deletedAt: null,
        },
      });

      if (conflictingSymbol) {
        return NextResponse.json(
          { success: false, error: 'Instrument with this symbol already exists' },
          { status: 409 }
        );
      }
    }

    // Check for ISIN conflicts (if ISIN is being updated)
    if (data.isin && data.isin !== existingInstrument.isin) {
      const conflictingISIN = await prisma.instrument.findFirst({
        where: {
          isin: data.isin,
          id: { not: params.id },
          deletedAt: null,
        },
      });

      if (conflictingISIN) {
        return NextResponse.json(
          { success: false, error: 'Instrument with this ISIN already exists' },
          { status: 409 }
        );
      }
    }

    // Track changes for audit log
    const changes: Record<string, { old: string | null; new: string | null }> = {};
    Object.keys(data).forEach((key) => {
      const oldValue = existingInstrument[key as keyof typeof existingInstrument];
      const newValue = data[key as keyof typeof data];

      if (oldValue !== newValue) {
        changes[key] = {
          old: oldValue?.toString() || null,
          new: newValue?.toString() || null,
        };
      }
    });

    // Update instrument
    const updatedInstrument = await prisma.instrument.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.launchDate && { launchDate: new Date(data.launchDate) }),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.INSTRUMENT_UPDATE,
        entityType: 'Instrument',
        entityId: updatedInstrument.id,
        description: `Updated instrument: ${updatedInstrument.name} (${updatedInstrument.symbol})`,
        metadata: {
          changes,
          fieldsUpdated: Object.keys(changes),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Instrument updated successfully',
      data: updatedInstrument,
    });
  } catch (error: unknown) {
    console.error('Error updating instrument:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Instrument with this symbol or ISIN already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update instrument' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/instruments/[id]
 * Soft delete instrument
 */
export async function DELETE(
  _request: NextRequest,
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
            transactions: true,
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

    // Check if instrument has active holdings
    if (instrument._count.holdings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete instrument with active holdings',
          details: {
            holdingsCount: instrument._count.holdings,
          },
        },
        { status: 400 }
      );
    }

    // Soft delete instrument
    const deletedInstrument = await prisma.instrument.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.INSTRUMENT_DELETE,
        entityType: 'Instrument',
        entityId: deletedInstrument.id,
        description: `Deleted instrument: ${deletedInstrument.name} (${deletedInstrument.symbol})`,
        metadata: {
          symbol: deletedInstrument.symbol,
          type: deletedInstrument.type,
          transactionsCount: instrument._count.transactions,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Instrument deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting instrument:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete instrument' },
      { status: 500 }
    );
  }
}
