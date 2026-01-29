/**
 * Public Product Detail API
 * GET: Get a single product with details (public access)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/products/[id]
 * Get product details (public access)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    const product = await prisma.investment.findUnique({
      where: {
        id: productId,
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
        { success: false, error: 'Product not found' },
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
      options: product.options.map((opt) => ({
        id: opt.id,
        duration: opt.duration,
        withdrawalFrequency: opt.withdrawalFrequency,
        roi: Number(opt.roi),
        annualReturn: Number(opt.annualReturn),
        displayOrder: opt.displayOrder,
      })),
    };

    return NextResponse.json({
      success: true,
      data: serializedProduct,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
