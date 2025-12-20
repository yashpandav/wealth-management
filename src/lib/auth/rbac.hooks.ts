/**
 * Role-Based Access Control (RBAC) React Hooks
 * Client-side utilities for role checking and permission management
 */

'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

/**
 * Get current user from session
 * @returns Current user object or null if not authenticated
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

/**
 * Get current user's role
 * @returns User role or null if not authenticated
 */
export function useRole(): UserRole | null {
  const { user } = useCurrentUser();
  return (user?.role as UserRole) || null;
}

/**
 * Check if user has a specific role
 * @param role - Role to check
 * @returns Boolean indicating if user has the role
 */
export function useHasRole(role: UserRole): boolean {
  const userRole = useRole();
  return userRole === role;
}

/**
 * Check if user has any of the specified roles
 * @param roles - Array of roles to check
 * @returns Boolean indicating if user has any of the roles
 */
export function useHasAnyRole(roles: UserRole[]): boolean {
  const userRole = useRole();
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Check if user is an admin
 * @returns Boolean indicating if user is an admin
 */
export function useIsAdmin(): boolean {
  return useHasRole(UserRole.ADMIN);
}

/**
 * Check if user is a Relationship Manager
 * @returns Boolean indicating if user is an RM
 */
export function useIsRM(): boolean {
  return useHasRole(UserRole.RM);
}

/**
 * Check if user is a client
 * @returns Boolean indicating if user is a client
 */
export function useIsClient(): boolean {
  return useHasRole(UserRole.CLIENT);
}

/**
 * Check if user is a Document Admin
 * @returns Boolean indicating if user is a DOCADMIN
 */
export function useIsDocAdmin(): boolean {
  return useHasRole(UserRole.DOCADMIN);
}

/**
 * Check if user is either Admin or RM (management roles)
 * @returns Boolean indicating if user has management access
 */
export function useIsManagement(): boolean {
  return useHasAnyRole([UserRole.ADMIN, UserRole.RM]);
}

/**
 * Check if user is any admin type (ADMIN or DOCADMIN)
 * @returns Boolean indicating if user has any admin access
 */
export function useIsAnyAdmin(): boolean {
  return useHasAnyRole([UserRole.ADMIN, UserRole.DOCADMIN]);
}

/**
 * Role hierarchy: Admin > DOCADMIN > RM > Client
 * Check if user's role is at least the specified level
 * @param minRole - Minimum required role level
 * @returns Boolean indicating if user meets minimum role requirement
 */
export function useHasMinimumRole(minRole: UserRole): boolean {
  const userRole = useRole();

  if (!userRole) return false;

  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 4,
    [UserRole.DOCADMIN]: 3,
    [UserRole.RM]: 2,
    [UserRole.CLIENT]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[minRole];
}

/**
 * Permission checking based on role
 * Define granular permissions for different actions
 */
type Permission =
  | 'view_instruments'
  | 'create_instruments'
  | 'edit_instruments'
  | 'delete_instruments'
  | 'view_clients'
  | 'manage_clients'
  | 'assign_rm'
  | 'approve_purchases'
  | 'approve_withdrawals'
  | 'view_analytics'
  | 'view_audit_logs'
  | 'manage_users'
  | 'view_portfolio'
  | 'submit_requests'
  | 'view_rm_dashboard'
  | 'view_admin_dashboard'
  | 'view_documents'
  | 'verify_documents'
  | 'reject_documents'
  | 'view_docadmin_dashboard'
  | 'manage_verification_status';

/**
 * Permission mapping for each role
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    'view_instruments',
    'create_instruments',
    'edit_instruments',
    'delete_instruments',
    'view_clients',
    'manage_clients',
    'assign_rm',
    'approve_purchases',
    'approve_withdrawals',
    'view_analytics',
    'view_audit_logs',
    'manage_users',
    'view_admin_dashboard',
    'view_documents',
    'verify_documents',
    'reject_documents',
    'manage_verification_status',
  ],
  [UserRole.DOCADMIN]: [
    'view_clients',
    'view_documents',
    'verify_documents',
    'reject_documents',
    'view_docadmin_dashboard',
    'manage_verification_status',
    'view_audit_logs',
  ],
  [UserRole.RM]: [
    'view_instruments',
    'view_clients',
    'manage_clients',
    'approve_purchases',
    'view_analytics',
    'view_rm_dashboard',
    'view_documents',
  ],
  [UserRole.CLIENT]: [
    'view_instruments',
    'view_portfolio',
    'submit_requests',
  ],
};

/**
 * Check if user has a specific permission
 * @param permission - Permission to check
 * @returns Boolean indicating if user has the permission
 */
export function useHasPermission(permission: Permission): boolean {
  const userRole = useRole();

  if (!userRole) return false;

  return rolePermissions[userRole].includes(permission);
}

/**
 * Check if user has all of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns Boolean indicating if user has all permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const userRole = useRole();

  if (!userRole) return false;

  const userPermissions = rolePermissions[userRole];
  return permissions.every((permission) => userPermissions.includes(permission));
}

/**
 * Check if user has any of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns Boolean indicating if user has any of the permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const userRole = useRole();

  if (!userRole) return false;

  const userPermissions = rolePermissions[userRole];
  return permissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Get all permissions for current user
 * @returns Array of permissions or empty array if not authenticated
 */
export function useUserPermissions(): Permission[] {
  const userRole = useRole();

  if (!userRole) return [];

  return rolePermissions[userRole];
}

/**
 * Authorization state hook
 * Combines authentication and authorization status
 */
export function useAuthorization() {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const role = useRole();
  const permissions = useUserPermissions();

  return {
    user,
    role,
    permissions,
    isLoading,
    isAuthenticated,
    isAdmin: role === UserRole.ADMIN,
    isDocAdmin: role === UserRole.DOCADMIN,
    isRM: role === UserRole.RM,
    isClient: role === UserRole.CLIENT,
    isManagement: role === UserRole.ADMIN || role === UserRole.RM,
    isAnyAdmin: role === UserRole.ADMIN || role === UserRole.DOCADMIN,
  };
}

/**
 * Export permission type for use in components
 */
export type { Permission };
