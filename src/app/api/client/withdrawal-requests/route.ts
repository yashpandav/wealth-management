/**
 * Client Withdrawal Requests API
 * POST: Submit a new withdrawal request
 * GET: List client's withdrawal requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import {
  createWithdrawalRequestSchema,
  type CreateWithdrawalRequestInput,
} from '@/lib/validation/withdrawal-request.validation';
import { WithdrawalStatus } from '@prisma/client';
import { sendWithdrawalRequestSubmittedEmail } from '@/lib/email/email.service';
import { checkTransactionEligibility } from '@/lib/utils/client-utils';

/**
 * Generate unique tracking number
 * Format: WR-YYYYMMDD-XXXXXX (WR = Withdrawal Request)
 */
function generateTrackingNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `WR-${year}${month}${day}-${random}`;
}

/**
 * Handle POST requests to create a new client withdrawal request.
 *
 * Validates authentication and client eligibility, validates request data and balances,
 * creates a withdrawal request with a unique tracking number, sends a confirmation email,
 * and returns the created request summary on success.
 *
 * @returns A JSON response object containing `success` and either the created withdrawal request data
 * (fields: `id`, `trackingNumber`, `status`, `amount`, `createdAt`) on success, or an `error` and
 * optional `details` on failure.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get client record with portfolio using userId
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        portfolio: {
          select: {
            id: true,
            totalValue: true,
          },
        },
        assignedRM: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client record not found' }, { status: 404 });
    }

    if (!client.portfolio) {
      return NextResponse.json({ success: false, error: 'No portfolio found. Unable to process withdrawal.' }, { status: 400 });
    }

    // Check if client can make transactions (RM assigned + KYC verified)
    const eligibility = checkTransactionEligibility(
      !!client.assignedRMId,
      client.verificationStatus
    );

    if (!eligibility.canTransact) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason || 'You are not eligible to make withdrawal requests',
          details: eligibility.banner?.message,
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createWithdrawalRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid withdrawal request data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data: CreateWithdrawalRequestInput = validationResult.data;

    // Validate amount against available balance
    const availableBalance = Number(client.portfolio.totalValue);

    if (data.amount > availableBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${data.amount.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Minimum withdrawal validation (e.g., $100)
    const minimumWithdrawal = 100;
    if (data.amount < minimumWithdrawal) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum withdrawal amount is $${minimumWithdrawal.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Generate unique tracking number
    let trackingNumber: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      trackingNumber = generateTrackingNumber();

      const existing = await prisma.withdrawalRequest.findUnique({
        where: { trackingNumber },
      });

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique tracking number. Please try again.' },
        { status: 500 }
      );
    }

    // Create withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        trackingNumber: trackingNumber!,
        clientId: client.id,
        amount: data.amount,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch || null,
        swiftCode: data.swiftCode || null,
        status: WithdrawalStatus.PENDING,
        reason: data.reason,
        clientNotes: data.clientNotes || null,
      },
    });

    // Send confirmation email to client
    await sendWithdrawalRequestSubmittedEmail(
      client.user.email,
      client.user.firstName,
      trackingNumber!,
      data.amount,
      'USD'
    );

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        id: withdrawalRequest.id,
        trackingNumber: withdrawalRequest.trackingNumber,
        status: withdrawalRequest.status,
        amount: Number(withdrawalRequest.amount),
        createdAt: withdrawalRequest.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting withdrawal request:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to submit withdrawal request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/client/withdrawal-requests
 * List client's withdrawal requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as WithdrawalStatus | null;

    // Build where clause
    const where = {
      clientId: client.id,
      ...(status && { status }),
    };

    // Get total count
    const totalCount = await prisma.withdrawalRequest.count({ where });

    // Get requests
    const requests = await prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        processedByRM: {
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
        approvedByAdmin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Serialize Decimal fields
    const serializedRequests = requests.map((req) => ({
      ...req,
      amount: Number(req.amount),
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      rmProcessedAt: req.rmProcessedAt?.toISOString() || null,
      adminProcessedAt: req.adminProcessedAt?.toISOString() || null,
      rejectedAt: req.rejectedAt?.toISOString() || null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        requests: serializedRequests,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}