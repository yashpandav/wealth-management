/**
 * Admin Audit Logs Export API
 * Export audit logs to CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { z } from 'zod';

const auditLogExportSchema = z.object({
  query: z.string().max(200).optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/admin/audit-logs/export
 * Export audit logs to CSV
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();

    // Parse and validate query parameters
    const { searchParams } = request.nextUrl;
    const validationResult = auditLogExportSchema.safeParse({
      query: searchParams.get('query') || undefined,
      action: searchParams.get('action') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { query, action, entityType, userId, startDate, endDate } = validationResult.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { description: { contains: query, mode: 'insensitive' } },
        { entityId: { contains: query, mode: 'insensitive' } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
        { user: { firstName: { contains: query, mode: 'insensitive' } } },
        { user: { lastName: { contains: query, mode: 'insensitive' } } },
      ];
    }

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.createdAt = dateFilter;
    }

    // Fetch audit logs (limit to 10,000 records for export)
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    // Generate CSV
    const headers = [
      'Timestamp',
      'User Email',
      'User Name',
      'User Role',
      'Action',
      'Entity Type',
      'Entity ID',
      'Description',
      'IP Address',
      'User Agent',
      'Metadata',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map((log) => {
        const row = [
          new Date(log.createdAt).toISOString(),
          log.user.email,
          `${log.user.firstName} ${log.user.lastName}`,
          log.user.role,
          log.action,
          log.entityType,
          log.entityId,
          `"${(log.description || '').replace(/"/g, '""')}"`, // Escape quotes
          log.ipAddress || '',
          log.userAgent ? `"${log.userAgent.replace(/"/g, '""')}"` : '',
          log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
        ];
        return row.join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
