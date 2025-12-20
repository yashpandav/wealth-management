/**
 * User Validation Schemas
 * Zod schemas for user profile and management operations
 */

import { z } from 'zod';
import { UserRole, AccountStatus } from '@prisma/client';

/**
 * Profile update schema
 * For users updating their own profiles
 */
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  phone: z.string().max(20, 'Phone number too long').optional().nullable(),
});

/**
 * Profile photo upload schema
 */
export const profilePhotoSchema = z.object({
  photoUrl: z.string().url('Invalid photo URL').max(500, 'URL too long'),
});

/**
 * Admin user creation schema
 */
export const adminCreateUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  phone: z.string().max(20, 'Phone number too long').optional().nullable(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) }),
  status: z.nativeEnum(AccountStatus, { errorMap: () => ({ message: 'Invalid status' }) }).default(AccountStatus.ACTIVE),
});

/**
 * Admin user update schema
 */
export const adminUpdateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional().nullable(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) }).optional(),
  status: z.nativeEnum(AccountStatus, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
  isActive: z.boolean().optional(),
});

/**
 * User status update schema
 */
export const userStatusUpdateSchema = z.object({
  status: z.nativeEnum(AccountStatus, { errorMap: () => ({ message: 'Invalid status' }) }),
  reason: z.string().max(500, 'Reason too long').optional(),
});

/**
 * User search/filter schema
 */
export const userSearchSchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'lastName', 'email', 'lastLogin']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Bulk user operation schema
 */
export const bulkUserOperationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID required'),
  operation: z.enum(['activate', 'deactivate', 'lock', 'unlock', 'delete']),
  reason: z.string().max(500, 'Reason too long').optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfilePhotoInput = z.infer<typeof profilePhotoSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;
export type BulkUserOperationInput = z.infer<typeof bulkUserOperationSchema>;
