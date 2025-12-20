/**
 * Server-side Session Utilities
 * Helper functions for accessing session in Server Components and API routes
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth.config';
import { UserRole } from '@prisma/client';

/**
 * Get current session (server-side only)
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Get current user (server-side only)
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user;
}

/**
 * Check if user is authenticated (server-side only)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session?.user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Unauthorized - Authentication required');
  }
  return session.user;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Require specific role - throws if user doesn't have role
 */
export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error(`Forbidden - ${role} role required`);
  }
  return user;
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden - One of [${roles.join(', ')}] roles required`);
  }
  return user;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return await hasRole('ADMIN');
}

/**
 * Check if user is RM
 */
export async function isRM(): Promise<boolean> {
  return await hasRole('RM');
}

/**
 * Check if user is client
 */
export async function isClient(): Promise<boolean> {
  return await hasRole('CLIENT');
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return await requireRole('ADMIN');
}

/**
 * Require RM role
 */
export async function requireRM() {
  return await requireRole('RM');
}

/**
 * Require client role
 */
export async function requireClient() {
  return await requireRole('CLIENT');
}
