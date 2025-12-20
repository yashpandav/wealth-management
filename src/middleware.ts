/**
 * Next.js Middleware
 * Route protection, authentication checks, and security headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders, generateNonce } from '@/lib/security/headers';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/error', '/forgot-password', '/reset-password', '/verify-email', '/verify-request', '/instruments'];

// Routes that clients with NOT_SUBMITTED status can access
const documentUploadRoutes = ['/upload-documents', '/client/documents', '/client/verification'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate nonce for CSP
  const nonce = generateNonce();

  // Create response
  let response: NextResponse;

  // Check if route requires authentication
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))
    || pathname.startsWith('/api/auth/')
    || pathname.startsWith('/api/public/');

  if (isPublicRoute) {
    response = NextResponse.next();
  } else {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // No token - redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      response = NextResponse.redirect(loginUrl);
    } else {
      // Check role-based access
      const userRole = token.role as string;

      // Admin has access to everything
      if (userRole === 'ADMIN') {
        response = NextResponse.next();
      } else if (pathname.startsWith('/admin')) {
        // Only admins can access admin routes
        response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
      } else if (pathname.startsWith('/docadmin') && userRole !== 'DOCADMIN') {
        // Only DOCADMIN can access document admin routes
        response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
      } else if (pathname.startsWith('/rm') && userRole !== 'RM') {
        response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
      } else if (pathname.startsWith('/client')) {
        // Client routes require CLIENT role and verified status
        if (userRole !== 'CLIENT') {
          response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
        } else {
          // Check verification status for clients
          const verificationStatus = token.verificationStatus as string | undefined;
          if (verificationStatus === 'NOT_SUBMITTED' || verificationStatus === 'REJECTED') {
            // Redirect to upload documents page if not submitted or rejected
            if (pathname.startsWith('/client/verification') || pathname === '/client/documents') {
              response = NextResponse.next();
            } else {
              response = NextResponse.redirect(new URL('/upload-documents', request.url));
            }
          } else if (verificationStatus === 'PENDING' || verificationStatus === 'UNDER_REVIEW') {
            // Allow access to verification status page only while pending
            if (pathname.startsWith('/client/verification') || pathname === '/client/documents') {
              response = NextResponse.next();
            } else {
              response = NextResponse.redirect(new URL('/upload-documents', request.url));
            }
          } else {
            response = NextResponse.next();
          }
        }
      } else {
        response = NextResponse.next();
      }
    }
  }

  // Apply security headers only to non-redirect responses
  // Redirects (3xx) should not have CSP headers as they can interfere with navigation
  const status = response.status;
  if (status < 300 || status >= 400) {
    response = applySecurityHeaders(response, nonce);
  }

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
