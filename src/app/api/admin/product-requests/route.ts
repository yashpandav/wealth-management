/**
 * Admin - Product Purchase Requests API
 * GET /api/admin/product-requests
 * Fetch all product purchase requests (investment plans) for admin review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { RequestStatus, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Authentication check
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        // Authorization check - ADMIN only
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as RequestStatus | null;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

        // Build filter conditions
        const where: Prisma.ProductPurchaseRequestWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { trackingNumber: { contains: search, mode: 'insensitive' } },
                { client: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
                { client: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
                { client: { user: { email: { contains: search, mode: 'insensitive' } } } },
                { investment: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Fetch total count for pagination
        const totalCount = await prisma.productPurchaseRequest.count({ where });

        // Fetch requests
        const requests = await prisma.productPurchaseRequest.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
                client: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                investment: true,
                investmentOption: true,
                assignedRM: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        // Serialize Decimal fields - Keep field names consistent with schema
        const serializedRequests = requests.map((req) => ({
            ...req,
            amount: Number(req.amount),
            investment: {
                ...req.investment,
                minAmount: Number(req.investment.minAmount),
                maxAmount: req.investment.maxAmount ? Number(req.investment.maxAmount) : null,
            },
            investmentOption: {
                ...req.investmentOption,
                roi: Number(req.investmentOption.roi),
                annualReturn: Number(req.investmentOption.annualReturn),
            },
        }));

        // Calculate aggregated stats (optional, but good for dashboard)
        // Only fetching status counts if standard "all" request from page 1 to allow simple summary
        let summary = null;
        if (page === 1 && !search && !status) {
            const stats = await prisma.productPurchaseRequest.groupBy({
                by: ['status'],
                _count: {
                    _all: true
                },
                _sum: {
                    amount: true
                }
            });

            const totalAmount = await prisma.productPurchaseRequest.aggregate({
                _sum: { amount: true },
                _count: { _all: true }
            });

            summary = {
                total: totalAmount._count._all,
                totalAmount: totalAmount._sum.amount ? Number(totalAmount._sum.amount) : 0,
                byStatus: stats.map(s => ({
                    status: s.status,
                    count: s._count._all,
                    totalAmount: s._sum.amount ? Number(s._sum.amount) : 0
                }))
            };
        }


        return NextResponse.json({
            success: true,
            data: {
                requests: serializedRequests,
                summary,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    hasNextPage: page * limit < totalCount,
                    hasPrevPage: page > 1,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching product requests:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch product requests' },
            { status: 500 }
        );
    }
}
