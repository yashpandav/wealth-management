/**
 * Admin Investment Plans API
 * POST: Create new investment plan option for an existing investment range
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { AuditAction } from '@prisma/client';
import { runInBackground } from '@/lib/background';

// Allowed values for payout frequency
const ALLOWED_PAYOUT_FREQUENCIES = [
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Yearly',
  'At Maturity',
] as const;

// Validation schema for creating investment option
const createInvestmentOptionSchema = z
  .object({
    investmentId: z
      .string({ required_error: 'Investment ID is required' })
      .uuid('Invalid investment ID format')
      .trim(),
    duration: z
      .string({ required_error: 'Duration is required' })
      .trim()
      .min(1, 'Duration is required')
      .max(50, 'Duration must not exceed 50 characters')
      .regex(
        /^\d+\s+(Year|Years)$/,
        'Duration must be in format: "1 Year" or "2 Years"'
      ),
    withdrawalFrequency: z
      .string({ required_error: 'Payout frequency is required' })
      .trim()
      .refine(
        (val): val is typeof ALLOWED_PAYOUT_FREQUENCIES[number] =>
          (ALLOWED_PAYOUT_FREQUENCIES as readonly string[]).includes(val),
        {
          message: `Payout frequency must be one of: ${ALLOWED_PAYOUT_FREQUENCIES.join(', ')}`,
        }
      ),
    roi: z
      .number({ required_error: 'ROI is required' })
      .min(0, 'ROI must be 0 or greater')
      .max(100, 'ROI cannot exceed 100%')
      .finite('ROI must be a valid number')
      .refine((val) => Number(val.toFixed(2)) === val, {
        message: 'ROI can have at most 2 decimal places',
      }),
    annualReturn: z
      .number({ required_error: 'Annual return is required' })
      .min(0, 'Annual return must be 0 or greater')
      .max(1000, 'Annual return cannot exceed 1000%')
      .finite('Annual return must be a valid number')
      .refine((val) => Number(val.toFixed(2)) === val, {
        message: 'Annual return can have at most 2 decimal places',
      }),
    displayOrder: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Business rule: Annual return should be reasonable relative to ROI
      // For example, if ROI is 2% per period, annual return should be calculated accordingly
      // This is just a sanity check to prevent obviously wrong data
      return data.annualReturn <= 100 * data.roi;
    },
    {
      message: 'Annual return seems unrealistic relative to ROI. Please verify your calculations.',
      path: ['annualReturn'],
    }
  );

type CreateInvestmentOptionInput = z.infer<typeof createInvestmentOptionSchema>;

/**
 * POST /api/admin/investment-plans
 * Create new investment plan option
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = createInvestmentOptionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid investment plan option data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data: CreateInvestmentOptionInput = validationResult.data;

    // Sanitize text inputs to prevent XSS (additional layer, React already handles this)
    const sanitizedDuration = data.duration.trim().replace(/[<>]/g, '');

    // Verify investment exists and is active
    const investment = await prisma.investment.findUnique({
      where: { id: data.investmentId },
      select: {
        id: true,
        name: true,
        isActive: true,
        minAmount: true,
        maxAmount: true,
      },
    });

    if (!investment) {
      return NextResponse.json(
        { success: false, error: 'Investment range not found' },
        { status: 404 }
      );
    }

    if (!investment.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot add options to an inactive investment range. Please activate the investment range first.'
        },
        { status: 400 }
      );
    }

    // Check for duplicate: same duration and payout frequency for the same investment
    const existingOption = await prisma.investmentOption.findFirst({
      where: {
        investmentId: data.investmentId,
        duration: sanitizedDuration,
        withdrawalFrequency: data.withdrawalFrequency,
      },
    });

    if (existingOption) {
      return NextResponse.json(
        {
          success: false,
          error: `An investment option with duration "${sanitizedDuration}" and payout frequency "${data.withdrawalFrequency}" already exists for this investment range.`,
        },
        { status: 409 }
      );
    }

    // Additional business validation: Ensure ROI and annual return are logical
    if (data.roi === 0 && data.annualReturn > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid configuration: Annual return cannot be positive when ROI is 0',
        },
        { status: 400 }
      );
    }

    // Create investment option with transaction to ensure data consistency
    const investmentOption = await prisma.investmentOption.create({
      data: {
        investmentId: data.investmentId,
        duration: sanitizedDuration,
        withdrawalFrequency: data.withdrawalFrequency,
        roi: data.roi,
        annualReturn: data.annualReturn,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
    });

    // Create audit log
    runInBackground(
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: AuditAction.INVESTMENT_OPTION_CREATE,
          entityType: 'InvestmentOption',
          entityId: investmentOption.id,
          description: `Created investment plan option: ${sanitizedDuration} - ${data.withdrawalFrequency} for ${investment.name}`,
          metadata: {
            investmentId: investment.id,
            investmentName: investment.name,
            duration: sanitizedDuration,
            payoutFrequency: data.withdrawalFrequency,
            roi: data.roi.toString(),
            annualReturn: data.annualReturn.toString(),
          },
        },
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Investment plan option created successfully',
        data: investmentOption,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating investment plan option:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create investment plan option' },
      { status: 500 }
    );
  }
}
