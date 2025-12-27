/**
 * Admin Leads API - FORBIDDEN
 * Lead management has been moved to DocAdmin exclusively
 * Use /api/docadmin/leads instead (DocAdmin role only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/leads - FORBIDDEN
 * Lead management is now exclusive to DocAdmin
 * Redirect to /api/docadmin/leads
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If DocAdmin, inform them to use the correct endpoint
    if (session.user.role === 'DOCADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Please use /api/docadmin/leads endpoint for lead management',
        },
        { status: 403 }
      );
    }

    // For all other roles (including ADMIN), return forbidden
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden: Lead management is exclusive to DocAdmin role',
        message:
          'As of the latest update, all lead-related operations have been transferred to the DocAdmin role. Please contact your administrator for access.',
      },
      { status: 403 }
    );
  } catch (error: unknown) {
    console.error('Error in admin leads API:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
