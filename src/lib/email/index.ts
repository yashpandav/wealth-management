/**
 * Email utilities
 * Email templates, sending functions
 */

export {
  // Core email function
  sendEmail,

  // Authentication emails
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmailWithKYCPrompt,

  // Document emails
  sendDocumentUploadNotification,
  sendDocumentVerificationResult,

  // Client request confirmation emails
  sendPurchaseRequestSubmittedEmail,
  sendProductRequestSubmittedEmail,

  // Client request result emails (already exported - keeping for reference)
  sendPurchaseRequestApprovedEmail,
  sendPurchaseRequestRejectedEmail,
  sendWithdrawalRequestSubmittedEmail,
  sendWithdrawalRequestRMApprovedEmail,
  sendWithdrawalRequestApprovedEmail,
  sendWithdrawalRequestRejectedEmail,

  // KYC reminder emails (time-based)
  sendKYCReminderDay3,
  sendKYCReminderDay6,
  sendKYCExpiredEmail,

  // RM notification emails
  sendRMNewLeadAssignedEmail,
  sendRMPurchaseRequestNotification,
  sendRMWithdrawalRequestNotification,

  // Admin notification emails
  sendAdminWithdrawalEscalationEmail,

  // DocAdmin notification emails
  sendDocAdminContractUploadRequiredEmail,

  // Contract and payout emails
  sendContractUploadedEmail,
  sendMonthlyPayoutReminderEmail,
  sendContractRenewalReminderEmail,
} from './email.service';
export type { SendEmailOptions } from './email.service';
