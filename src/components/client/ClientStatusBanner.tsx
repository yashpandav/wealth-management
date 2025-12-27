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

/**
 * Render an alert banner when a client cannot transact due to a missing relationship manager or unverified KYC.
 *
 * @param hasRM - Whether the client has an assigned relationship manager
 * @param verificationStatus - The client's KYC verification status, or `null` if unknown
 * @param className - Additional CSS class names to apply to the banner container
 * @returns The banner element with appropriate styling and icon when a problem exists, or `null` when no banner is needed
 */
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
        : 'border-blue-500/50 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-200';

  return (
    <Alert className={`${variantClass} ${className}`}>
      <Icon className="h-4 w-4" />
      <AlertDescription>{banner.message}</AlertDescription>
    </Alert>
  );
}