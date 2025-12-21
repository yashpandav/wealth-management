/**
 * User Lead validation schemas
 * Zod schemas for user lead form operations
 */

import { z } from 'zod';

/**
 * Section 1: Personal Information schema
 */
export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Name must be 255 characters or less'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(50, 'Phone number is too long'),
  age: z
    .number({ required_error: 'Age is required', invalid_type_error: 'Age must be a number' })
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Please enter a valid age'),
});

/**
 * Section 2: Financial Information schema
 */
export const financialInfoSchema = z.object({
  monthlyIncome: z
    .number({ required_error: 'Monthly income is required', invalid_type_error: 'Monthly income must be a number' })
    .positive('Monthly income must be a positive number'),
  monthlyExpenses: z
    .number({ required_error: 'Monthly expenses is required', invalid_type_error: 'Monthly expenses must be a number' })
    .min(0, 'Monthly expenses cannot be negative'),
  familyExpenses: z
    .number({ required_error: 'Family expenses is required', invalid_type_error: 'Family expenses must be a number' })
    .min(0, 'Family expenses cannot be negative'),
  financialGoals: z
    .string()
    .min(1, 'Financial goals is required')
    .max(5000, 'Financial goals must be 5000 characters or less'),
  currentSavings: z
    .number()
    .min(0, 'Current savings cannot be negative')
    .optional()
    .nullable(),
  investmentExperience: z
    .enum(['None', 'Beginner', 'Intermediate', 'Advanced'])
    .optional()
    .nullable(),
  riskTolerance: z
    .enum(['Low', 'Medium', 'High'])
    .optional()
    .nullable(),
  investmentHorizon: z
    .enum(['Short-term', 'Medium-term', 'Long-term'])
    .optional()
    .nullable(),
});

/**
 * Complete Lead creation schema (combines both sections)
 */
export const createLeadSchema = personalInfoSchema.merge(financialInfoSchema);

/**
 * Lead query/filter schema for admin listing
 */
export const leadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  query: z.string().optional(),
  sortBy: z.enum(['fullName', 'email', 'createdAt', 'age', 'monthlyIncome']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Type exports
 */
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type FinancialInfoInput = z.infer<typeof financialInfoSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadQuery = z.infer<typeof leadQuerySchema>;
