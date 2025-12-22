/**
 * Document Validation Schemas
 * Zod schemas for document upload and verification
 */

import { z } from 'zod';

// Allowed MIME types for document uploads
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
] as const;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'] as const;

// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Document types enum matching Prisma schema
export const DocumentTypeEnum = z.enum([
  'IDENTITY_PROOF',
  'ADDRESS_PROOF',
  'INCOME_PROOF',
  'BANK_STATEMENT',
  'TAX_DOCUMENT',
  'INVESTMENT_AGREEMENT',
  'KYC_FORM',
  'OTHER',
]);

export type DocumentTypeValue = z.infer<typeof DocumentTypeEnum>;

// Document upload schema
export const documentUploadSchema = z.object({
  documentType: DocumentTypeEnum,
  description: z.string().max(500).optional(),
  expiryDate: z.string().datetime().optional(),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

// Document verification schema (for DocAdmin)
export const documentVerificationSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  action: z.enum(['VERIFY', 'REJECT']),
  rejectionReason: z.string().max(1000).optional(),
});

export type DocumentVerificationInput = z.infer<typeof documentVerificationSchema>;

/**
 * Validate file type based on MIME type
 */
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number]);
}

/**
 * Validate file extension
 */
export function isValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number]);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Sanitize filename to prevent path traversal and special characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() || 'document';

  // Remove special characters except alphanumeric, dash, underscore, and dot
  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 100); // Limit length

  // Ensure we have a valid filename
  if (!sanitized || sanitized === '.') {
    return 'document';
  }

  return sanitized;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
  };
  return mimeToExt[mimeType] || '.bin';
}

/**
 * Generate unique filename for storage
 */
export function generateStorageFilename(
  _userId: string,
  documentType: string,
  originalFilename: string
): string {
  const timestamp = Date.now();
  const ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
  const sanitizedType = documentType.toLowerCase().replace(/_/g, '-');
  return `${timestamp}-${sanitizedType}${ext}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
