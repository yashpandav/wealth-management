# Security Documentation

## Overview

This document outlines the security measures implemented in the Wealth Management CRM platform. As a financial application handling sensitive client data, security is paramount.

## Authentication & Authorization

### NextAuth.js Configuration

- **Provider**: Credentials (email/password)
- **Session Strategy**: JWT with secure cookies
- **Session Duration**: 30 minutes inactivity timeout
- **Session Refresh**: 5-minute refresh window for active users

### Password Security

- **Hashing Algorithm**: bcrypt with 12 rounds
- **Complexity Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### Account Lockout

- **Max Attempts**: 5 failed login attempts
- **Lockout Duration**: 30 minutes
- **Unlock Methods**:
  - Automatic after lockout period
  - Admin manual unlock (future feature)
  - Successful password reset

### Email Verification

- **Token Generation**: 32-byte cryptographically secure random hex
- **Token Expiry**: 24 hours
- **One-time Use**: Tokens marked as used after verification
- **Development Mode**: Can be disabled via `ENABLE_EMAIL_VERIFICATION=false`

### Password Reset

- **Token Generation**: 32-byte cryptographically secure random hex
- **Token Expiry**: 1 hour
- **One-time Use**: Tokens marked as used after reset
- **Email Enumeration Protection**: Same response regardless of email existence
- **Lockout Reset**: Account lockout cleared on successful password reset

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
ADMIN (Level 3) - Full system access
  ↓
RM (Level 2) - Client management and approvals
  ↓
CLIENT (Level 1) - Personal portfolio access
```

### Permissions Matrix

| Permission | ADMIN | RM | CLIENT |
|------------|-------|-----|--------|
| View Instruments | ✓ | ✓ | ✓ |
| Create Instruments | ✓ | ✗ | ✗ |
| Edit Instruments | ✓ | ✗ | ✗ |
| Delete Instruments | ✓ | ✗ | ✗ |
| View Clients | ✓ | ✓ | ✗ |
| Manage Clients | ✓ | ✓ | ✗ |
| Assign RM | ✓ | ✗ | ✗ |
| Approve Purchases | ✓ | ✓ | ✗ |
| Approve Withdrawals | ✓ | ✗ | ✗ |
| View Analytics | ✓ | ✓ | ✗ |
| View Audit Logs | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| View Portfolio | ✗ | ✗ | ✓ |
| Submit Requests | ✗ | ✗ | ✓ |

## CSRF Protection

### Built-in Protection

- **NextAuth.js**: Automatic CSRF token generation and validation
- **Same-Origin Policy**: Verification via Origin and Host headers
- **Token Validation**: Custom CSRF token validation for non-auth routes

### Usage in Forms

```typescript
// NextAuth automatically handles CSRF tokens
// No additional action required for auth routes
```

## Security Headers

### Implemented Headers

1. **X-Frame-Options**: `DENY`
   - Prevents clickjacking attacks

2. **X-Content-Type-Options**: `nosniff`
   - Prevents MIME type sniffing

3. **X-XSS-Protection**: `1; mode=block`
   - Enables XSS protection in older browsers

4. **Referrer-Policy**: `strict-origin-when-cross-origin`
   - Controls referrer information leakage

5. **Permissions-Policy**: Restricts browser features
   - Disabled: camera, microphone, geolocation, interest-cohort

6. **Strict-Transport-Security**: `max-age=31536000; includeSubDomains; preload`
   - Forces HTTPS for 1 year including subdomains

7. **Content-Security-Policy**: Comprehensive CSP policy
   - Prevents XSS and injection attacks
   - Nonce-based script execution
   - Strict source whitelisting

### Content Security Policy (CSP)

#### Production Policy

```
default-src 'self';
script-src 'self' 'nonce-{random}';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self';
media-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

#### Development Policy

Similar to production but includes:
- `'unsafe-eval'` for Next.js dev mode
- `ws://localhost:*` for WebSocket connections
- `http://localhost:*` for dev server

## Input Sanitization

### Available Functions

```typescript
// String sanitization
sanitizeString(input: string): string

// Email sanitization
sanitizeEmail(email: string): string

// HTML sanitization (for rich text)
sanitizeHtml(html: string): string

// URL sanitization (prevent open redirects)
sanitizeUrl(url: string): string

// File name sanitization (prevent directory traversal)
sanitizeFileName(fileName: string): string

// Phone number sanitization
sanitizePhoneNumber(phone: string): string

// Numeric input sanitization
sanitizeNumber(input: string | number): number | null

// Object sanitization (recursive)
sanitizeObject<T>(obj: T): T

// Callback URL validation
sanitizeCallbackUrl(url: string, allowedDomains: string[]): string
```

### Usage Example

```typescript
import { sanitizeString, sanitizeEmail } from '@/lib/security';

// User input
const userInput = "<script>alert('XSS')</script>";
const clean = sanitizeString(userInput);
// Result: "scriptalert('XSS')/script"

// Email input
const email = "  USER@EXAMPLE.COM  ";
const cleanEmail = sanitizeEmail(email);
// Result: "user@example.com"
```

## Rate Limiting

### Implementation

Simple in-memory rate limiting (Redis recommended for production):

