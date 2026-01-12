/**
 * Client Plan Detail API
 * GET: Get a single plan with its options
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/client/products/[id]
 * Get a single plan with its options
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get product with options
    const product = await prisma.product.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            duration: true,
            withdrawalFrequency: true,
            roi: true,
            annualReturn: true,
            displayOrder: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Serialize Decimal fields
    const serializedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      minAmount: Number(product.minAmount),
      maxAmount: product.maxAmount ? Number(product.maxAmount) : null,
      currency: product.currency,
      displayOrder: product.displayOrder,
      options: product.options.map((option) => ({
        id: option.id,
        duration: option.duration,
        withdrawalFrequency: option.withdrawalFrequency,
        roi: Number(option.roi),
        annualReturn: Number(option.annualReturn),
        displayOrder: option.displayOrder,
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        product: serializedProduct,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching product:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}
