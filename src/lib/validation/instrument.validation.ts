/**
 * Instrument validation schemas
 * Zod schemas for instrument CRUD operations
 */

import { z } from 'zod';
import { InstrumentType } from '@prisma/client';

/**
 * Instrument creation schema
 */
export const createInstrumentSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be 20 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Symbol must contain only uppercase letters and numbers'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  type: z.nativeEnum(InstrumentType, {
    errorMap: () => ({ message: 'Invalid instrument type' }),
  }),
  isin: z
    .string()
    .regex(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/, 'Invalid ISIN format')
    .optional()
    .nullable(),
  description: z.string().max(10000, 'Description is too long').optional().nullable(),

  // Pricing
  currentPrice: z
    .number()
    .positive('Price must be positive')
    .max(999999999999.9999, 'Price is too high'),
  currency: z.string().length(3, 'Currency code must be 3 characters').default('USD'),

  // Market data
  exchange: z.string().max(50, 'Exchange name is too long').optional().nullable(),
  sector: z.string().max(100, 'Sector name is too long').optional().nullable(),
  marketCap: z.number().positive().optional().nullable(),
  yearlyHigh: z.number().positive().optional().nullable(),
  yearlyLow: z.number().positive().optional().nullable(),
  dividendYield: z.number().min(0).max(100).optional().nullable(),
  peRatio: z.number().positive().optional().nullable(),

  // Risk and investment
  riskRating: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      errorMap: () => ({ message: 'Risk rating must be LOW, MEDIUM, or HIGH' }),
    })
    .optional()
    .nullable(),
  minimumInvestment: z.number().positive('Minimum investment must be positive').optional().nullable(),

  // Status
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  launchDate: z.string().datetime().optional().nullable(),

  // Documents
  prospectusUrl: z.string().url().max(500).optional().nullable(),
});

/**
 * Instrument update schema (partial)
 */
export const updateInstrumentSchema = createInstrumentSchema.partial().extend({
  id: z.string().uuid('Invalid instrument ID'),
});

/**
 * Instrument query/filter schema
 */
export const instrumentQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // Search
  query: z.string().optional(),

  // Filters
  type: z.nativeEnum(InstrumentType).optional(),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  isActive: z.coerce.boolean().optional(),
  isPublic: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sector: z.string().optional(),
  exchange: z.string().optional(),

  // Sorting
  sortBy: z
    .enum([
      'name',
      'symbol',
      'type',
      'currentPrice',
      'riskRating',
      'createdAt',
      'updatedAt',
      'marketCap',
    ])
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Instrument status update schema
 */
export const instrumentStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().max(500).optional(),
});

/**
 * Bulk instrument operation schema
 */
export const bulkInstrumentOperationSchema = z.object({
  instrumentIds: z.array(z.string().uuid()).min(1, 'At least one instrument ID required'),
  operation: z.enum(['activate', 'deactivate', 'delete']),
  reason: z.string().max(500).optional(),
});

/**
 * Type exports
 */
export type CreateInstrumentInput = z.infer<typeof createInstrumentSchema>;
export type UpdateInstrumentInput = z.infer<typeof updateInstrumentSchema>;
export type InstrumentQuery = z.infer<typeof instrumentQuerySchema>;
export type InstrumentStatusUpdate = z.infer<typeof instrumentStatusSchema>;
export type BulkInstrumentOperation = z.infer<typeof bulkInstrumentOperationSchema>;
