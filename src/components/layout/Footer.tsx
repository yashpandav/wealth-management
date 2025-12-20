/**
 * Footer Component
 * Bottom footer with links and copyright information
 */

'use client';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              WealthCRM
            </h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade wealth management platform for financial
              institutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                  About Us
                </span>
              </li>
              <li>
                <span className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                  Help Center
                </span>
              </li>
              <li>
                <span className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                  Contact Support
                </span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                  Security
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} WealthCRM. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
