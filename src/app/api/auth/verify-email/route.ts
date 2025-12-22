/**
 * Email Verification API
 * GET /api/auth/verify-email?token=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyEmailSchema } from '@/lib/validation/auth.validation';
import { sendWelcomeEmailWithKYCPrompt } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    const validationResult = verifyEmailSchema.safeParse({ token });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification token',
        },
        { status: 400 }
      );
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: validationResult.data.token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification token',
        },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification token has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Check if token was already used
    if (verificationToken.used) {
      return NextResponse.json(
        {
          success: false,
          error: 'This verification token has already been used',
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Update user as verified and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_UPDATE',
          entityType: 'User',
          entityId: user.id,
          description: 'Email verified successfully',
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || '',
        },
      }),
    ]);

    // Send welcome email with KYC prompt (non-blocking)
    sendWelcomeEmailWithKYCPrompt(user.email, user.firstName).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully! You can now log in.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during email verification. Please try again.',
      },
      { status: 500 }
    );
  }
}
