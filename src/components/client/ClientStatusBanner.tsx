'use client';

/**
 * Client Status Banner Component
 * Displays warning/info banners when client cannot transact due to:
 * - No RM assigned
 * - KYC not verified
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info, Upload } from 'lucide-react';
import { VerificationStatus } from '@prisma/client';
import { getClientStatusBanner } from '@/lib/utils/client-utils';
import Link from 'next/link';

interface ClientStatusBannerProps {
  hasRM: boolean;
  verificationStatus: VerificationStatus | null;
  className?: string;
}

export function ClientStatusBanner({
  hasRM,
  verificationStatus,
  className = '',
}: ClientStatusBannerProps) {
  const banner = getClientStatusBanner(hasRM, verificationStatus);

  // Don't show banner if client can transact
  if (!banner) {
    return null;
  }

  // Determine icon and variant based on banner type
  const Icon =
    banner.type === 'error'
      ? AlertCircle
      : banner.type === 'warning'
        ? AlertTriangle
        : Info;

  const variantClass =
    banner.type === 'error'
      ? 'border-red-500/50 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950 dark:text-red-200'
      : banner.type === 'warning'
        ? 'border-orange-500/50 bg-orange-50 text-orange-900 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-200'
        : 'border-orange-500/50 bg-orange-50 text-orange-900 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-200';

  const showUploadLink = verificationStatus === 'NOT_SUBMITTED' || verificationStatus === 'REJECTED' || verificationStatus === 'EXPIRED';

  // Get document status text
  const getDocumentStatus = () => {
    if (verificationStatus === 'NOT_SUBMITTED') {
      return 'Identity Proof (not verified)';
    } else if (verificationStatus === 'REJECTED') {
      return 'Identity Proof (rejected)';
    } else if (verificationStatus === 'EXPIRED') {
      return 'Identity Proof (expired)';
    } else if (verificationStatus === 'PENDING' || verificationStatus === 'UNDER_REVIEW') {
      return 'Identity Proof (under review)';
    }
    return null;
  };

  const documentStatus = getDocumentStatus();

  return (
    <Alert className={`${variantClass} ${className}`}>
      <Icon className="h-5 w-5" />
      <div className="flex flex-col w-full">
        <AlertTitle className="font-optima text-base font-semibold mb-2">
          KYC Verification Required
        </AlertTitle>
        <AlertDescription className="font-optima text-comments mb-3">
          Complete your KYC verification to submit plan requests and begin investing.
        </AlertDescription>

        {documentStatus && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-current"></div>
              <span className="font-optima text-sm">{documentStatus}</span>
            </div>
          </div>
        )}

        {showUploadLink && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/client/documents"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-6 py-2.5 font-optima text-comments font-semibold text-white shadow-md transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              <Upload className="h-4 w-4" />
              Upload Documents
            </Link>
          </div>
        )}
      </div>
    </Alert>
  );
}
