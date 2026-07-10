import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders, generateNonce } from '@/lib/security/headers';
import { globalRateLimiter } from '@/lib/security/rate-limit';

const publicRoutes = ['/', '/login', '/register', '/error', '/forgot-password', '/reset-password', '/verify-email', '/verify-request', '/products', '/user-form', '/upload-documents'];

export async function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const maxRequests = isApiRoute ? 60 : 120;
  
  const rateLimitResult = globalRateLimiter.check(ip, maxRequests, 60000);
  
  if (!rateLimitResult.success) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
      }
    });
  }
  const { pathname } = request.nextUrl;

  const nonce = generateNonce();

  let response: NextResponse;

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))
    || pathname.startsWith('/api/auth/')
    || pathname.startsWith('/api/public/')
    || pathname.startsWith('/api/cron/')
    || pathname === '/api/leads';

  if (isPublicRoute) {
    response = NextResponse.next();
  } else {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      response = NextResponse.redirect(loginUrl);
    } else {
      const userRole = token.role as string;

      if (userRole === 'CLIENT') {
        if (pathname.startsWith('/admin') || pathname.startsWith('/rm') || pathname.startsWith('/docadmin')) {
          response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
        } else {
          response = NextResponse.next();
        }
      } else if (userRole === 'ADMIN') {
        response = NextResponse.next();
      } else if (pathname.startsWith('/admin')) {
        response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
      } else if (pathname.startsWith('/docadmin') && userRole !== 'DOCADMIN') {
        response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
      } else if (pathname.startsWith('/rm') && userRole !== 'RM') {
        response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
      } else if (pathname.startsWith('/client') && userRole !== 'CLIENT') {
        response = NextResponse.redirect(new URL('/error?error=AccessDenied', request.url));
      } else {
        response = NextResponse.next();
      }
    }
  }

  const status = response.status;
  if (status < 300 || status >= 400) {
    response = applySecurityHeaders(response, nonce);
  }

  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|documents/|uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)',
  ],
};
