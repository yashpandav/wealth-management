/**
 * RBAC Page Guards
 * Higher-order components and utilities for page-level authentication and authorization
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useCurrentUser, useHasRole, useHasAnyRole } from './rbac.hooks';
import { LoadingAuth, UnauthorizedAccess } from './rbac.components';

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * RequireAuth Component
 * Ensures user is authenticated, redirects to login if not
 */
export function RequireAuth({ children, redirectTo = '/login' }: RequireAuthProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Preserve current path as callback URL
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`${redirectTo}?callbackUrl=${callbackUrl}` as any);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  if (isLoading) {
    return <LoadingAuth />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

interface RequireRoleProps {
  children: ReactNode;
  role?: UserRole;
  roles?: UserRole[];
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RequireRole Component
 * Ensures user has required role(s), shows fallback or redirects if not
 */
export function RequireRole({
  children,
  role,
  roles,
  fallback,
  redirectTo,
}: RequireRoleProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCurrentUser();
  const hasRole = useHasRole(role || 'ADMIN'); // Provide default value
  const hasAnyRole = useHasAnyRole(roles || []); // Provide default value

  const hasAccess = role ? hasRole : hasAnyRole;

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess && redirectTo) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(redirectTo as any);
    }
  }, [isAuthenticated, isLoading, hasAccess, redirectTo, router]);

  if (isLoading) {
    return <LoadingAuth />;
  }

  if (!isAuthenticated) {
    return null; // Will be handled by RequireAuth wrapper
  }

  if (!hasAccess) {
    if (redirectTo) {
      return null; // Will redirect via useEffect
    }
    return <>{fallback || <UnauthorizedAccess />}</>;
  }

  return <>{children}</>;
}

interface RequireAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RequireAdmin Component
 * Ensures user is an admin
 */
export function RequireAdmin({ children, fallback, redirectTo = '/error?error=AccessDenied' }: RequireAdminProps) {
  return (
    <RequireAuth>
      <RequireRole role={UserRole.ADMIN} fallback={fallback} redirectTo={redirectTo}>
        {children}
      </RequireRole>
    </RequireAuth>
  );
}

interface RequireRMProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RequireRM Component
 * Ensures user is a Relationship Manager
 */
export function RequireRM({ children, fallback, redirectTo = '/error?error=AccessDenied' }: RequireRMProps) {
  return (
    <RequireAuth>
      <RequireRole role={UserRole.RM} fallback={fallback} redirectTo={redirectTo}>
        {children}
      </RequireRole>
    </RequireAuth>
  );
}

interface RequireClientProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RequireClient Component
 * Ensures user is a client
 */
export function RequireClient({ children, fallback, redirectTo = '/error?error=AccessDenied' }: RequireClientProps) {
  return (
    <RequireAuth>
      <RequireRole role={UserRole.CLIENT} fallback={fallback} redirectTo={redirectTo}>
        {children}
      </RequireRole>
    </RequireAuth>
  );
}

interface RequireManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RequireManagement Component
 * Ensures user is either Admin or RM
 */
export function RequireManagement({ children, fallback, redirectTo = '/error?error=AccessDenied' }: RequireManagementProps) {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.ADMIN, UserRole.RM]} fallback={fallback} redirectTo={redirectTo}>
        {children}
      </RequireRole>
    </RequireAuth>
  );
}

/**
 * withAuth HOC
 * Wraps a page component with authentication requirement
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
  }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RequireAuth redirectTo={options?.redirectTo}>
        <Component {...props} />
      </RequireAuth>
    );
  };
}

/**
 * withRole HOC
 * Wraps a page component with role requirement
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    role?: UserRole;
    roles?: UserRole[];
    redirectTo?: string;
    fallback?: ReactNode;
  }
) {
  return function RoleProtectedComponent(props: P) {
    return (
      <RequireAuth>
        <RequireRole
          role={options.role}
          roles={options.roles}
          redirectTo={options.redirectTo}
          fallback={options.fallback}
        >
          <Component {...props} />
        </RequireRole>
      </RequireAuth>
    );
  };
}

/**
 * withAdmin HOC
 * Wraps a page component requiring admin access
 */
export function withAdmin<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: ReactNode;
  }
) {
  return withRole(Component, {
    role: UserRole.ADMIN,
    redirectTo: options?.redirectTo,
    fallback: options?.fallback,
  });
}

/**
 * withRM HOC
 * Wraps a page component requiring RM access
 */
export function withRM<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: ReactNode;
  }
) {
  return withRole(Component, {
    role: UserRole.RM,
    redirectTo: options?.redirectTo,
    fallback: options?.fallback,
  });
}

/**
 * withClient HOC
 * Wraps a page component requiring client access
 */
export function withClient<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: ReactNode;
  }
) {
  return withRole(Component, {
    role: UserRole.CLIENT,
    redirectTo: options?.redirectTo,
    fallback: options?.fallback,
  });
}

/**
 * withManagement HOC
 * Wraps a page component requiring admin or RM access
 */
export function withManagement<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: ReactNode;
  }
) {
  return withRole(Component, {
    roles: [UserRole.ADMIN, UserRole.RM],
    redirectTo: options?.redirectTo,
    fallback: options?.fallback,
  });
}
