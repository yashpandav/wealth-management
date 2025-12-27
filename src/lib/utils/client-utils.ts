/**
 * Client Utilities
 * Helper functions for client status and eligibility checks
 *
 * Canonical Onboarding States:
 * 1. Registered, No KYC Uploaded    (verificationStatus = NOT_SUBMITTED, assignedRMId = null)
 * 2. KYC Uploaded, In Progress      (verificationStatus = PENDING/UNDER_REVIEW, assignedRMId = null)
 * 3. KYC Verified, RM Pending       (verificationStatus = VERIFIED, assignedRMId = null)
 * 4. Active Client                  (verificationStatus = VERIFIED, assignedRMId != null)
 */

import { VerificationStatus } from '@prisma/client';

/**
 * Onboarding state enum
 */
export type OnboardingState =
  | 'NO_KYC'           // State 1: Registered, no KYC uploaded
  | 'KYC_IN_PROGRESS'  // State 2: KYC uploaded, verification in progress
  | 'KYC_REJECTED'     // State 2b: KYC rejected, needs resubmission
  | 'RM_PENDING'       // State 3: KYC verified, RM assignment pending
  | 'ACTIVE';          // State 4: Fully active client

/**
 * Result of onboarding state check
 */
export interface OnboardingStatus {
  state: OnboardingState;
  canTransact: boolean;
  showKycUpload: boolean;
  banner: {
    message: string;
    type: 'warning' | 'info' | 'error' | 'success';
  } | null;
}

/**
 * Result of transaction eligibility check
 */
export interface TransactionEligibility {
  canTransact: boolean;
  reason?: string;
  banner?: {
    message: string;
    type: 'warning' | 'info' | 'error';
  };
}

/**
 * Determine a client's onboarding state and related UI/eligibility flags.
 *
 * @param hasRM - Whether the client has an assigned Relationship Manager
 * @param verificationStatus - Client's KYC verification status, or `null` if not provided
 * @returns The client's OnboardingStatus containing:
 *  - `state`: the canonical onboarding progression
 *  - `canTransact`: whether the client may perform transactions
 *  - `showKycUpload`: whether the KYC upload UI should be shown
 *  - `banner`: an optional message and type for user-facing UI, or `null`
 */
export function getOnboardingStatus(
  hasRM: boolean,
  verificationStatus: VerificationStatus | null
): OnboardingStatus {
  // State 1: No KYC uploaded
  if (!verificationStatus || verificationStatus === 'NOT_SUBMITTED') {
    return {
      state: 'NO_KYC',
      canTransact: false,
      showKycUpload: true,
      banner: {
        message: 'Please upload your KYC documents to continue.',
        type: 'warning',
      },
    };
  }

  // State 2: KYC in progress (PENDING or UNDER_REVIEW)
  if (verificationStatus === 'PENDING' || verificationStatus === 'UNDER_REVIEW') {
    return {
      state: 'KYC_IN_PROGRESS',
      canTransact: false,
      showKycUpload: true,
      banner: {
        message: 'Your documents are under verification. Please wait.',
        type: 'info',
      },
    };
  }

  // State 2b: KYC rejected or expired
  if (verificationStatus === 'REJECTED' || verificationStatus === 'EXPIRED') {
    return {
      state: 'KYC_REJECTED',
      canTransact: false,
      showKycUpload: true,
      banner: {
        message: verificationStatus === 'REJECTED'
          ? 'Your KYC documents were rejected. Please resubmit.'
          : 'Your KYC verification has expired. Please resubmit your documents.',
        type: 'error',
      },
    };
  }

  // State 3: KYC verified but no RM assigned
  if (verificationStatus === 'VERIFIED' && !hasRM) {
    return {
      state: 'RM_PENDING',
      canTransact: false,
      showKycUpload: false,
      banner: {
        message: 'Your KYC is approved. Relationship Manager assignment is in progress.',
        type: 'info',
      },
    };
  }

  // State 4: Active client (KYC verified AND RM assigned)
  if (verificationStatus === 'VERIFIED' && hasRM) {
    return {
      state: 'ACTIVE',
      canTransact: true,
      showKycUpload: false,
      banner: null,
    };
  }

  // Fallback (should not reach here)
  return {
    state: 'NO_KYC',
    canTransact: false,
    showKycUpload: true,
    banner: {
      message: 'Please complete your onboarding to continue.',
      type: 'warning',
    },
  };
}

/**
 * Determine whether a client is allowed to make transactions.
 *
 * When the client is not allowed, includes a human-readable `reason` and an optional `banner`.
 * If a banner is returned, its `type` will never be `success` (it is normalized to `info`).
 *
 * @param hasRM - Whether the client has an assigned relationship manager
 * @param verificationStatus - The client's KYC verification status, or `null` if not submitted
 * @returns An object with `canTransact: true` when transactions are permitted; otherwise `canTransact: false` with a `reason` and optional `banner` explaining why
 */
export function checkTransactionEligibility(
  hasRM: boolean,
  verificationStatus: VerificationStatus | null
): TransactionEligibility {
  const status = getOnboardingStatus(hasRM, verificationStatus);

  if (status.canTransact) {
    return { canTransact: true };
  }

  return {
    canTransact: false,
    reason: status.banner?.message || 'Cannot make transactions at this time',
    banner: status.banner
      ? {
          message: status.banner.message,
          type: status.banner.type === 'success' ? 'info' : status.banner.type,
        }
      : undefined,
  };
}

/**
 * Return the client's status banner derived from RM assignment and KYC verification.
 *
 * @param hasRM - Whether the client has an assigned relationship manager
 * @param verificationStatus - The client's KYC verification status, or `null` if not available
 * @returns The banner object with `message` and normalized `type` (`'info'`, `'warning'`, or `'error'`), or `null` if no banner should be shown
 */
export function getClientStatusBanner(
  hasRM: boolean,
  verificationStatus: VerificationStatus | null
): { message: string; type: 'warning' | 'info' | 'error' } | null {
  const status = getOnboardingStatus(hasRM, verificationStatus);

  if (!status.banner) return null;

  return {
    message: status.banner.message,
    type: status.banner.type === 'success' ? 'info' : status.banner.type,
  };
}

/**
 * Determine whether the KYC upload UI should be shown for the given verification status.
 *
 * @param verificationStatus - The client's KYC verification status, or `null` if not available
 * @returns `true` if the verification status is not `'VERIFIED'`, `false` otherwise
 */
export function shouldShowKycUpload(verificationStatus: VerificationStatus | null): boolean {
  // Show KYC upload for: NOT_SUBMITTED, PENDING, UNDER_REVIEW, REJECTED, EXPIRED
  // Hide KYC upload for: VERIFIED
  return verificationStatus !== 'VERIFIED';
}