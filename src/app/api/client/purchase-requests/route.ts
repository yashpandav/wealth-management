/**
 * Client Investment Requests API
 * POST: Submit a new investment request
 * GET: List client's investment requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import {
  createPurchaseRequestSchema,
  type CreatePurchaseRequestInput,
} from '@/lib/validation/purchase-request.validation';
import { RequestStatus } from '@prisma/client';
import { checkTransactionEligibility } from '@/lib/utils/client-utils';
import { sendPurchaseRequestSubmittedEmail, sendRMPurchaseRequestNotification } from '@/lib/email';

/**
 * Generate unique tracking number
 * Format: PR-YYYYMMDD-XXXXXX (PR = Purchase Request)
 */
function generateTrackingNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `PR-${year}${month}${day}-${random}`;
}

/**
 * POST /api/client/purchase-requests
 * Submit a new investment request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get client record using userId
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      include: {
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

    // Check if client can make transactions (RM assigned + KYC verified)
    const eligibility = checkTransactionEligibility(
      !!client.assignedRMId,
      client.verificationStatus
    );

    if (!eligibility.canTransact) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason || 'You are not eligible to make investment requests',
          details: eligibility.banner?.message,
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createPurchaseRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid investment request data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data: CreatePurchaseRequestInput = validationResult.data;

    // Verify instrument exists and is available
    const instrument = await prisma.instrument.findUnique({
      where: { id: data.instrumentId },
      select: {
        id: true,
        symbol: true,
        name: true,
        currentPrice: true,
        currency: true,
        minimumInvestment: true,
        isActive: true,
        isPublic: true,
        deletedAt: true,
      },
    });

    if (!instrument || instrument.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Instrument not found' },
        { status: 404 }
      );
    }

    if (!instrument.isActive || !instrument.isPublic) {
      return NextResponse.json(
        { success: false, error: 'Instrument is not available for purchase' },
        { status: 400 }
      );
    }

    // Validate amount against minimum investment
    if (instrument.minimumInvestment && data.amount < Number(instrument.minimumInvestment)) {
      return NextResponse.json(
        {
          success: false,
          error: `Amount is below minimum investment of ${instrument.currency} ${Number(instrument.minimumInvestment).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Calculate quantity based on current price
    const quantity = data.amount / Number(instrument.currentPrice);

    // Generate unique tracking number
    let trackingNumber: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      trackingNumber = generateTrackingNumber();

      const existing = await prisma.purchaseRequest.findUnique({
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

    // Create purchase request
    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        trackingNumber: trackingNumber!,
        clientId: client.id,
        instrumentId: data.instrumentId,
        amount: data.amount,
        quantity,
        requestedPrice: Number(instrument.currentPrice),
        status: RequestStatus.PENDING,
        clientNotes: data.clientNotes || null,
      },
      include: {
        instrument: {
          select: {
            id: true,
            symbol: true,
            name: true,
            type: true,
            currentPrice: true,
            currency: true,
          },
        },
      },
    });

    // Get client user details for email
    const clientUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, email: true, lastName: true },
    });

    // Send confirmation email to client
    if (clientUser) {
      sendPurchaseRequestSubmittedEmail(
        clientUser.email,
        clientUser.firstName,
        purchaseRequest.trackingNumber!,
        instrument.name,
        instrument.symbol,
        data.amount,
        instrument.currency
      ).catch(err => console.error('Failed to send client confirmation email:', err));
    }

    // Send notification to RM (if assigned)
    if (client.assignedRM) {
      const rmName = `${client.assignedRM.user.firstName} ${client.assignedRM.user.lastName}`;
      const clientName = `${clientUser?.firstName || ''} ${clientUser?.lastName || ''}`.trim();

      sendRMPurchaseRequestNotification(
        client.assignedRM.user.email,
        rmName,
        clientName,
        purchaseRequest.trackingNumber!,
        instrument.name,
        instrument.symbol,
        data.amount,
        instrument.currency
      ).catch(err => console.error('Failed to send RM notification email:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Investment request submitted successfully',
      data: {
        id: purchaseRequest.id,
        trackingNumber: purchaseRequest.trackingNumber,
        status: purchaseRequest.status,
        amount: Number(purchaseRequest.amount),
        quantity: Number(purchaseRequest.quantity),
        instrument: {
          ...purchaseRequest.instrument,
          currentPrice: Number(purchaseRequest.instrument.currentPrice),
        },
        createdAt: purchaseRequest.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error submitting purchase request:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to submit investment request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/client/purchase-requests
 * List client's purchase requests
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
    const status = searchParams.get('status') as RequestStatus | null;

    // Build where clause
    const where: Record<string, unknown> = {
      clientId: client.id,
      ...(status && { status }),
    };

    // Get total count
    const totalCount = await prisma.purchaseRequest.count({ where });

    // Get requests
    const requests = await prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        instrument: {
          select: {
            id: true,
            symbol: true,
            name: true,
            type: true,
            currentPrice: true,
            currency: true,
          },
        },
      },
    });

    // Serialize Decimal fields
    const serializedRequests = requests.map((req) => ({
      ...req,
      amount: Number(req.amount),
      quantity: req.quantity ? Number(req.quantity) : null,
      requestedPrice: req.requestedPrice ? Number(req.requestedPrice) : null,
      instrument: {
        ...req.instrument,
        currentPrice: Number(req.instrument.currentPrice),
      },
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      processedAt: req.processedAt?.toISOString() || null,
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
  } catch (error: unknown) {
    console.error('Error fetching purchase requests:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch investment requests' },
      { status: 500 }
    );
  }
}
