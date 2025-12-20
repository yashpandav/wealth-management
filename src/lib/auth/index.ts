/**
 * Authentication utilities
 * NextAuth configuration, session management, auth helpers, RBAC
 */

// NextAuth configuration
export { authOptions } from './auth.config';

// Session provider (client component)
export { SessionProvider } from './providers';

// Server-side session utilities
export {
  getCurrentSession,
  getCurrentUser,
  isAuthenticated,
  requireAuth,
  hasRole,
  hasAnyRole,
  requireRole,
  requireAnyRole,
  isAdmin,
  isRM,
  isClient,
  requireAdmin,
  requireRM,
  requireClient,
} from './session';

// Client-side RBAC hooks
export {
  useCurrentUser,
  useRole,
  useHasRole,
  useHasAnyRole,
  useIsAdmin,
  useIsRM,
  useIsClient,
  useIsManagement,
  useHasMinimumRole,
  useHasPermission,
  useHasAllPermissions,
  useHasAnyPermission,
  useUserPermissions,
  useAuthorization,
  type Permission,
} from './rbac.hooks';

// RBAC components
export {
  RoleGuard,
  PermissionGuard,
  AuthGuard,
  AdminOnly,
  RMOnly,
  ClientOnly,
  ManagementOnly,
  UnauthorizedAccess,
  LoadingAuth,
} from './rbac.components';

// Page-level guards and HOCs
export {
  RequireAuth,
  RequireRole,
  RequireAdmin,
  RequireRM,
  RequireClient,
  RequireManagement,
  withAuth,
  withRole,
  withAdmin,
  withRM,
  withClient,
  withManagement,
} from './rbac.page-guards';