```typescript
import { checkRateLimit } from '@/lib/security';

// Check if action is allowed
const { allowed, remaining, resetAt } = checkRateLimit(
  `login:${email}`,
  5, // max attempts
  15 * 60 * 1000 // 15 minutes
);

if (!allowed) {
  return { error: 'Too many attempts. Try again later.' };
}
```

### Cleanup

Automatic cleanup runs every 5 minutes to remove expired entries.

## Audit Logging

### What We Log

1. **Authentication Events**
   - Login attempts (success/failure)
   - Logout events
   - Password changes
   - Password reset requests
   - Account lockouts
   - Email verifications

2. **User Actions** (Logged via 37 action types)
   - READ, CREATE, UPDATE, DELETE operations
   - Role changes
   - RM assignments
   - Transaction approvals/rejections

3. **Security Events**
   - Failed authentication attempts
   - Access denied events
   - Suspicious activities

### Audit Log Fields

```typescript
{
  userId: string,
  action: AuditAction, // 37 action types
  entityType: string,
  entityId: string,
  description: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: object,
  createdAt: DateTime
}
```

### Retention

- **Default**: All audit logs retained indefinitely
- **Compliance**: 7-year retention for financial regulations
- **Implementation**: Database cleanup jobs can be configured

## Sensitive Data Protection

### Encryption at Rest

- **Passwords**: bcrypt hashed (never stored in plain text)
- **Verification Tokens**: Stored as random hex strings
- **Session Tokens**: JWT signed with NEXTAUTH_SECRET

### Encryption in Transit

- **TLS 1.3**: Required for all production traffic
- **HSTS**: Enforced via security headers
- **Secure Cookies**: `httpOnly`, `secure`, `sameSite` attributes

### PII Protection

- **Logging**: Never log passwords, tokens, or sensitive PII
- **Masking**: Sensitive data masked in error messages
- **Field-level**: Consider field-level encryption for highly sensitive data

## API Security

### Validation

- **Server-side**: All inputs validated with Zod schemas
- **Client-side**: Form validation for UX
- **Double Validation**: Never trust client-side validation alone

### Error Handling

- **Generic Errors**: Don't reveal internal details
- **Logging**: Log full errors server-side for debugging
- **User Messages**: Show user-friendly error messages

### Example

```typescript
try {
  // Operation
} catch (error) {
  console.error('Detailed error:', error); // Server-side only
  return NextResponse.json(
    { success: false, error: 'An error occurred. Please try again.' },
    { status: 500 }
  );
}
```

## Deployment Checklist

### Environment Variables

- [ ] `NEXTAUTH_SECRET` - Strong random secret (min 32 characters)
- [ ] `DATABASE_URL` - Secure database connection string
- [ ] `SMTP_*` - Secure email server credentials
- [ ] All secrets stored in secure vault (not in code)

### Database

- [ ] SSL/TLS enabled for database connections
- [ ] Database user has minimum required privileges
- [ ] Backups configured with encryption
- [ ] Connection pooling properly configured

### Application

- [ ] `NODE_ENV=production` set
- [ ] HTTPS enforced (no HTTP)
- [ ] Security headers verified (use securityheaders.com)
- [ ] CSP tested and working
- [ ] Error handling doesn't leak sensitive info
- [ ] Rate limiting in place for sensitive endpoints

### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] APM enabled (OpenTelemetry)
- [ ] Audit logs being written
- [ ] Failed login attempts monitored
- [ ] Suspicious activity alerts configured

## Incident Response

### Security Incident

1. **Identify**: Detect the security incident
2. **Contain**: Isolate affected systems
3. **Investigate**: Analyze audit logs and system logs
4. **Remediate**: Fix vulnerability and restore service
5. **Learn**: Document incident and update procedures

### Data Breach

1. **Immediate**: Disconnect affected systems
2. **Assess**: Determine scope of breach
3. **Notify**: Inform affected users and authorities (GDPR requirements)
4. **Remediate**: Fix vulnerabilities
5. **Document**: Complete incident report

## Security Best Practices

### For Developers

1. **Never** commit secrets to git
2. **Always** validate input server-side
3. **Always** use parameterized queries (Prisma handles this)
4. **Never** log sensitive data
5. **Always** use HTTPS in production
6. **Never** trust client-side data
7. **Always** handle errors gracefully
8. **Use** security linters and scanners

### For Deployment

1. Keep dependencies updated
2. Run security audits: `pnpm audit`
3. Use dependency scanning: Snyk or Dependabot
4. Monitor security advisories
5. Regular penetration testing
6. Security code reviews

## Security Contacts

### Reporting Vulnerabilities

If you discover a security vulnerability, please email:
- **Security Team**: security@wealthcrm.com
- **Emergency**: Call your security point of contact

### Bug Bounty

- Consider implementing a bug bounty program for security researchers

## Compliance

### GDPR (General Data Protection Regulation)

- Right to access: Users can export their data
- Right to erasure: Users can delete their accounts
- Data minimization: Only collect necessary data
- Consent: Explicit consent for data processing

### Financial Regulations

- Audit trail: 7-year retention
- Data encryption: At rest and in transit
- Access controls: Role-based access
- Compliance monitoring: Regular audits

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated**: 2025-10-25
**Version**: 1.0
**Status**: Production Ready
