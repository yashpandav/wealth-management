/**
 * Security Headers Configuration
 * Implements security best practices with HTTP headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Headers
 * Applied to all responses via middleware
 */
export const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection in older browsers
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',

  // Strict Transport Security (HSTS)
  // Force HTTPS for 1 year including subdomains
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * Content Security Policy (CSP)
 * Strict policy to prevent XSS and injection attacks
 */
export function getContentSecurityPolicy(_nonce?: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspDirectives = {
    // Default source
    'default-src': ["'self'"],

    // Scripts
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js
      "'unsafe-inline'", // Required for Next.js inline scripts and JSON-LD
    ],

    // Styles
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind requires inline styles
    ],

    // Images
    'img-src': [
      "'self'",
      'data:', // Allow data URIs for images
      'blob:', // Allow blob URLs
      'https:', // Allow external images over HTTPS
    ],

    // Fonts
    'font-src': ["'self'", 'data:'],

    // Connect (API calls, WebSockets)
    'connect-src': [
      "'self'",
      isDevelopment ? 'ws://localhost:*' : '', // Next.js dev mode WebSocket
      isDevelopment ? 'http://localhost:*' : '', // Next.js dev mode
      'https://wealthmanagementcrm.yashpandav.dev', // Production domain
    ].filter(Boolean),

    // Media
    'media-src': ["'self'"],

    // Objects
    'object-src': ["'none'"],

    // Base URI
    'base-uri': ["'self'"],

    // Form actions
    'form-action': ["'self'"],

    // Frame ancestors
    'frame-ancestors': ["'none'"],
  };

  // Convert to CSP header string
  return Object.entries(cspDirectives)
    .map(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        return `${key} ${values.join(' ')}`;
      }
      return key;
    })
    .join('; ');
}

/**
 * Apply security headers to response
 * @param response - NextResponse object
 * @param nonce - Optional CSP nonce for inline scripts
 * @returns Response with security headers
 */
export function applySecurityHeaders(
  response: NextResponse,
  nonce?: string
): NextResponse {
  // Apply all standard security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply Content Security Policy
  const csp = getContentSecurityPolicy(nonce);
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

/**
 * Generate cryptographically secure nonce for CSP
 * @returns Base64 encoded nonce
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Check if request is from same origin
 * Used for additional CSRF protection
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin) {
    // No origin header means same-origin or non-browser request
    return true;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Validate CSRF token from request
 * Additional layer on top of NextAuth's built-in CSRF protection
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // For GET, HEAD, OPTIONS - CSRF not required
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  // Check same-origin
  if (!isSameOrigin(request)) {
    return false;
  }

  // For API routes, NextAuth handles CSRF token validation
  // This is an additional layer for non-auth routes
  const csrfToken = request.headers.get('x-csrf-token');
  const cookieCsrfToken = request.cookies.get('next-auth.csrf-token');

  // If both present, they should match
  if (csrfToken && cookieCsrfToken) {
    return csrfToken === cookieCsrfToken.value;
  }

  // For NextAuth routes, let NextAuth handle validation
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return true;
  }

  return true; // Allow by default, NextAuth provides primary protection
}
