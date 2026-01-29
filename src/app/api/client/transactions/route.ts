/**
 * API Route: Client Transactions
 * GET - Fetch client transaction history with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Role authorization
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Client access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get Client ID from User ID
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Client profile not found',
      }, { status: 404 });
    }

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      clientId: client.id,
    };

    // Type filter
    if (type && type !== 'all') {
      where.type = type as Prisma.EnumTransactionTypeFilter;
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status as Prisma.EnumTransactionStatusFilter;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.total = {};
      if (minAmount) {
        where.total.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.total.lte = parseFloat(maxAmount);
      }
    }

    // Search filter (transaction ID only)
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Build sort
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Fetch transactions and total count
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Serialize Decimal fields
    const serializedTransactions = transactions.map((txn) => ({
      id: txn.id,
      clientId: txn.clientId,
      type: txn.type,
      status: txn.status,
      amount: Number(txn.amount),
      total: Number(txn.total),
      fees: Number(txn.fees),
      netAmount: Number(txn.netAmount),
      currency: txn.currency,
      bankStatementReference: txn.bankStatementReference,
      paymentProof: txn.paymentProof,
      processedById: txn.processedById,
      approvedById: txn.approvedById,
      payoutId: txn.payoutId,
      notes: txn.notes,
      metadata: txn.metadata,
      failureReason: txn.failureReason,
      completedAt: txn.completedAt.toISOString(),
      createdAt: txn.createdAt.toISOString(),
      updatedAt: txn.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: serializedTransactions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
}
