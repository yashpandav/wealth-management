/**
 * Authentication Validation Schemas
 * Zod schemas for registration, login, and password reset
 */

import { z } from 'zod';

// Password validation rules
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// User registration schema
export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    phone: z.string().min(5, 'Phone number is required').refine(
      (val) => {
        // E.164 format validation (starts with + and has 7-15 digits)
        return /^\+[1-9]\d{1,14}$/.test(val);
      },
      { message: 'Please enter a valid phone number with country code' }
    ),
    role: z.enum(['CLIENT', 'RM', 'ADMIN']).optional().default('CLIENT'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// Password reset request schema
export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

// Password reset schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
