/**
 * Public Products API
 * GET: List available investment products for public viewing
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/products
 * List active products with their options (public access)
 */
export async function GET() {
  try {
    // Get all active investments with their options
    const products = await prisma.investment.findMany({
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
      options: product.options.map((opt) => ({
        id: opt.id,
        duration: opt.duration,
        withdrawalFrequency: opt.withdrawalFrequency,
        roi: Number(opt.roi),
        annualReturn: Number(opt.annualReturn),
        displayOrder: opt.displayOrder,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: serializedProducts,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
