/**
 * API Route: RM Leads
 * GET - Fetch leads assigned to RM (not yet registered)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Fetches unregistered leads assigned to the authenticated relationship manager (RM), with pagination and optional search and source filters.
 *
 * @param request - Incoming Next.js request containing query parameters: `page`, `limit`, `search`, and `source`
 * @returns On success, JSON with `data` containing `leads` (selected lead fields) and `pagination` (page, limit, totalCount, totalPages, hasMore). On failure, JSON with an `error` message and one of:
 * - 401 Unauthorized when the user is not signed in
 * - 403 Forbidden when the user is not an RM
 * - 404 Not Found when the RM profile does not exist
 * - 500 Internal Server Error on unexpected failures
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RM') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - RM access required' },
        { status: 403 }
      );
    }

    // Get RM record
    const rm = await prisma.relationshipManager.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!rm) {
      return NextResponse.json(
        { success: false, error: 'RM profile not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const source = searchParams.get('source');

    // Build where clause - leads assigned to this RM that are NOT yet registered (userId is null)
    const where: Prisma.UserLeadWhereInput = {
      assignedRMId: rm.id, // Filter by actual RM ID (not text reference)
      userId: null, // Only leads not yet converted to registered users
      status: { notIn: ['CONVERTED', 'LOST'] }, // Exclude converted and lost leads
      // Search filter
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      // Source filter
      ...(source && source !== 'ALL' && { leadSource: source as any }),
    };

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch leads and total count
    const [leads, totalCount] = await Promise.all([
      prisma.userLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userLead.count({ where }),
    ]);

    // Serialize data
    const serializedLeads = leads.map((lead) => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phoneNumber: lead.phoneNumber,
      leadSource: lead.leadSource,
      status: lead.status,
      rmReference: lead.rmReference,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        leads: serializedLeads,
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
    console.error('Error fetching RM leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}