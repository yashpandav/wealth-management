/**
 * SkipLink Component
 * Allows keyboard and screen reader users to skip navigation and go directly to main content
 * WCAG 2.1 AA Compliance - Bypass Blocks (2.4.1)
 */

'use client';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
