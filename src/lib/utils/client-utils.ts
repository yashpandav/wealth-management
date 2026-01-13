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
    title: string;
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
    title: string;
    message: string;
    type: 'warning' | 'info' | 'error';
  };
}

/**
 * Get the current onboarding state and status for a client
 *
 * @param hasRM - Whether the client has an assigned RM
 * @param verificationStatus - Client's KYC verification status
 * @returns OnboardingStatus object with state, canTransact, showKycUpload, and banner
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
        title: 'KYC Verification Required',
        message: 'Complete your KYC verification to submit plan requests and begin investing.',
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
        title: 'Verification In Progress',
        message: 'Your Identity Proof is under verification. You will be notified once complete.',
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
        title: 'Action Required',
        message: verificationStatus === 'REJECTED'
          ? 'Your Identity Proof was rejected. Please upload a valid document.'
          : 'Your Identity Proof verification has expired. Please upload a new document.',
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
        title: 'Pending Relationship Manager',
        message: 'Your KYC is approved. We are assigning a Relationship Manager to you.',
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
      title: 'Complete Onboarding',
      message: 'Please complete your onboarding requirements to continue.',
      type: 'warning',
    },
  };
}

/**
 * Check if a client can make transactions (purchases/withdrawals)
 *
 * Requirements to transact:
 * 1. Client must have verified KYC (verificationStatus === 'VERIFIED')
 * 2. Client must have an assigned RM
 *
 * @param hasRM - Whether the client has an assigned RM
 * @param verificationStatus - Client's KYC verification status
 * @returns TransactionEligibility object with canTransact boolean and reason
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
        title: status.banner.title,
        message: status.banner.message,
        type: status.banner.type === 'success' ? 'info' : status.banner.type,
      }
      : undefined,
  };
}

/**
 * Get banner message for client based on RM assignment and KYC status
 * This is a convenience function that returns just the banner info
 *
 * @param hasRM - Whether the client has an assigned RM
 * @param verificationStatus - Client's KYC verification status
 * @returns Banner info or null if client is eligible
 */
export function getClientStatusBanner(
  hasRM: boolean,
  verificationStatus: VerificationStatus | null
): { title: string; message: string; type: 'warning' | 'info' | 'error' } | null {
  const status = getOnboardingStatus(hasRM, verificationStatus);

  if (!status.banner) return null;

  return {
    title: status.banner.title,
    message: status.banner.message,
    type: status.banner.type === 'success' ? 'info' : status.banner.type,
  };
}

/**
 * Check if KYC upload UI should be shown to the client
 *
 * @param verificationStatus - Client's KYC verification status
 * @returns boolean indicating if KYC upload should be visible
 */
export function shouldShowKycUpload(verificationStatus: VerificationStatus | null): boolean {
  // Show KYC upload for: NOT_SUBMITTED, PENDING, UNDER_REVIEW, REJECTED, EXPIRED
  // Hide KYC upload for: VERIFIED
  return verificationStatus !== 'VERIFIED';
}
