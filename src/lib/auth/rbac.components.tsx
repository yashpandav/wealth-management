/**
 * Role-Based Access Control (RBAC) Components
 * HOC and wrapper components for conditional rendering based on roles and permissions
 */

'use client';

import { ReactNode } from 'react';
import { UserRole } from '@prisma/client';
import {
  useHasRole,
  useHasAnyRole,
  useHasPermission,
  useHasAllPermissions,
  useHasAnyPermission,
  useIsAdmin,
  useIsRM,
  useIsClient,
  useIsManagement,
  useCurrentUser,
  type Permission,
} from './rbac.hooks';

interface RoleGuardProps {
  children: ReactNode;
  role?: UserRole;
  roles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * RoleGuard Component
 * Conditionally render children based on user role
 */
export function RoleGuard({
  children,
  role,
  roles,
  fallback = null,
}: RoleGuardProps) {
  const hasRole = useHasRole(role || 'ADMIN'); // Provide default value
  const hasAnyRole = useHasAnyRole(roles || []); // Provide default value

  const hasAccess = role ? hasRole : hasAnyRole;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * PermissionGuard Component
 * Conditionally render children based on user permissions
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  // Always call hooks - they must be called in the same order every render
  const hasSinglePermission = useHasPermission(permission || 'view_instruments');
  const hasAllPermissions = useHasAllPermissions(permissions || []);
  const hasAnyPermission = useHasAnyPermission(permissions || []);

  const hasAccess = permission
    ? hasSinglePermission
    : requireAll
      ? hasAllPermissions
      : hasAnyPermission;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * AuthGuard Component
 * Render children only if user is authenticated
 */
export function AuthGuard({ children, fallback = null, loadingFallback = null }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useCurrentUser();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * AdminOnly Component
 * Render children only for admin users
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * RMOnly Component
 * Render children only for RM users
 */
export function RMOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isRM = useIsRM();

  if (!isRM) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * ClientOnly Component
 * Render children only for client users
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isClient = useIsClient();

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * ManagementOnly Component
 * Render children only for admin or RM users
 */
export function ManagementOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isManagement = useIsManagement();

  if (!isManagement) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * UnauthorizedAccess Component
 * Display unauthorized access message
 */
export function UnauthorizedAccess({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="text-sm text-gray-600">
          {message || 'You do not have permission to access this resource.'}
        </p>
      </div>
    </div>
  );
}

/**
 * LoadingAuth Component
 * Display loading state while checking authentication
 */
export function LoadingAuth() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        <p className="text-sm text-gray-600">Verifying access...</p>
      </div>
    </div>
  );
}
