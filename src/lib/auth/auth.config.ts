/**
 * NextAuth.js Configuration
 * Credentials provider with email/password authentication
 */

import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { config } from '@/lib/config';
import { UserRole, VerificationStatus } from '@prisma/client';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      firstName: string | null;
      lastName: string | null;
      status: string;
      verificationStatus: VerificationStatus | null; // Only for CLIENT role
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName: string | null;
    lastName: string | null;
    status: string;
    verificationStatus: VerificationStatus | null; // Only for CLIENT role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    firstName: string | null;
    lastName: string | null;
    status: string;
    verificationStatus: VerificationStatus | null; // Only for CLIENT role
  }
}

/**
 * Track failed login attempts
 */
async function trackFailedLogin(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      failedLoginAttempts: true,
      lastFailedLogin: true,
      accountLockedUntil: true,
    },
  });

  if (!user) return false;

  const attempts = (user.failedLoginAttempts || 0) + 1;
  const shouldLock = attempts >= config.security.maxLoginAttempts;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: attempts,
      lastFailedLogin: new Date(),
      accountLockedUntil: shouldLock
        ? new Date(Date.now() + config.security.lockoutDuration * 60 * 1000)
        : undefined,
    },
  });

  return shouldLock;
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      accountLockedUntil: null,
      lastLogin: new Date(),
    },
  });
}

/**
 * Check if account is locked
 */
function isAccountLocked(user: {
  accountLockedUntil: Date | null;
  status: string;
}): boolean {
  if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
    return true;
  }

  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    return true;
  }

  return false;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user with password and client data if applicable
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
            firstName: true,
            lastName: true,
            status: true,
            emailVerified: true,
            accountLockedUntil: true,
            failedLoginAttempts: true,
            client: {
              select: {
                verificationStatus: true,
              },
            },
          },
        });

        // User not found
        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if account is locked
        if (isAccountLocked(user)) {
          if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            const minutesLeft = Math.ceil(
              (user.accountLockedUntil.getTime() - Date.now()) / (60 * 1000)
            );
            throw new Error(
              `Account is locked due to too many failed attempts. Please try again in ${minutesLeft} minutes.`
            );
          }
          throw new Error('Account is suspended or inactive. Please contact support.');
        }

        // Verify password
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          // Track failed attempt
          const locked = await trackFailedLogin(credentials.email.toLowerCase());
          if (locked) {
            throw new Error(
              `Account locked due to ${config.security.maxLoginAttempts} failed login attempts. Please try again in ${config.security.lockoutDuration} minutes.`
            );
          }
          const attemptsLeft =
            config.security.maxLoginAttempts - (user.failedLoginAttempts || 0) - 1;
          throw new Error(
            `Invalid email or password. ${attemptsLeft} attempts remaining before account lockout.`
          );
        }

        // Check email verification if enabled
        if (config.features.emailVerification && !user.emailVerified) {
          throw new Error('Please verify your email address before logging in.');
        }

        // Check document verification status for CLIENT users
        // Block login if documents are pending review or rejected
        if (user.role === 'CLIENT' && user.client?.verificationStatus) {
          const blockedStatuses: VerificationStatus[] = [
            'PENDING',
            'UNDER_REVIEW',
            'REJECTED',
            'EXPIRED',
          ];

          if (blockedStatuses.includes(user.client.verificationStatus)) {
            const statusMessages: Record<string, string> = {
              PENDING:
                "Your documents are under verification. You'll receive an email once verified.",
              UNDER_REVIEW:
                "Your documents are under verification. You'll receive an email once verified.",
              REJECTED:
                'Your documents have been rejected. Please check your email for details and resubmit.',
              EXPIRED:
                'Your document verification has expired. Please resubmit your documents.',
            };

            throw new Error(
              statusMessages[user.client.verificationStatus] ||
                "Your documents are under verification. You'll receive an email once verified."
            );
          }
        }

        // Reset failed attempts on successful login
        await resetFailedAttempts(user.id);

        // Create audit log for successful login
        if (config.features.auditLog) {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'LOGIN',
              entityType: 'User',
              entityId: user.id,
              description: 'User logged in successfully',
              ipAddress: '', // Will be populated by API route
              userAgent: '', // Will be populated by API route
            },
          });
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          verificationStatus: user.client?.verificationStatus || null,
        };
      },
    }),
  ],

  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
    verifyRequest: '/verify-request',
    newUser: '/register',
  },

  session: {
    strategy: 'jwt',
    maxAge: config.auth.sessionMaxAge, // 30 minutes
    updateAge: config.auth.sessionUpdateAge, // 5 minutes
  },

  jwt: {
    secret: config.auth.secret,
    maxAge: config.auth.sessionMaxAge,
  },

  callbacks: {
    async jwt({ token, user, trigger }): Promise<JWT> {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.status = user.status;
        token.verificationStatus = user.verificationStatus;
      }

      // Update session - verify user still exists and is active
      if (trigger === 'update' || !user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            status: true,
            client: {
              select: {
                verificationStatus: true,
              },
            },
          },
        });

        if (!dbUser || dbUser.status !== 'ACTIVE') {
          // User deleted or deactivated - invalidate session
          throw new Error('Session invalid');
        }

        // Update token with latest user data
        token.email = dbUser.email;
        token.role = dbUser.role;
        token.firstName = dbUser.firstName;
        token.lastName = dbUser.lastName;
        token.status = dbUser.status;
        token.verificationStatus = dbUser.client?.verificationStatus || null;
      }

      return token;
    },

    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          role: token.role,
          firstName: token.firstName,
          lastName: token.lastName,
          status: token.status,
          verificationStatus: token.verificationStatus,
        };
      }

      return session;
    },
  },

  events: {
    async signOut({ token }) {
      // Create audit log for logout
      if (config.features.auditLog && token.id) {
        await prisma.auditLog.create({
          data: {
            userId: token.id,
            action: 'LOGOUT',
            entityType: 'User',
            entityId: token.id,
            description: 'User logged out',
          },
        });
      }
    },
  },

  // Security settings
  secret: config.auth.secret,

  // When behind a proxy (like Cloudflare Tunnel), we need to trust the host header
  // This is automatically handled when NEXTAUTH_URL is set, but we ensure it here

  // Let NextAuth handle cookie configuration automatically based on NEXTAUTH_URL
  // When NEXTAUTH_URL starts with https://, NextAuth will:
  // 1. Use secure cookies with __Secure- prefix
  // 2. Set httpOnly, sameSite: 'lax', and secure: true
  // Manual cookie config was causing issues with secure cookie prefix mismatch

  // Debug mode - set to true for troubleshooting authentication issues
  debug: process.env.NODE_ENV === 'development',
};
