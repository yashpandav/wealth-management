/**
 * User Lead validation schemas
 * Zod schemas for user lead form operations
 */

import { z } from 'zod';

/**
 * Lead Source enum values matching Prisma schema
 */
export const leadSourceEnum = z.enum([
  'INSTAGRAM',
  'YOUTUBE',
  'FACEBOOK_ADS',
  'GOOGLE_ADS',
  'WEBSITE',
  'REFERRAL',
  'OTHER',
]);

/**
 * Simplified Lead Form Schema
 * Captures only essential personal information, lead source, and optional RM reference
 */
export const createLeadSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(255, 'First name must be 255 characters or less')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(255, 'Last name must be 255 characters or less')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .toLowerCase()
    .trim(),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => {
        // E.164 format validation (starts with + and has 7-15 digits)
        return /^\+[1-9]\d{1,14}$/.test(val);
      },
      { message: 'Please enter a valid phone number with country code' }
    ),
  leadSource: leadSourceEnum,
  rmReference: z
    .string()
    .max(255, 'RM reference must be 255 characters or less')
    .trim()
    .optional()
    .nullable(),
});

// Legacy schemas for backward compatibility (deprecated)
export const personalInfoSchema = createLeadSchema;
export const financialInfoSchema = z.object({});

/**
 * Lead query/filter schema for admin listing
 */
export const leadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  query: z.string().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'leadSource', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  leadSource: leadSourceEnum.optional(),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'LOST']).optional(),
});

/**
 * Type exports
 */
export type LeadSource = z.infer<typeof leadSourceEnum>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadQuery = z.infer<typeof leadQuerySchema>;

// Legacy type exports for backward compatibility (deprecated)
export type PersonalInfoInput = CreateLeadInput;
export type FinancialInfoInput = Record<string, never>;
