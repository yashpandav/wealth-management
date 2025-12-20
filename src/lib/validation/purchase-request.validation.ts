/**
 * Purchase Request validation schemas
 * Zod schemas for purchase request operations
 */

import { z } from 'zod';
import { RequestStatus } from '@prisma/client';

/**
 * Purchase request creation schema (for clients)
 */
export const createPurchaseRequestSchema = z.object({
  instrumentId: z.string().uuid('Invalid instrument ID'),
  amount: z
    .number()
    .positive('Investment amount must be positive')
    .max(999999999999.99, 'Investment amount is too large'),
  clientNotes: z.string().max(5000, 'Notes are too long').optional().nullable(),
});

/**
 * Purchase request query/filter schema (for RMs)
 */
export const purchaseRequestQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // Filters
  status: z.nativeEnum(RequestStatus).optional(),
  clientId: z.string().uuid().optional(),
  instrumentId: z.string().uuid().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  search: z.string().optional(), // Search by tracking number or client name

  // Sorting
  sortBy: z
    .enum(['createdAt', 'amount', 'status', 'client', 'instrument'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Purchase request approval/rejection schema (for RMs)
 */
export const processPurchaseRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rmNotes: z.string().max(5000, 'Notes are too long').optional().nullable(),
  rejectionReason: z.string().max(1000, 'Rejection reason is too long').optional().nullable(),
  bankStatementRef: z.string().max(500, 'Bank statement reference is too long').optional().nullable(),
  paymentProof: z.string().url().max(500, 'Payment proof URL is too long').optional().nullable(),
}).refine(
  (data) => {
    // Rejection reason is required when rejecting
    if (data.action === 'reject' && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: 'Rejection reason is required when rejecting a request',
    path: ['rejectionReason'],
  }
);

/**
 * Type exports
 */
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
export type PurchaseRequestQuery = z.infer<typeof purchaseRequestQuerySchema>;
export type ProcessPurchaseRequestInput = z.infer<typeof processPurchaseRequestSchema>;
