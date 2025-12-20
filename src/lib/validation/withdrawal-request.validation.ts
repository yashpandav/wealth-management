/**
 * Withdrawal Request Validation Schemas
 * Zod schemas for validating withdrawal request data
 */

import { z } from 'zod';

/**
 * Schema for creating a new withdrawal request
 */
export const createWithdrawalRequestSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be positive')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),

  bankAccountName: z
    .string({
      required_error: 'Account holder name is required',
    })
    .min(2, 'Account holder name must be at least 2 characters')
    .max(100, 'Account holder name must not exceed 100 characters')
    .trim(),

  bankAccountNumber: z
    .string({
      required_error: 'Bank account number is required',
    })
    .min(8, 'Bank account number must be at least 8 characters')
    .max(17, 'Bank account number must not exceed 17 characters')
    .regex(/^[0-9]+$/, 'Bank account number must contain only digits'),

  bankName: z
    .string({
      required_error: 'Bank name is required',
    })
    .min(2, 'Bank name must be at least 2 characters')
    .max(100, 'Bank name must not exceed 100 characters')
    .trim(),

  bankBranch: z
    .string()
    .max(100, 'Bank branch must not exceed 100 characters')
    .trim()
    .optional(),

  swiftCode: z
    .string()
    .max(11, 'SWIFT code must not exceed 11 characters')
    .regex(/^[A-Z0-9]*$/, 'SWIFT code must contain only uppercase letters and numbers')
    .trim()
    .optional(),

  reason: z
    .string({
      required_error: 'Withdrawal reason is required',
    })
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters')
    .trim(),

  clientNotes: z
    .string()
    .max(2000, 'Client notes must not exceed 2000 characters')
    .trim()
    .optional(),
});

export type CreateWithdrawalRequestInput = z.infer<typeof createWithdrawalRequestSchema>;

/**
 * Schema for RM review/recommendation
 */
export const rmWithdrawalReviewSchema = z.object({
  recommendation: z.enum(['APPROVE', 'REJECT'], {
    required_error: 'Recommendation is required',
  }),

  rmNotes: z
    .string()
    .min(10, 'RM notes must be at least 10 characters')
    .max(2000, 'RM notes must not exceed 2000 characters')
    .trim(),

  verificationStatus: z.object({
    balanceVerified: z.boolean(),
    accountVerified: z.boolean(),
    clientContactConfirmed: z.boolean(),
  }).optional(),
});

export type RmWithdrawalReviewInput = z.infer<typeof rmWithdrawalReviewSchema>;

/**
 * Schema for admin final approval
 */
export const adminWithdrawalApprovalSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT'], {
    required_error: 'Decision is required',
  }),

  adminNotes: z
    .string()
    .min(10, 'Admin notes must be at least 10 characters')
    .max(2000, 'Admin notes must not exceed 2000 characters')
    .trim(),

  paymentReference: z
    .string()
    .max(100, 'Payment reference must not exceed 100 characters')
    .trim()
    .optional(),
});

export type AdminWithdrawalApprovalInput = z.infer<typeof adminWithdrawalApprovalSchema>;
