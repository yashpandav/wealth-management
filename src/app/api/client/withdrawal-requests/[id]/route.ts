/**
 * Client - Withdrawal Request Detail API
 * Get detailed information about a specific withdrawal request
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: never,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and client authorization
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Client access required' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;

    // Fetch the withdrawal request - ensure it belongs to this client
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: {
        id,
        clientId: session.user.id, // Authorization: only fetch if belongs to this client
      },
    });

    if (!withdrawalRequest) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request not found or access denied' },
        { status: 404 }
      );
    }

    // Serialize Decimal fields
    const serializedRequest = {
      ...withdrawalRequest,
      amount: Number(withdrawalRequest.amount),
    };

    return NextResponse.json({
      success: true,
      data: {
        request: serializedRequest,
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawal request details for client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal request details' },
      { status: 500 }
    );
  }
}
