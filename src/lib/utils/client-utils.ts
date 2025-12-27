/**
 * Client Utilities
 * Helper functions for client status and eligibility checks
 */

import { VerificationStatus } from '@prisma/client';

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
 * Check if a client can make transactions (purchases/withdrawals)
 *
 * Requirements to transact:
 * 1. Client must have an assigned RM
 * 2. Client must have verified KYC (verificationStatus === 'VERIFIED')
 *
 * @param hasRM - Whether the client has an assigned RM
 * @param verificationStatus - Client's KYC verification status
 * @returns TransactionEligibility object with canTransact boolean and reason
 */
export function checkTransactionEligibility(
  hasRM: boolean,
  verificationStatus: VerificationStatus | null
): TransactionEligibility {
  // Check if RM is assigned
  if (!hasRM) {
    return {
      canTransact: false,
      reason: 'No Relationship Manager assigned',
      banner: {
        message: 'RM not assigned. Please wait for an RM to be assigned to your account.',
        type: 'warning',
      },
    };
  }

  // Check verification status
  if (!verificationStatus || verificationStatus !== 'VERIFIED') {
    let message = 'KYC verification pending';

    switch (verificationStatus) {
      case 'NOT_SUBMITTED':
        message = 'KYC documents not submitted. Please upload your documents to start verification.';
        break;
      case 'PENDING':
        message = 'KYC verification pending. Your documents are awaiting review.';
        break;
      case 'UNDER_REVIEW':
        message = 'KYC under review. Your documents are currently being verified.';
        break;
      case 'REJECTED':
        message = 'KYC verification rejected. Please resubmit your documents.';
        break;
      case 'EXPIRED':
        message = 'KYC verification expired. Please resubmit your documents.';
        break;
      default:
        message = 'KYC verification required to make transactions.';
    }

    return {
      canTransact: false,
      reason: `KYC not verified (${verificationStatus})`,
      banner: {
        message,
        type: 'warning',
      },
    };
  }

  // Both requirements met
  return {
    canTransact: true,
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
): { message: string; type: 'warning' | 'info' | 'error' } | null {
  const eligibility = checkTransactionEligibility(hasRM, verificationStatus);
  return eligibility.banner || null;
}
