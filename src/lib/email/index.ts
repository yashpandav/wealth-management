/**
 * Email utilities
 * Email templates, sending functions
 */

export {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmailWithKYCPrompt,
  sendDocumentUploadNotification,
  sendDocumentVerificationResult,
} from './email.service';
export type { SendEmailOptions } from './email.service';
