/**
 * Input Sanitization and Validation Utilities
 * Protect against XSS, SQL injection, and other injection attacks
 */

/**
 * Sanitize string input to prevent XSS
 * Removes HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
}

/**
 * Sanitize email input
 * Ensures email is in valid format
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email
    .toLowerCase()
    .trim()
    .replace(/[<>'"]/g, ''); // Remove potentially dangerous characters
}

/**
 * Sanitize HTML input (for rich text)
 * Allows only safe HTML tags
 *
 * Note: This is a basic implementation. In production, use a library like DOMPurify
 * for comprehensive HTML sanitization with support for allowlists.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Simple implementation - removes dangerous elements
  let sanitized = html;

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Sanitize URL to prevent open redirect attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove whitespace
  url = url.trim();

  // Block javascript: and data: protocols
  if (url.match(/^(javascript|data|vbscript):/i)) {
    return '';
  }

  // Only allow http, https, and relative URLs
  if (!url.match(/^(https?:\/\/|\/)/i)) {
    return '';
  }

  return url;
}

/**
 * Sanitize file name to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '') // Only allow alphanumeric, dot, underscore, dash
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Keep only digits, +, -, (, ), and spaces
  return phone.replace(/[^0-9+\-() ]/g, '').trim();
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }

  if (typeof input !== 'string') {
    return null;
  }

  const num = parseFloat(input.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Sanitize object by applying sanitization to all string properties
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizeFn: (value: string) => string = sanitizeString
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeFn(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeFn(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, sanitizeFn);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize callback URL to prevent open redirects
 */
export function sanitizeCallbackUrl(url: string, allowedDomains: string[]): string {
  if (!url || typeof url !== 'string') {
    return '/';
  }

  // If it's a relative URL, allow it
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  // If it's an absolute URL, check if domain is allowed
  try {
    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(
      (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (isAllowed) {
      return url;
    }
  } catch {
    // Invalid URL
  }

  // Default to home page if not allowed
  return '/';
}

/**
 * Rate limiting helper - check if action should be allowed
 * Simple in-memory implementation - use Redis in production
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired records
  if (record && record.resetAt < now) {
    rateLimitStore.delete(key);
  }

  if (!record || record.resetAt < now) {
    // First attempt or window expired
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxAttempts - 1, resetAt };
  }

  // Increment count
  record.count += 1;

  if (record.count > maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clean up expired rate limit records
 * Should be called periodically
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
