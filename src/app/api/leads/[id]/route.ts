/**
 * Lead Detail API
 * GET: Fetch a specific lead by ID for prefilling registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/leads/[id]
 * Fetch lead data by ID (public endpoint for prefilling registration)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    // Fetch the lead
    const lead = await prisma.userLead.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        leadSource: true,
        rmReference: true,
        status: true,
        createdAt: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: lead,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching lead:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch lead data' },
      { status: 500 }
    );
  }
}
