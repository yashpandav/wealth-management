/**
 * User Registration API
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validation/auth.validation';
import { sendVerificationEmail } from '@/lib/email';
import { config } from '@/lib/config';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

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

    const { email, password, firstName, lastName, phone, role } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email already exists',
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, config.security.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: role || 'CLIENT',
        status: 'ACTIVE',
        emailVerified: !config.features.emailVerification, // Skip verification if disabled
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Create audit log
    if (config.features.auditLog) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_CREATE',
          entityType: 'User',
          entityId: user.id,
          description: `User registered: ${email}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || '',
        },
      });
    }

    // Send verification email if enabled
    if (config.features.emailVerification) {
      // Generate verification token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

      // Store token in database
      await prisma.verificationToken.create({
        data: {
          email,
          token,
          expiresAt,
          type: 'EMAIL_VERIFICATION',
        },
      });

      // Send email
      const emailSent = await sendVerificationEmail(email, token, firstName);

      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
        // Don't fail registration if email fails
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Registration successful! Please check your email to verify your account.',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        },
        { status: 201 }
      );
    }

    // Email verification disabled - return success
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! You can now log in.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during registration. Please try again.',
      },
      { status: 500 }
    );
  }
}
