/**
 * Admin User Management API
 * GET - List all users with search/filter/pagination
 * POST - Create new user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { userSearchSchema, adminCreateUserSchema } from '@/lib/validation/user.validation';
import { prisma } from '@/lib/db/prisma';
import { sanitizeObject } from '@/lib/security';
import { hash } from 'bcryptjs';
import { config } from '@/lib/config';

/**
 * GET /api/admin/users
 * List all users with search, filter, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;

    // Parse and validate query parameters
    const validationResult = userSearchSchema.safeParse({
      query: searchParams.get('query') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { query, role, status, page, limit, sortBy, sortOrder } = validationResult.data;

    // Build where clause for filtering
    const where: Record<string, unknown> = {};

    // Search by name or email
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLogin: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error('Admin user list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    // Sanitize input
    const sanitizedBody = sanitizeObject(body);

    // Validate input
    const validationResult = adminCreateUserSchema.safeParse(sanitizedBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, phone, role, status } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate temporary password (will be sent via email)
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const hashedPassword = await hash(tempPassword, config.security.bcryptRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
        status,
        emailVerified: false, // Require email verification
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'USER_CREATE',
        entityType: 'User',
        entityId: newUser.id,
        description: `Admin created new user: ${email} with role ${role}`,
        metadata: {
          createdUser: {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
          },
        },
      },
    });

    // TODO: Send welcome email with temporary password
    // For now, return the temp password in response (remove in production)

    return NextResponse.json({
      success: true,
      data: {
        user: newUser,
        temporaryPassword: tempPassword, // TODO: Remove this, send via email instead
      },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Admin user creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
