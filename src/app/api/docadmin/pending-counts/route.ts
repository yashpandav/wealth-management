/**
 * API endpoint to fetch pending counts for docadmin sidebar badges
 * Returns counts for document verification and RM assignment pending
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has DOCADMIN role
    if (!session || session.user.role !== 'DOCADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch pending document verification count (PENDING + UNDER_REVIEW)
    const pendingDocuments = await prisma.document.count({
      where: {
        verificationStatus: {
          in: ['PENDING', 'UNDER_REVIEW']
        }
      }
    });

    // Fetch clients pending RM assignment
    // (Clients who have VERIFIED status but no RM assigned)
    const pendingRmAssignment = await prisma.client.count({
      where: {
        verificationStatus: 'VERIFIED',
        assignedRMId: null
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        documentVerification: pendingDocuments,
        rmAssignment: pendingRmAssignment
      }
    });
  } catch (error) {
    console.error('Error fetching pending counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending counts' },
      { status: 500 }
    );
  }
}
