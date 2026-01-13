/**
 * Client Plans API
 * GET: List available investment plans (Venture A, B, C)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/client/products
 * List active plans with their options
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active products with their options
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
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

    // Serialize Decimal fields
    const serializedProducts = products.map((product) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: serializedProducts,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching products:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
