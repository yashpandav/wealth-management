/**
 * Email Service — Wealth Management CRM
 * All templates use the shared brand builder from ./templates
 */

import nodemailer from 'nodemailer';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db/prisma';
import { buildEmail, fmtAED, fmtDate, type AccentColor } from './templates';

// ── Transport ─────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: { user: config.email.user, pass: config.email.password },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Core send function — blocks archived users automatically.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: options.to },
      select: { isArchived: true },
    });
    if (user?.isArchived) {
      // eslint-disable-next-line no-console
      console.log(`[Email] Blocked archived user: ${options.to}`);
      return false;
    }
  } catch { /* fail open */ }

  if (config.email.skip) {
    // eslint-disable-next-line no-console
    console.log('[Email] Skipped:', options.to, '|', options.subject);
    return true;
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      ...options,
    });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Email] Failed:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string, token: string, firstName: string
): Promise<boolean> {
  const url = `${config.app.url}/verify-email?token=${token}`;
  const html = buildEmail({
    accent: 'navy',
    heading: 'Verify Your Email Address',
    subheading: 'One step away from your investment account',
    greeting: `Dear ${firstName},`,
    intro: 'Thank you for registering with Wealth Management CRM. Please verify your email address to activate your account and begin your investment journey.',
    rows: [{ label: 'Verification Link', value: `<a href="${url}" style="color:#002369;word-break:break-all;">${url}</a>` }],
    callout: { title: 'Security Notice', body: 'This link expires in <strong>24 hours</strong>. If you did not create an account, please disregard this email.', color: 'steel' },
    cta: { label: 'Verify Email Address', href: url },
    footerNote: 'For your security, we will never ask for your password via email. Contact your Relationship Manager for any account questions.',
  });
  return sendEmail({
    to: email, subject: 'Verify Your Email — Wealth Management CRM', html,
    text: `Dear ${firstName},\n\nVerify your email: ${url}\n\nThis link expires in 24 hours.\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendPasswordResetEmail(
  email: string, token: string, firstName: string
): Promise<boolean> {
  const url = `${config.app.url}/reset-password?token=${token}`;
  const html = buildEmail({
    accent: 'red',
    heading: 'Password Reset Request',
    subheading: 'Secure your account',
    greeting: `Dear ${firstName},`,
    intro: 'We received a request to reset the password for your Wealth Management CRM account. Click the button below to create a new password.',
    callout: { title: 'Security Alert', body: 'This link expires in <strong>1 hour</strong>. If you did not request a password reset, please contact us immediately — your account may be at risk.', color: 'red' },
    cta: { label: 'Reset Password', href: url },
    footerNote: 'If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.',
  });
  return sendEmail({
    to: email, subject: 'Password Reset — Wealth Management CRM', html,
    text: `Dear ${firstName},\n\nReset your password: ${url}\n\nExpires in 1 hour.\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME & KYC
// ─────────────────────────────────────────────────────────────────────────────

export async function sendWelcomeEmailWithKYCPrompt(
  email: string, firstName: string
): Promise<boolean> {
  const kycUrl = `${config.app.url}/client/documents`;
  const dashUrl = `${config.app.url}/client/dashboard`;
  const html = buildEmail({
    accent: 'green',
    heading: 'Welcome to Wealth Management CRM',
    subheading: 'Your account is verified and active',
    greeting: `Welcome, ${firstName}!`,
    intro: 'Congratulations — your email has been verified successfully. Your account is now active. To unlock the full suite of investment products, please complete your KYC verification.',
    rows: [
      { label: 'Identity Proof', value: 'Government ID, Passport or Driver\'s Licence' },
      { label: 'Address Proof', value: 'Utility bill or Bank statement (last 3 months)' },
      { label: 'Income Proof', value: 'Salary slip, Tax return or Employment letter' },
    ],
    callout: { title: 'Why KYC?', body: 'KYC (Know Your Customer) is mandatory under financial regulations to protect your investments and prevent fraud. Once verified, you gain full access to all AED-denominated investment tiers.', color: 'navy' },
    cta: { label: 'Complete KYC Now', href: kycUrl },
    cta2: { label: 'Go to Dashboard', href: dashUrl },
    footerNote: 'Verification typically takes 1–2 business days after document submission.',
  });
  return sendEmail({
    to: email, subject: 'Welcome! Complete Your KYC — Wealth Management CRM', html,
    text: `Welcome, ${firstName}!\n\nYour account is active. Complete KYC: ${kycUrl}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendKYCReminderDay3(
  email: string, firstName: string
): Promise<boolean> {
  const url = `${config.app.url}/client/documents`;
  const html = buildEmail({
    accent: 'amber',
    heading: 'Complete Your KYC Verification',
    subheading: 'Reminder — Day 3',
    greeting: `Dear ${firstName},`,
    intro: 'Your Wealth Management account is waiting for KYC verification. Completing this step unlocks your access to all investment tiers and payout schedules.',
    rows: [
      { label: 'Identity Proof', value: 'Government ID, Passport or Driver\'s Licence' },
      { label: 'Address Proof', value: 'Utility bill or Bank statement (last 3 months)' },
      { label: 'Income Proof', value: 'Salary slip or Employment letter' },
    ],
    callout: { title: 'Processing Time', body: 'Document verification takes just 1–2 business days. The earlier you submit, the sooner you can start earning defined returns.', color: 'steel' },
    cta: { label: 'Upload Documents', href: url },
    footerNote: 'You have 4 days remaining to complete verification before your account is reviewed.',
  });
  return sendEmail({
    to: email, subject: 'KYC Reminder — Complete Verification Today', html,
    text: `Dear ${firstName},\n\nComplete your KYC: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendKYCReminderDay6(
  email: string, firstName: string
): Promise<boolean> {
  const url = `${config.app.url}/client/documents`;
  const html = buildEmail({
    accent: 'red',
    heading: 'Urgent — Account at Risk',
    subheading: 'KYC must be completed within 24 hours',
    greeting: `Dear ${firstName},`,
    intro: 'This is your final reminder. Your account will be deactivated in <strong>24 hours</strong> if KYC verification is not completed. This is required under our regulatory obligations.',
    callout: { title: '⏰ 24 Hours Remaining', body: 'Upload your identity, address, and income proof documents immediately to keep your account active and maintain access to your investment portfolio.', color: 'red' },
    cta: { label: 'Upload Now — Keep Account Active', href: url },
    footerNote: 'If you have already submitted your documents and are awaiting review, please contact your Relationship Manager.',
  });
  return sendEmail({
    to: email, subject: '⚠ Final KYC Warning — Account Deactivation in 24h', html,
    text: `Dear ${firstName},\n\nUrgent: Upload documents now to avoid deactivation: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendKYCExpiredEmail(
  email: string, firstName: string
): Promise<boolean> {
  const url = `${config.app.url}/support`;
  const html = buildEmail({
    accent: 'steel',
    heading: 'Account Suspended',
    subheading: 'KYC verification not completed',
    greeting: `Dear ${firstName},`,
    intro: 'Your Wealth Management CRM account has been temporarily suspended as KYC verification was not completed within the required timeframe. This is a regulatory requirement we are unable to waive.',
    callout: { title: 'Reactivate Your Account', body: 'Contact our support team to restart the verification process. We will guide you through the steps to restore full account access.', color: 'navy' },
    cta: { label: 'Contact Support', href: url },
    footerNote: 'We appreciate your understanding and look forward to welcoming you back to the platform.',
  });
  return sendEmail({
    to: email, subject: 'Account Suspended — KYC Not Completed', html,
    text: `Dear ${firstName},\n\nYour account has been suspended. Contact support: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendDocumentUploadNotification(
  docAdminEmail: string, docAdminName: string,
  clientName: string, clientEmail: string,
  documentType: string, documentId: string
): Promise<boolean> {
  const reviewUrl = `${config.app.url}/admin/documents/${documentId}`;
  const pendingUrl = `${config.app.url}/admin/documents?status=PENDING`;
  const docLabel = documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  const html = buildEmail({
    accent: 'steel',
    heading: 'New Document Awaiting Review',
    subheading: 'Client KYC submission',
    greeting: `Dear ${docAdminName},`,
    intro: `A client has uploaded a new document that requires your review and verification.`,
    rows: [
      { label: 'Client Name', value: clientName },
      { label: 'Client Email', value: clientEmail },
      { label: 'Document Type', value: docLabel },
      { label: 'Submitted', value: new Date().toLocaleString('en-AE') },
    ],
    callout: { title: 'Action Required', body: 'Please review this document and verify or reject it in accordance with compliance requirements. The client is awaiting your decision.', color: 'amber' },
    cta: { label: 'Review Document', href: reviewUrl },
    cta2: { label: 'All Pending', href: pendingUrl },
  });
  return sendEmail({
    to: docAdminEmail, subject: `Document Upload — ${clientName} · ${docLabel}`, html,
    text: `Dear ${docAdminName},\n\n${clientName} uploaded a ${docLabel}.\nReview: ${reviewUrl}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendDocumentVerificationResult(
  email: string, firstName: string,
  documentType: string, isApproved: boolean,
  rejectionReason?: string
): Promise<boolean> {
  const docLabel = documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  const url = isApproved ? `${config.app.url}/login` : `${config.app.url}/client/documents`;
  const html = buildEmail({
    accent: isApproved ? 'green' : 'amber',
    heading: isApproved ? 'Document Verified' : 'Document Needs Attention',
    subheading: isApproved ? 'KYC review complete' : 'Resubmission required',
    greeting: `Dear ${firstName},`,
    intro: isApproved
      ? 'Your document has been reviewed and verified successfully. You now have full access to all KYC-verified investment features on the platform.'
      : 'We have reviewed your submitted document and it requires attention before we can proceed. Please review the feedback below and resubmit.',
    rows: [
      { label: 'Document Type', value: docLabel },
      { label: 'Status', value: isApproved ? '✓ Verified' : '⚠ Needs Resubmission' },
    ],
    callout: rejectionReason
      ? { title: 'Reason for Return', body: rejectionReason, color: 'amber' }
      : isApproved
        ? { title: 'Next Step', body: 'Log in to your account to explore investment tiers and place your first investment request.', color: 'green' }
        : undefined,
    cta: { label: isApproved ? 'Login to Platform' : 'Upload New Document', href: url },
    footerNote: 'Questions about document requirements? Contact your assigned Relationship Manager.',
  });
  const subject = isApproved
    ? `Document Verified — ${docLabel}`
    : `Document Needs Attention — ${docLabel}`;
  return sendEmail({
    to: email, subject: `${subject} · Wealth Management CRM`, html,
    text: `Dear ${firstName},\n\n${isApproved ? 'Document verified.' : 'Document needs resubmission.'}\n${rejectionReason ? `Reason: ${rejectionReason}` : ''}\n\n${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INVESTMENT / PRODUCT REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendProductRequestSubmittedEmail(
  email: string, firstName: string,
  trackingNumber: string, productName: string,
  amount: number, currency: string,
  duration: string, roi: number
): Promise<boolean> {
  const url = `${config.app.url}/client/requests`;
  const html = buildEmail({
    accent: 'navy',
    heading: 'Investment Request Received',
    subheading: `Reference: ${trackingNumber}`,
    greeting: `Dear ${firstName},`,
    intro: 'Thank you for choosing to invest with Wealth Management CRM. Your request has been received and is currently under review by your Relationship Manager.',
    rows: [
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Product', value: productName },
      { label: 'Amount', value: fmtAED(amount, currency) },
      { label: 'Duration', value: duration },
      { label: 'Expected ROI', value: `${roi}% per period` },
    ],
    callout: { title: 'What Happens Next', body: '1. Your RM reviews and approves the request<br>2. Our team prepares the investment contract<br>3. You receive the contract for review<br>4. Investment is activated upon contract completion', color: 'steel' },
    cta: { label: 'Track Request', href: url },
    footerNote: 'Your Relationship Manager will notify you once a decision is made, typically within 1–2 business days.',
  });
  return sendEmail({
    to: email, subject: `Investment Request Received — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nRequest received: ${trackingNumber}\nAmount: ${fmtAED(amount, currency)}\nTrack: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendPurchaseRequestSubmittedEmail(
  email: string, firstName: string,
  trackingNumber: string, instrumentName: string,
  instrumentSymbol: string, amount: number, currency: string
): Promise<boolean> {
  const url = `${config.app.url}/client/requests`;
  const html = buildEmail({
    accent: 'navy',
    heading: 'Investment Request Received',
    subheading: `Reference: ${trackingNumber}`,
    greeting: `Dear ${firstName},`,
    intro: 'We have received your investment request. Your Relationship Manager is now reviewing the details and will be in touch shortly.',
    rows: [
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Instrument', value: `${instrumentSymbol} — ${instrumentName}` },
      { label: 'Amount', value: fmtAED(amount, currency) },
    ],
    callout: { title: 'Next Step', body: 'Your RM will verify your bank statement and review this request. You will receive an email notification once a decision is made.', color: 'steel' },
    cta: { label: 'Track Request', href: url },
  });
  return sendEmail({
    to: email, subject: `Investment Request Received — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nRequest ${trackingNumber} received.\nTrack: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendPurchaseRequestApprovedEmail(
  email: string, firstName: string,
  trackingNumber: string, instrumentName: string,
  instrumentSymbol: string, amount: number, currency: string
): Promise<boolean> {
  const url = `${config.app.url}/client/requests`;
  const html = buildEmail({
    accent: 'green',
    heading: 'Investment Request Approved',
    subheading: `Reference: ${trackingNumber}`,
    greeting: `Dear ${firstName},`,
    intro: 'Excellent news. Your Relationship Manager has reviewed and approved your investment request. Your investment will be processed and reflected in your portfolio shortly.',
    rows: [
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Instrument', value: `${instrumentSymbol} — ${instrumentName}` },
      { label: 'Amount', value: fmtAED(amount, currency) },
      { label: 'Status', value: '✓ Approved' },
    ],
    cta: { label: 'View My Requests', href: url },
    footerNote: 'If you have any questions about this investment, please contact your Relationship Manager.',
  });
  return sendEmail({
    to: email, subject: `Investment Approved — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nYour request ${trackingNumber} has been approved.\nView: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendPurchaseRequestRejectedEmail(
  email: string, firstName: string,
  trackingNumber: string, instrumentName: string,
  instrumentSymbol: string, amount: number, currency: string,
  rejectionReason?: string
): Promise<boolean> {
  const url = `${config.app.url}/client/requests`;
  const html = buildEmail({
    accent: 'amber',
    heading: 'Investment Request — Update Required',
    subheading: `Reference: ${trackingNumber}`,
    greeting: `Dear ${firstName},`,
    intro: 'After review, your Relationship Manager was unable to approve this investment request at this time. Please see the details below.',
    rows: [
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Instrument', value: `${instrumentSymbol} — ${instrumentName}` },
      { label: 'Amount', value: fmtAED(amount, currency) },
    ],
    callout: rejectionReason
      ? { title: 'Reason Provided', body: rejectionReason, color: 'amber' }
      : { title: 'Next Step', body: 'Please contact your Relationship Manager to discuss an alternative request or to address any outstanding requirements.', color: 'steel' },
    cta: { label: 'View Request', href: url },
    footerNote: 'You may submit a new request once the requirements raised by your RM have been addressed.',
  });
  return sendEmail({
    to: email, subject: `Investment Request Update — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nRequest ${trackingNumber} was not approved.\n${rejectionReason ? `Reason: ${rejectionReason}` : ''}\nView: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WITHDRAWAL REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendWithdrawalRequestSubmittedEmail(
  email: string, firstName: string,
  trackingNumber: string, amount: number, currency: string
): Promise<boolean> {
  const url = `${config.app.url}/client/withdrawal-requests`;
  const html = buildEmail({
    accent: 'navy',
    heading: 'Withdrawal Request Received',
    subheading: `Reference: ${trackingNumber}`,
    greeting: `Dear ${firstName},`,
    intro: 'Your withdrawal request has been received and is now under review by your Relationship Manager. Our two-tier approval process ensures full transparency at every step.',
    rows: [
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Amount', value: fmtAED(amount, currency) },
      { label: 'Status', value: 'Awaiting RM Review' },
    ],
    callout: { title: 'Approval Process', body: '1. RM reviews and approves the request<br>2. Admin provides final approval<br>3. Funds are transferred to your registered bank account<br>4. You receive confirmation at each stage', color: 'steel' },
    cta: { label: 'Track Request', href: url },
  });
  return sendEmail({
    to: email, subject: `Withdrawal Request Received — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nWithdrawal request ${trackingNumber} received.\nAmount: ${fmtAED(amount, currency)}\nTrack: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendWithdrawalRequestRMApprovedEmail(
  email: string, firstName: string,
  trackingNumber: string, amount: number, currency: string, rmName: string
): Promise<boolean> {
  const url = `${config.app.url}/client/withdrawal-requests`;
  const html = buildEmail({
    accent: 'green',
    heading: 'RM Approval Received',
    subheading: `Reference: ${trackingNumber}`,
    greeting: `Dear ${firstName},`,
    intro: `Your withdrawal request has been reviewed and recommended for approval by your Relationship Manager, <strong>${rmName}</strong>. It is now awaiting final Admin approval.`,
    rows: [
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Amount', value: fmtAED(amount, currency) },
      { label: 'RM Approved', value: rmName },
      { label: 'Status', value: 'Awaiting Admin Approval' },
    ],
    callout: { title: 'One Step Remaining', body: 'The Admin team will now conduct the final review. You will receive an email confirmation once this step is complete.', color: 'navy' },
    cta: { label: 'Track Request', href: url },
    footerNote: 'Thank you for your patience during the approval process.',
  });
  return sendEmail({
    to: email, subject: `Withdrawal — RM Approved — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nRM approved withdrawal ${trackingNumber}. Awaiting admin.\nTrack: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendWithdrawalRequestApprovedEmail(
  email: string, firstName: string,
  trackingNumber: string, amount: number, currency: string,
  bankName: string, accountNumber: string
): Promise<boolean> {
  const masked = accountNumber.slice(0, -4).replace(/./g, '●') + accountNumber.slice(-4);
  const url = `${config.app.url}/client/withdrawal-requests`;
  const html = buildEmail({
    accent: 'green',
    heading: 'Withdrawal Approved',
    subheading: 'Funds being transferred',
    greeting: `Dear ${firstName},`,
    intro: 'Your withdrawal request has been fully approved. The funds are now being processed for transfer to your registered bank account.',
    rows: [
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Amount', value: fmtAED(amount, currency) },
      { label: 'Destination Bank', value: bankName },
      { label: 'Account', value: masked },
      { label: 'Expected', value: '2–5 business days' },
    ],
    callout: { title: 'Transfer Timeline', body: 'Funds will appear in your bank account within 2–5 business days. Please allow for processing time and check your bank statement for confirmation.', color: 'green' },
    cta: { label: 'View Details', href: url },
    footerNote: 'If funds are not received after 5 business days, please contact your Relationship Manager.',
  });
  return sendEmail({
    to: email, subject: `Withdrawal Approved — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nWithdrawal ${trackingNumber} approved. Amount: ${fmtAED(amount, currency)}\nView: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendWithdrawalRequestRejectedEmail(
  email: string, firstName: string,
  trackingNumber: string, amount: number, currency: string,
  rejectedBy: string, rejectionReason: string
): Promise<boolean> {
  const url = `${config.app.url}/client/withdrawal-requests`;
  const html = buildEmail({
    accent: 'amber',
    heading: 'Withdrawal Request — Not Approved',
    subheading: `Reference: ${trackingNumber}`,
    greeting: `Dear ${firstName},`,
    intro: 'After careful review, your withdrawal request could not be approved at this time. See the details and reason below.',
    rows: [
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Amount', value: fmtAED(amount, currency) },
      { label: 'Reviewed By', value: rejectedBy },
    ],
    callout: { title: 'Reason for Decision', body: rejectionReason, color: 'amber' },
    cta: { label: 'View Request', href: url },
    footerNote: 'To discuss this decision or submit a new request, please contact your Relationship Manager.',
  });
  return sendEmail({
    to: email, subject: `Withdrawal Not Approved — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nWithdrawal ${trackingNumber} not approved. Reason: ${rejectionReason}\nView: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RM NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendRMNewLeadAssignedEmail(
  rmEmail: string, rmName: string,
  leadName: string, leadEmail: string, leadPhone: string
): Promise<boolean> {
  const url = `${config.app.url}/rm/leads`;
  const html = buildEmail({
    accent: 'navy',
    heading: 'New Lead Assigned',
    subheading: 'Follow up within 24 hours',
    greeting: `Dear ${rmName},`,
    intro: 'A new prospective client has been assigned to you. Please make contact within 24 hours to introduce yourself and understand their investment requirements.',
    rows: [
      { label: 'Lead Name', value: leadName },
      { label: 'Email', value: leadEmail },
      { label: 'Phone', value: leadPhone },
      { label: 'Assigned', value: new Date().toLocaleDateString('en-AE') },
    ],
    callout: { title: 'Best Practice', body: 'Initial contact within 24 hours significantly increases conversion rates. Review the lead\'s source and tailor your approach accordingly.', color: 'steel' },
    cta: { label: 'View Lead Details', href: url },
  });
  return sendEmail({
    to: rmEmail, subject: `New Lead Assigned — ${leadName}`, html,
    text: `Dear ${rmName},\n\nNew lead: ${leadName} (${leadEmail} · ${leadPhone})\nView: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendRMPurchaseRequestNotification(
  rmEmail: string, rmName: string,
  clientName: string, trackingNumber: string,
  instrumentName: string, instrumentSymbol: string,
  amount: number, currency: string
): Promise<boolean> {
  const url = `${config.app.url}/rm/purchase-requests`;
  const html = buildEmail({
    accent: 'amber',
    heading: 'New Investment Request',
    subheading: 'Action required',
    greeting: `Dear ${rmName},`,
    intro: `One of your clients has submitted a new investment request that requires your review and approval.`,
    rows: [
      { label: 'Client', value: clientName },
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Instrument', value: `${instrumentSymbol} — ${instrumentName}` },
      { label: 'Amount', value: fmtAED(amount, currency) },
    ],
    callout: { title: 'Action Required', body: 'Please review the client\'s bank statement and approve or reject this request. The client is awaiting your decision.', color: 'amber' },
    cta: { label: 'Review Request', href: url },
  });
  return sendEmail({
    to: rmEmail, subject: `New Investment Request — ${trackingNumber}`, html,
    text: `Dear ${rmName},\n\n${clientName} submitted request ${trackingNumber}.\nAmount: ${fmtAED(amount, currency)}\nReview: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendRMWithdrawalRequestNotification(
  rmEmail: string, rmName: string,
  clientName: string, trackingNumber: string,
  amount: number, currency: string
): Promise<boolean> {
  const url = `${config.app.url}/rm/withdrawal-requests`;
  const html = buildEmail({
    accent: 'red',
    heading: 'Withdrawal Request Pending',
    subheading: 'Review required',
    greeting: `Dear ${rmName},`,
    intro: 'One of your clients has submitted a withdrawal request that requires your review. Please verify the portfolio balance before approving.',
    rows: [
      { label: 'Client', value: clientName },
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Amount', value: fmtAED(amount, currency) },
    ],
    callout: { title: 'Action Required', body: 'Verify the client\'s portfolio balance. If approved, the request will be escalated to Admin for final approval. Once Admin approves, funds will be released to the client.', color: 'amber' },
    cta: { label: 'Review Withdrawal', href: url },
  });
  return sendEmail({
    to: rmEmail, subject: `Withdrawal Request Pending — ${trackingNumber}`, html,
    text: `Dear ${rmName},\n\n${clientName} withdrawal ${trackingNumber}. Amount: ${fmtAED(amount, currency)}\nReview: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendAdminWithdrawalEscalationEmail(
  adminEmail: string, adminName: string,
  clientName: string, trackingNumber: string,
  amount: number, currency: string, rmName: string
): Promise<boolean> {
  const url = `${config.app.url}/admin/withdrawal-requests`;
  const html = buildEmail({
    accent: 'steel',
    heading: 'Withdrawal — Final Approval Required',
    subheading: 'RM has approved, awaiting Admin decision',
    greeting: `Dear ${adminName},`,
    intro: 'A withdrawal request has been approved by the assigned Relationship Manager and requires your final approval to proceed with fund release.',
    rows: [
      { label: 'Client', value: clientName },
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Amount', value: fmtAED(amount, currency) },
      { label: 'RM Approved By', value: rmName },
    ],
    callout: { title: 'Action Required', body: 'Please review this withdrawal request and provide final approval or rejection. Once approved, funds will be transferred to the client\'s registered bank account.', color: 'navy' },
    cta: { label: 'Review & Approve', href: url },
  });
  return sendEmail({
    to: adminEmail, subject: `Withdrawal — Final Approval Required — ${trackingNumber}`, html,
    text: `Dear ${adminName},\n\n${clientName} withdrawal ${trackingNumber} awaits your approval.\nAmount: ${fmtAED(amount, currency)}\nReview: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCADMIN — CONTRACTS & PAYOUTS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendDocAdminContractUploadRequiredEmail(
  docAdminEmail: string, docAdminName: string,
  clientName: string, productName: string,
  trackingNumber: string, amount: number, currency: string
): Promise<boolean> {
  const url = `${config.app.url}/docadmin/product-requests`;
  const html = buildEmail({
    accent: 'navy',
    heading: 'Contract Upload Required',
    subheading: 'RM-approved investment request',
    greeting: `Dear ${docAdminName},`,
    intro: 'An investment request has been approved by the Relationship Manager. Please prepare and upload the signed investment contract so the client can review and activate their investment.',
    rows: [
      { label: 'Client', value: clientName },
      { label: 'Product', value: productName },
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Amount', value: fmtAED(amount, currency) },
    ],
    callout: { title: 'Action Required', body: 'Prepare the investment contract with all agreed terms and upload it to the system. The client will be notified automatically once the contract is available.', color: 'steel' },
    cta: { label: 'Upload Contract', href: url },
  });
  return sendEmail({
    to: docAdminEmail, subject: `Contract Required — ${trackingNumber}`, html,
    text: `Dear ${docAdminName},\n\nContract required for ${clientName} — ${trackingNumber}.\nUpload: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendContractUploadedEmail(
  email: string, firstName: string,
  productName: string, trackingNumber: string, contractUrl: string
): Promise<boolean> {
  const dashUrl = `${config.app.url}/client/requests`;
  const html = buildEmail({
    accent: 'green',
    heading: 'Investment Contract Ready',
    subheading: 'Please review and confirm',
    greeting: `Dear ${firstName},`,
    intro: 'Your investment contract has been prepared and is ready for your review. Please read all terms carefully before confirming.',
    rows: [
      { label: 'Product', value: productName },
      { label: 'Tracking No.', value: trackingNumber },
      { label: 'Action', value: 'Review & Confirm' },
    ],
    callout: { title: 'Next Steps', body: '1. Review the contract carefully<br>2. Contact your RM if you have questions<br>3. Confirm your acceptance<br>4. Your investment will be activated', color: 'navy' },
    cta: { label: 'View Contract', href: contractUrl },
    cta2: { label: 'Dashboard', href: dashUrl },
    footerNote: 'Take your time reviewing all terms. Your Relationship Manager is available to clarify any clause.',
  });
  return sendEmail({
    to: email, subject: `Investment Contract Ready — ${trackingNumber}`, html,
    text: `Dear ${firstName},\n\nContract ready for ${productName} (${trackingNumber}).\nView: ${contractUrl}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYOUTS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendMonthlyPayoutReminderEmail(
  email: string, firstName: string,
  expectedPayout: number, currency: string, payoutDate: string
): Promise<boolean> {
  const url = `${config.app.url}/client/portfolio`;
  const html = buildEmail({
    accent: 'gold',
    heading: 'Payout Scheduled',
    subheading: 'Your interest payment is upcoming',
    greeting: `Dear ${firstName},`,
    intro: 'This is a courtesy reminder that your periodic interest payout is scheduled for processing. Ensure your bank details are current to avoid any delays.',
    rows: [
      { label: 'Expected Amount', value: fmtAED(expectedPayout, currency) },
      { label: 'Payout Date', value: payoutDate },
      { label: 'Processing Time', value: '2–3 business days' },
    ],
    callout: { title: 'Important', body: 'Payouts are processed by our DocAdmin team after the scheduled date. Please ensure your bank account details on file are accurate and up to date.', color: 'steel' },
    cta: { label: 'View Portfolio', href: url },
  });
  return sendEmail({
    to: email, subject: `Payout Scheduled — ${payoutDate}`, html,
    text: `Dear ${firstName},\n\nPayout of ${fmtAED(expectedPayout, currency)} scheduled for ${payoutDate}.\nView: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendPayoutCompletedEmail(
  email: string, firstName: string,
  amount: number, currency: string,
  periodStart: Date, periodEnd: Date,
  contractNumber: string, receiptUrl?: string
): Promise<boolean> {
  const url = `${config.app.url}/client/payouts`;
  const html = buildEmail({
    accent: 'green',
    heading: 'Interest Payment Credited',
    subheading: 'Your payout has been processed',
    greeting: `Dear ${firstName},`,
    intro: 'Your interest payment has been successfully processed and credited to your account. Please find the details below.',
    rows: [
      { label: 'Amount Credited', value: `<strong style="font-size:18px;color:#0f7c5a;">${fmtAED(amount, currency)}</strong>` },
      { label: 'Contract', value: contractNumber },
      { label: 'Period', value: `${fmtDate(periodStart)} — ${fmtDate(periodEnd)}` },
      { label: 'Processed On', value: fmtDate(new Date()) },
    ],
    callout: receiptUrl
      ? { title: 'Payment Receipt', body: `Your official payout receipt is available. <a href="${receiptUrl}" style="color:#002369;font-weight:600;">Download Receipt →</a>`, color: 'green' }
      : { title: 'Next Payout', body: 'Your next interest payment will be processed according to your contract\'s payout schedule. Check your portfolio for the upcoming schedule.', color: 'navy' },
    cta: { label: 'View Payout History', href: url },
    footerNote: 'Thank you for investing with Wealth Management CRM. We look forward to delivering your next payout.',
  });
  return sendEmail({
    to: email, subject: `Interest Payment Credited — ${fmtAED(amount, currency)}`, html,
    text: `Dear ${firstName},\n\n${fmtAED(amount, currency)} credited for period ${fmtDate(periodStart)}–${fmtDate(periodEnd)}.\nView: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

interface PendingPayoutData {
  id: string;
  amount: number | string | { toNumber(): number };
  client: { user: { firstName: string; lastName: string } };
  productPurchaseRequest: { investment: { name: string } };
}

export async function sendDocAdminPayoutReminder(
  email: string, payoutDate: Date, pendingPayouts: PendingPayoutData[]
): Promise<boolean> {
  const url = `${config.app.url}/docadmin/payouts`;
  const dateStr = fmtDate(payoutDate);
  const total = pendingPayouts.reduce((s, p) => s + Number(p.amount), 0);

  const html = buildEmail({
    accent: 'gold',
    heading: 'Pending Payouts Due',
    subheading: dateStr,
    greeting: 'Dear DocAdmin,',
    intro: `You have <strong>${pendingPayouts.length} pending payout${pendingPayouts.length !== 1 ? 's' : ''}</strong> totalling <strong>${fmtAED(total)}</strong> scheduled for processing on <strong>${dateStr}</strong>. Please log in to review and complete each payout.`,
    rows: [
      { label: 'Payout Date', value: dateStr },
      { label: 'Total Payouts', value: `${pendingPayouts.length}` },
      { label: 'Total Amount', value: fmtAED(total) },
    ],
    callout: { title: 'Action Required', body: 'Log in to the DocAdmin portal to process each payout. Upload the corresponding receipt for each client to complete the transaction.', color: 'amber' },
    cta: { label: 'Process Payouts Now', href: url },
  });

  return sendEmail({
    to: email, subject: `Pending Payouts Due — ${dateStr} (${pendingPayouts.length})`, html,
    text: `Payout reminder for ${dateStr}.\n${pendingPayouts.length} payouts totalling ${fmtAED(total)}.\nProcess: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}

export async function sendContractRenewalReminderEmail(
  email: string, firstName: string,
  productName: string, contractExpiryDate: string, daysRemaining: number
): Promise<boolean> {
  const url = `${config.app.url}/client/contact`;
  const urgency = daysRemaining <= 30 ? 'red' : 'amber';
  const html = buildEmail({
    accent: urgency as AccentColor,
    heading: 'Contract Renewal Reminder',
    subheading: `${daysRemaining} days until expiry`,
    greeting: `Dear ${firstName},`,
    intro: 'Your investment contract is approaching its expiry date. We recommend contacting your Relationship Manager early to discuss your preferred course of action.',
    rows: [
      { label: 'Product', value: productName },
      { label: 'Expiry Date', value: contractExpiryDate },
      { label: 'Days Remaining', value: `${daysRemaining} days` },
    ],
    callout: { title: 'Your Options', body: '<strong>Renew</strong> — Continue your investment with updated terms<br><strong>Withdraw</strong> — Full withdrawal of your investment principal<br><strong>Partial</strong> — Partial withdrawal and reinvest the remainder', color: 'steel' },
    cta: { label: 'Contact Relationship Manager', href: url },
    footerNote: 'We recommend initiating your renewal or withdrawal request at least 30 days before the expiry date to ensure timely processing.',
  });
  return sendEmail({
    to: email, subject: `Contract Renewal — ${daysRemaining} Days Remaining — ${productName}`, html,
    text: `Dear ${firstName},\n\n${productName} expires on ${contractExpiryDate} (${daysRemaining} days).\nContact RM: ${url}\n\n© ${new Date().getFullYear()} Wealth Management CRM`
  });
}


