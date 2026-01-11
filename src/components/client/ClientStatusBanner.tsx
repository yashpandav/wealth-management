'use client';

/**
 * Client Status Banner Component
 * Displays warning/info banners when client cannot transact due to:
 * - No RM assigned
 * - KYC not verified
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { VerificationStatus } from '@prisma/client';
import { getClientStatusBanner } from '@/lib/utils/client-utils';

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
        ? 'border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:border-yellow-500 dark:bg-yellow-950 dark:text-yellow-200'
        : 'border-brand-blue/50 bg-brand-blue/10 text-blue-900 dark:border-brand-blue dark:bg-blue-950 dark:text-blue-200';

  const showUploadLink = verificationStatus === 'NOT_SUBMITTED' || verificationStatus === 'REJECTED' || verificationStatus === 'EXPIRED';

  return (
    <Alert className={`${variantClass} ${className}`}>
      <Icon className="h-4 w-4" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
        <AlertDescription>{banner.message}</AlertDescription>
        {showUploadLink && (
          <a
            href="/upload-documents"
            className="mt-2 sm:mt-0 sm:ml-4 text-sm font-semibold underline hover:text-brand-blue/80 whitespace-nowrap"
          >
            Upload Documents &rarr;
          </a>
        )}
      </div>
    </Alert>
  );
}
