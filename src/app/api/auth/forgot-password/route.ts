/**
 * Forgot Password API
 * POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resetPasswordRequestSchema } from '@/lib/validation/auth.validation';
import { sendPasswordResetEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import { runInBackground } from '@/lib/background';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Always return success to prevent email enumeration
    // Don't reveal whether the email exists or not
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.',
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        email,
        type: 'PASSWORD_RESET',
      },
    });

    // Store new reset token
    await prisma.verificationToken.create({
      data: {
        email,
        token,
        expiresAt,
        type: 'PASSWORD_RESET',
      },
    });

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, token, user.firstName);

    if (!emailSent) {
      console.error('Failed to send password reset email to:', email);
      // Don't fail the request if email fails - security measure
    }

    // Create audit log (non-critical side-effect)
    runInBackground(
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_CHANGE',
          entityType: 'User',
          entityId: user.id,
          description: 'Password reset requested',
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || '',
        },
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
