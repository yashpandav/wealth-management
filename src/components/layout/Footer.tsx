/**
 * Footer Component
 * Bottom footer with links and copyright information
 */

'use client';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-4 md:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold font-optima text-brand-blue">
              EMDEE VENTURES
            </h3>
            <p className="text-sm font-optima text-brand-grey">
              Investment and Holding Company
            </p>
            <p className="mt-2 text-xs italic font-optima text-brand-grey">
              A Better Tomorrow
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold font-optima text-brand-blue">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm font-optima">
              <li>
                <button className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue">
                  About Us
                </button>
              </li>
              <li>
                <button className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue">
                  Help Center
                </button>
              </li>
              <li>
                <button className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue">
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold font-optima text-brand-blue">
              Legal
            </h3>
            <ul className="space-y-2 text-sm font-optima">
              <li>
                <button className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue">
                  Terms of Service
                </button>
              </li>
              <li>
                <button className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue">
                  Security
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-sm font-optima text-brand-grey">
            &copy; {currentYear} EMDEE VENTURES. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
