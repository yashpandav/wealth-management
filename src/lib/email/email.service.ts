/**
 * Email Service
 * Handles sending emails using nodemailer
 */

import nodemailer from 'nodemailer';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db/prisma';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 *
 * IMPORTANT: Automatically prevents emails from being sent to archived users
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  // CRITICAL: Check if recipient is archived (prevents emails to expired KYC users)
  try {
    const user = await prisma.user.findUnique({
      where: { email: options.to },
      select: { isArchived: true, email: true },
    });

    if (user?.isArchived) {
      console.log(`[Email] Blocked: User is archived (${options.to}). Subject: ${options.subject}`);
      return false; // Do not send email to archived users
    }
  } catch (error) {
    console.error('[Email] Error checking archived status:', error);
    // Continue with email send if check fails (fail open for non-critical path)
  }

  // Skip email sending in development if configured
  if (config.email.skip) {
    // eslint-disable-next-line no-console
    console.log('[Email] Sending skipped (development mode)');
    // eslint-disable-next-line no-console
    console.log('To:', options.to);
    // eslint-disable-next-line no-console
    console.log('Subject:', options.subject);
    // eslint-disable-next-line no-console
    console.log('Preview:', options.text || options.html.substring(0, 100));
    return true;
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  firstName: string
): Promise<boolean> {
  const verificationUrl = `${config.app.url}/verify-email?token=${token}`;
  console.log('Verification URL:', verificationUrl, email, firstName);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Wealth Management CRM</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Welcome to Wealth Management CRM! Please verify your email address to activate your account.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Verify Email Address
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #3b82f6; word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
            ${verificationUrl}
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            This link will expire in 24 hours for security reasons.
          </p>

          <p style="font-size: 14px; color: #6b7280;">
            If you didn't create an account, please ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Welcome to Wealth Management CRM! Please verify your email address to activate your account.

Verification Link:
${verificationUrl}

This link will expire in 24 hours for security reasons.

If you didn't create an account, please ignore this email.

© ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: 'Verify Your Email - Wealth Management CRM',
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName: string
): Promise<boolean> {
  const resetUrl = `${config.app.url}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Wealth Management CRM</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #3b82f6; word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            This link will expire in 1 hour for security reasons.
          </p>

          <p style="font-size: 14px; color: #ef4444; font-weight: bold;">
            If you didn't request a password reset, please ignore this email and contact support immediately.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

We received a request to reset your password. Use the link below to create a new password:

Reset Link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email and contact support immediately.

© ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: 'Reset Your Password - Wealth Management CRM',
    html,
    text,
  });
}

/**
 * Send purchase request approved email
 */
export async function sendPurchaseRequestApprovedEmail(
  email: string,
  firstName: string,
  trackingNumber: string,
  instrumentName: string,
  instrumentSymbol: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const dashboardUrl = `${config.app.url}/client/requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Investment Request Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Investment Request Approved</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Great news! Your investment request has been approved by your Relationship Manager.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Instrument:</strong> ${instrumentSymbol} - ${instrumentName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <p style="font-size: 16px; color: #4b5563;">
            Your investment will be processed and reflected in your portfolio shortly.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              View My Requests
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            If you have any questions about this transaction, please contact your Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Great news! Your purchase request has been approved by your Relationship Manager.

Request Details:
- Tracking Number: ${trackingNumber}
- Instrument: ${instrumentSymbol} - ${instrumentName}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Your purchase will be processed and reflected in your portfolio shortly.

View your requests: ${dashboardUrl}

If you have any questions about this transaction, please contact your Relationship Manager.

© ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Investment Request Approved - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send purchase request rejected email
 */
export async function sendPurchaseRequestRejectedEmail(
  email: string,
  firstName: string,
  trackingNumber: string,
  instrumentName: string,
  instrumentSymbol: string,
  amount: number,
  currency: string,
  rejectionReason?: string
): Promise<boolean> {
  const dashboardUrl = `${config.app.url}/client/requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Investment Request Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Investment Request Update</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            We're writing to inform you that your investment request could not be approved at this time.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Instrument:</strong> ${instrumentSymbol} - ${instrumentName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          ${rejectionReason ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong style="color: #78350f;">Reason:</strong><br>
              ${rejectionReason}
            </p>
          </div>
          ` : ''}

          <p style="font-size: 16px; color: #4b5563;">
            Your Relationship Manager has reviewed your request and determined that it cannot be processed at this time.
            Please contact your Relationship Manager for more information or to submit a new request.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              View My Requests
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            If you have questions about this decision, please reach out to your Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

We're writing to inform you that your purchase request could not be approved at this time.

Request Details:
- Tracking Number: ${trackingNumber}
- Instrument: ${instrumentSymbol} - ${instrumentName}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

${rejectionReason ? `Reason:\n${rejectionReason}\n\n` : ''}Your Relationship Manager has reviewed your request and determined that it cannot be processed at this time.
Please contact your Relationship Manager for more information or to submit a new request.

View your requests: ${dashboardUrl}

If you have questions about this decision, please reach out to your Relationship Manager.

© ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Investment Request Update - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send withdrawal request submitted email
 */
export async function sendWithdrawalRequestSubmittedEmail(
  email: string,
  firstName: string,
  trackingNumber: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const trackingUrl = `${config.app.url}/client/withdrawal-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Request Submitted</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Withdrawal Request Received</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            We've received your withdrawal request and it's now being reviewed by your Relationship Manager.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>What's Next?</strong><br>
              1. Your Relationship Manager will review your request<br>
              2. If approved, it will be sent to Admin for final approval<br>
              3. Once fully approved, funds will be transferred to your bank account<br>
              4. You'll receive email notifications at each stage
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Track Your Request
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            You can track the status of your withdrawal request anytime by logging into your account.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

We've received your withdrawal request and it's now being reviewed by your Relationship Manager.

Request Details:
- Tracking Number: ${trackingNumber}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

What's Next?
1. Your Relationship Manager will review your request
2. If approved, it will be sent to Admin for final approval
3. Once fully approved, funds will be transferred to your bank account
4. You'll receive email notifications at each stage

Track your request: ${trackingUrl}

You can track the status of your withdrawal request anytime by logging into your account.

© ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Withdrawal Request Received - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send withdrawal request approved by RM email
 */
export async function sendWithdrawalRequestRMApprovedEmail(
  email: string,
  firstName: string,
  trackingNumber: string,
  amount: number,
  currency: string,
  rmName: string
): Promise<boolean> {
  const trackingUrl = `${config.app.url}/client/withdrawal-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Request Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">RM Approval Received</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Good news! Your Relationship Manager <strong>${rmName}</strong> has reviewed and recommended your withdrawal request for approval.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #065f46;">
              <strong>Current Status: RM Approved</strong><br>
              Your request is now awaiting final approval from our Admin team. You'll receive another notification once the admin review is complete.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Track Your Request
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Thank you for your patience as we complete the approval process.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Good news! Your Relationship Manager ${rmName} has reviewed and recommended your withdrawal request for approval.

Request Details:
- Tracking Number: ${trackingNumber}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Current Status: RM Approved
Your request is now awaiting final approval from our Admin team. You'll receive another notification once the admin review is complete.

Track your request: ${trackingUrl}

Thank you for your patience as we complete the approval process.

© ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Withdrawal Request Update - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send withdrawal request approved (final) email
 */
export async function sendWithdrawalRequestApprovedEmail(
  email: string,
  firstName: string,
  trackingNumber: string,
  amount: number,
  currency: string,
  bankName: string,
  accountNumber: string
): Promise<boolean> {
  const trackingUrl = `${config.app.url}/client/withdrawal-requests`;
  const maskedAccount = accountNumber.slice(0, -4).replace(/./g, '*') + accountNumber.slice(-4);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✓ Withdrawal Approved</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Excellent news! Your withdrawal request has been fully approved and is being processed.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Destination Bank:</strong> ${bankName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Account Number:</strong> ${maskedAccount}
            </p>
          </div>

          <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #065f46;">
              <strong>What Happens Next?</strong><br>
              The funds will be transferred to your bank account within 2-5 business days. Please check your bank statement for confirmation.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              View Request Details
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            If you don't see the funds in your account after 5 business days, please contact your Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Excellent news! Your withdrawal request has been fully approved and is being processed.

Request Details:
- Tracking Number: ${trackingNumber}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Destination Bank: ${bankName}
- Account Number: ${maskedAccount}

What Happens Next?
The funds will be transferred to your bank account within 2-5 business days. Please check your bank statement for confirmation.

View request details: ${trackingUrl}

If you don't see the funds in your account after 5 business days, please contact your Relationship Manager.

© ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Withdrawal Approved - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send withdrawal request rejected email
 */
export async function sendWithdrawalRequestRejectedEmail(
  email: string,
  firstName: string,
  trackingNumber: string,
  amount: number,
  currency: string,
  rejectedBy: string,
  rejectionReason: string
): Promise<boolean> {
  const trackingUrl = `${config.app.url}/client/withdrawal-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Request Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Withdrawal Request Update</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            We're writing to inform you that your withdrawal request could not be approved at this time.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Rejected By:</strong> ${rejectedBy}
            </p>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong style="color: #78350f;">Reason for Rejection:</strong><br>
              ${rejectionReason}
            </p>
          </div>

          <p style="font-size: 16px; color: #4b5563;">
            If you have questions about this decision or would like to submit a new withdrawal request, please contact your Relationship Manager.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              View Request Details
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            We're here to help. Please don't hesitate to reach out if you need assistance.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

We're writing to inform you that your withdrawal request could not be approved at this time.

Request Details:
- Tracking Number: ${trackingNumber}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Rejected By: ${rejectedBy}

Reason for Rejection:
${rejectionReason}

If you have questions about this decision or would like to submit a new withdrawal request, please contact your Relationship Manager.

View request details: ${trackingUrl}

We're here to help. Please don't hesitate to reach out if you need assistance.

© ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Withdrawal Request Update - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send welcome email after email verification with KYC prompt
 */
export async function sendWelcomeEmailWithKYCPrompt(
  email: string,
  firstName: string
): Promise<boolean> {
  const profileUrl = `${config.app.url}/client/profile`;
  const kycUrl = `${config.app.url}/client/documents`;
  const dashboardUrl = `${config.app.url}/client/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome - Account Verified</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Account Verified!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${firstName}!</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Congratulations! Your email has been successfully verified. Your account is now active and ready to use.
          </p>

          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #065f46; font-weight: bold;">
              Next Step: Complete Your Profile & KYC
            </p>
            <p style="margin: 0; font-size: 14px; color: #047857;">
              To start investing and access all platform features, please complete your profile and submit your KYC (Know Your Customer) documents.
            </p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">What you'll need:</h3>
            <ul style="color: #4b5563; font-size: 14px; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Identity Proof:</strong> Government ID, Passport, or Driver's License</li>
              <li style="margin-bottom: 8px;"><strong>Address Proof:</strong> Utility bill or Bank statement (within 3 months)</li>
              <li style="margin-bottom: 8px;"><strong>Income Proof:</strong> Salary slip, Tax return, or Employment letter</li>
              <li style="margin-bottom: 0;"><strong>Bank Details:</strong> Account information for transactions</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${kycUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-right: 10px;">
              Complete KYC Now
            </a>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Why is KYC required?</strong><br>
              KYC verification is mandatory for financial services to ensure security, prevent fraud, and comply with regulations. Once verified, you'll have full access to all investment opportunities.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">
              <strong>Quick Links:</strong>
            </p>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0;">
                  <a href="${dashboardUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">View Dashboard</a>
                </td>
                <td style="padding: 5px 0;">
                  <a href="${profileUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Edit Profile</a>
                </td>
                <td style="padding: 5px 0;">
                  <a href="${kycUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Upload Documents</a>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            If you have any questions, our support team is here to help. Simply reply to this email or contact your assigned Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.<br>
            <span style="color: #6b7280;">This is an automated message. Please do not reply directly to this email.</span>
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome, ${firstName}!

Congratulations! Your email has been successfully verified. Your account is now active and ready to use.

NEXT STEP: COMPLETE YOUR PROFILE & KYC
========================================

To start investing and access all platform features, please complete your profile and submit your KYC (Know Your Customer) documents.

What you'll need:
- Identity Proof: Government ID, Passport, or Driver's License
- Address Proof: Utility bill or Bank statement (within 3 months)
- Income Proof: Salary slip, Tax return, or Employment letter
- Bank Details: Account information for transactions

Complete KYC Now: ${kycUrl}

WHY IS KYC REQUIRED?
====================
KYC verification is mandatory for financial services to ensure security, prevent fraud, and comply with regulations. Once verified, you'll have full access to all investment opportunities.

Quick Links:
- View Dashboard: ${dashboardUrl}
- Edit Profile: ${profileUrl}
- Upload Documents: ${kycUrl}

If you have any questions, our support team is here to help. Simply reply to this email or contact your assigned Relationship Manager.

---
(c) ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
This is an automated message. Please do not reply directly to this email.
  `;

  return await sendEmail({
    to: email,
    subject: 'Welcome! Complete Your KYC to Start Investing - Wealth Management CRM',
    html,
    text,
  });
}

/**
 * Send document upload notification to DocAdmin
 * Triggered when a user uploads a document for verification
 */
export async function sendDocumentUploadNotification(
  docAdminEmail: string,
  docAdminName: string,
  clientName: string,
  clientEmail: string,
  documentType: string,
  documentId: string
): Promise<boolean> {
  const reviewUrl = `${config.app.url}/admin/documents/${documentId}`;
  const pendingDocsUrl = `${config.app.url}/admin/documents?status=PENDING`;

  const documentTypeFormatted = documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Document Awaiting Review</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Document Upload</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${docAdminName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            A new document has been uploaded and is awaiting your review.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Client Name:</strong> ${clientName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Client Email:</strong> ${clientEmail}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Document Type:</strong> ${documentTypeFormatted}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Uploaded:</strong> ${new Date().toLocaleString()}
            </p>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Action Required:</strong> Please review this document and verify or reject it based on the compliance requirements.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Review Document
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="font-size: 14px; color: #6b7280;">
              <a href="${pendingDocsUrl}" style="color: #3b82f6; text-decoration: none;">View All Pending Documents</a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.<br>
            <span style="color: #6b7280;">This is an automated notification for document administrators.</span>
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${docAdminName},

A new document has been uploaded and is awaiting your review.

DOCUMENT DETAILS
================
Client Name: ${clientName}
Client Email: ${clientEmail}
Document Type: ${documentTypeFormatted}
Uploaded: ${new Date().toLocaleString()}

ACTION REQUIRED
===============
Please review this document and verify or reject it based on the compliance requirements.

Review Document: ${reviewUrl}
View All Pending Documents: ${pendingDocsUrl}

---
(c) ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
This is an automated notification for document administrators.
  `;

  return await sendEmail({
    to: docAdminEmail,
    subject: `New Document Upload - ${clientName} - ${documentTypeFormatted}`,
    html,
    text,
  });
}

/**
 * Send document verification result to user
 * Triggered when DocAdmin verifies or rejects a document
 */
export async function sendDocumentVerificationResult(
  email: string,
  firstName: string,
  documentType: string,
  isApproved: boolean,
  rejectionReason?: string
): Promise<boolean> {
  const loginUrl = `${config.app.url}/login`;
  const documentsUrl = `${config.app.url}/client/documents`;
  const documentTypeFormatted = documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  const statusText = isApproved ? 'Verified' : 'Requires Attention';
  const statusGradient = isApproved
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Verification Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${statusGradient}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Document ${statusText}</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          ${isApproved ? `
          <p style="font-size: 16px; color: #4b5563;">
            Great news! Your document has been reviewed and verified successfully.
          </p>

          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #065f46; font-weight: bold;">
              Document Verified
            </p>
            <p style="margin: 0; font-size: 14px; color: #047857;">
              <strong>Document Type:</strong> ${documentTypeFormatted}
            </p>
          </div>

          <p style="font-size: 14px; color: #4b5563;">
            This document is now on file and meets our verification requirements. Since Identity Proof is the only required document, you now have full access to investment features.
          </p>
          ` : `
          <p style="font-size: 16px; color: #4b5563;">
            We've reviewed your document and it requires some attention before it can be verified.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Document Type:</strong> ${documentTypeFormatted}
            </p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Status:</strong> <span style="color: #d97706; font-weight: bold;">Needs Resubmission</span>
            </p>
          </div>

          ${rejectionReason ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong style="color: #78350f;">Reason:</strong><br>
              ${rejectionReason}
            </p>
          </div>
          ` : ''}

          <p style="font-size: 14px; color: #4b5563;">
            Please review the feedback above and upload a new document that addresses the issues mentioned.
          </p>
          `}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${isApproved ? loginUrl : documentsUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              ${isApproved ? 'Login to Platform' : 'Upload New Document'}
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            If you have any questions about document verification, please contact your Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.<br>
            <span style="color: #6b7280;">This is an automated message. Please do not reply directly to this email.</span>
          </p>
        </div>
      </body>
    </html>
  `;

  const text = isApproved ? `
Hi ${firstName},

Great news! Your document has been reviewed and verified successfully.

DOCUMENT VERIFIED
=================
Document Type: ${documentTypeFormatted}

This document is now on file and meets our verification requirements. Since Identity Proof is the only required document, you now have full access to investment features.

Login to Platform: ${loginUrl}

If you have any questions about document verification, please contact your Relationship Manager.

---
(c) ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
This is an automated message. Please do not reply directly to this email.
  ` : `
Hi ${firstName},

We've reviewed your document and it requires some attention before it can be verified.

DOCUMENT STATUS
===============
Document Type: ${documentTypeFormatted}
Status: Needs Resubmission

${rejectionReason ? `Reason:\n${rejectionReason}\n` : ''}
Please review the feedback above and upload a new document that addresses the issues mentioned.

Upload New Document: ${documentsUrl}

If you have any questions about document verification, please contact your Relationship Manager.

---
(c) ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
This is an automated message. Please do not reply directly to this email.
  `;

  const subject = isApproved
    ? `Document Verified - ${documentTypeFormatted}`
    : `Document Needs Attention - ${documentTypeFormatted}`;

  return await sendEmail({
    to: email,
    subject: `${subject} - Wealth Management CRM`,
    html,
    text,
  });
}

/**
 * Send purchase request submitted confirmation to client
 * Triggered when client submits a purchase request
 */
export async function sendPurchaseRequestSubmittedEmail(
  email: string,
  firstName: string,
  trackingNumber: string,
  instrumentName: string,
  instrumentSymbol: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const dashboardUrl = `${config.app.url}/client/requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Investment Request Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Investment Request Received</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Thank you for your interest. We've received your investment request and your Relationship Manager is now reviewing it.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Instrument:</strong> ${instrumentSymbol} - ${instrumentName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>What's Next?</strong><br>
              Your Relationship Manager will verify your bank statement and review your request. You'll receive an email notification once a decision is made.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Track Your Request
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            If you have questions, please contact your Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Thank you for your interest. We've received your purchase request and your Relationship Manager is now reviewing it.

Request Details:
- Tracking Number: ${trackingNumber}
- Instrument: ${instrumentSymbol} - ${instrumentName}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

What's Next?
Your Relationship Manager will verify your bank statement and review your request. You'll receive an email notification once a decision is made.

Track your request: ${dashboardUrl}

If you have questions, please contact your Relationship Manager.

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Investment Request Received - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send product request submitted confirmation to client
 * Triggered when client submits a product purchase request
 */
export async function sendProductRequestSubmittedEmail(
  email: string,
  firstName: string,
  trackingNumber: string,
  productName: string,
  amount: number,
  currency: string,
  duration: string,
  roi: number
): Promise<boolean> {
  const dashboardUrl = `${config.app.url}/client/product-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Request Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Product Request Received</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Thank you for choosing to invest with us. We've received your product request and your Relationship Manager is now reviewing it.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Product:</strong> ${productName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Duration:</strong> ${duration}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Expected ROI:</strong> ${roi}%
            </p>
          </div>

          <div style="background: #ede9fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #5b21b6;">
              <strong>What Happens Next?</strong><br>
              1. Your RM will review and approve your request<br>
              2. Our team will prepare the investment contract<br>
              3. You'll review and sign the contract<br>
              4. Your investment will be activated
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Track Your Request
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            We'll notify you at each step of the process. If you have questions, please contact your Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Thank you for choosing to invest with us. We've received your product request and your Relationship Manager is now reviewing it.

Request Details:
- Tracking Number: ${trackingNumber}
- Product: ${productName}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Duration: ${duration}
- Expected ROI: ${roi}%

What Happens Next?
1. Your RM will review and approve your request
2. Our team will prepare the investment contract
3. You'll review and sign the contract
4. Your investment will be activated

Track your request: ${dashboardUrl}

We'll notify you at each step of the process. If you have questions, please contact your Relationship Manager.

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Product Request Received - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send KYC reminder - Day 3 after email verification
 * Triggered by cron job
 */
export async function sendKYCReminderDay3(
  email: string,
  firstName: string
): Promise<boolean> {
  const documentsUrl = `${config.app.url}/client/documents`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your KYC Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Complete Your KYC</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            We noticed you haven't completed your KYC verification yet. To unlock all investment features and start growing your wealth, please upload your verification documents.
          </p>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #92400e; font-weight: bold;">
              What You Need:
            </p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
              <li>Identity Proof (Government ID, Passport, or Driver's License)</li>
              <li>Address Proof (Utility bill or Bank statement from last 3 months)</li>
              <li>Income Proof (Salary slip, Tax return, or Employment letter)</li>
              <li>Bank Details (Account information for transactions)</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentsUrl}"
               style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Upload Documents Now
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Verification usually takes 1-2 business days. The sooner you submit, the faster you can start investing.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

We noticed you haven't completed your KYC verification yet. To unlock all investment features and start growing your wealth, please upload your verification documents.

What You Need:
- Identity Proof (Government ID, Passport, or Driver's License)
- Address Proof (Utility bill or Bank statement from last 3 months)
- Income Proof (Salary slip, Tax return, or Employment letter)
- Bank Details (Account information for transactions)

Upload documents now: ${documentsUrl}

Verification usually takes 1-2 business days. The sooner you submit, the faster you can start investing.

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: 'Complete Your KYC Verification - Wealth Management CRM',
    html,
    text,
  });
}

/**
 * Send KYC reminder - Day 6 with deactivation warning
 * Triggered by cron job
 */
export async function sendKYCReminderDay6(
  email: string,
  firstName: string
): Promise<boolean> {
  const documentsUrl = `${config.app.url}/client/documents`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Urgent: Complete KYC to Avoid Deactivation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Action Required</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            This is your final reminder. Your account will be deactivated in 24 hours if you don't complete your KYC verification.
          </p>

          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #991b1b; font-weight: bold;">
              ⏰ Time Remaining: 24 Hours
            </p>
            <p style="margin: 0; font-size: 14px; color: #7f1d1d;">
              Without verified KYC documents, we cannot activate your account for investments. Please submit your documents today to avoid account deactivation.
            </p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Required Documents:</h3>
            <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
              <li>Identity Proof (Government ID, Passport, or Driver's License)</li>
              <li>Address Proof (Recent utility bill or Bank statement)</li>
              <li>Income Proof (Salary slip, Tax return, or Employment letter)</li>
              <li>Bank Details (For fund transfers)</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentsUrl}"
               style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Upload Now to Keep Account Active
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            Need help? Contact our support team or your Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

⚠️ ACTION REQUIRED

This is your final reminder. Your account will be deactivated in 24 hours if you don't complete your KYC verification.

Time Remaining: 24 Hours

Without verified KYC documents, we cannot activate your account for investments. Please submit your documents today to avoid account deactivation.

Required Documents:
- Identity Proof (Government ID, Passport, or Driver's License)
- Address Proof (Recent utility bill or Bank statement)
- Income Proof (Salary slip, Tax return, or Employment letter)
- Bank Details (For fund transfers)

Upload now: ${documentsUrl}

Need help? Contact our support team or your Relationship Manager.

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: '⚠️ Urgent: Complete KYC to Avoid Deactivation - Wealth Management CRM',
    html,
    text,
  });
}

/**
 * Send KYC expired notification - Day 7
 * Triggered by cron job
 */
export async function sendKYCExpiredEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  const supportUrl = `${config.app.url}/support`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deactivated - KYC Not Completed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Account Deactivated</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Your account has been deactivated because KYC verification was not completed within the required timeframe.
          </p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #1f2937;">
              As per regulatory requirements, we cannot activate investment accounts without verified KYC documents. Your account access has been temporarily suspended.
            </p>
          </div>

          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #1e40af; font-weight: bold;">
              Want to Reactivate Your Account?
            </p>
            <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
              Contact our support team to restart the verification process. We're here to help you get back on track.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${supportUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Contact Support
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            We appreciate your understanding and look forward to serving you.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Your account has been deactivated because KYC verification was not completed within the required timeframe.

As per regulatory requirements, we cannot activate investment accounts without verified KYC documents. Your account access has been temporarily suspended.

WANT TO REACTIVATE YOUR ACCOUNT?

Contact our support team to restart the verification process. We're here to help you get back on track.

Contact support: ${supportUrl}

We appreciate your understanding and look forward to serving you.

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: 'Account Deactivated - KYC Not Completed - Wealth Management CRM',
    html,
    text,
  });
}

/**
 * Send RM notification when new lead is assigned
 * Triggered when DocAdmin or Admin assigns RM to lead
 */
export async function sendRMNewLeadAssignedEmail(
  rmEmail: string,
  rmName: string,
  leadName: string,
  leadEmail: string,
  leadPhone: string
): Promise<boolean> {
  const leadsUrl = `${config.app.url}/rm/leads`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Lead Assigned</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Lead Assigned</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${rmName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            A new lead has been assigned to you for follow-up.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Lead Name:</strong> ${leadName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Email:</strong> ${leadEmail}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Phone:</strong> ${leadPhone}
            </p>
          </div>

          <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #065f46;">
              <strong>Next Steps:</strong><br>
              Please reach out to the lead within 24 hours to introduce yourself and understand their investment requirements.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${leadsUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              View Lead Details
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${rmName},

A new lead has been assigned to you for follow-up.

Lead Details:
- Name: ${leadName}
- Email: ${leadEmail}
- Phone: ${leadPhone}

Next Steps:
Please reach out to the lead within 24 hours to introduce yourself and understand their investment requirements.

View lead details: ${leadsUrl}

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: rmEmail,
    subject: `New Lead Assigned - ${leadName}`,
    html,
    text,
  });
}

/**
 * Send RM notification when client submits purchase request
 * Triggered when client submits purchase request
 */
export async function sendRMPurchaseRequestNotification(
  rmEmail: string,
  rmName: string,
  clientName: string,
  trackingNumber: string,
  instrumentName: string,
  instrumentSymbol: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const reviewUrl = `${config.app.url}/rm/purchase-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Investment Request to Review</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Investment Request</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${rmName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            One of your clients has submitted a new investment request that requires your review.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Client Name:</strong> ${clientName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Instrument:</strong> ${instrumentSymbol} - ${instrumentName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Action Required:</strong> Please review the client's bank statement and approve or reject this request.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Review Request
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${rmName},

One of your clients has submitted a new investment request that requires your review.

Request Details:
- Client Name: ${clientName}
- Tracking Number: ${trackingNumber}
- Instrument: ${instrumentSymbol} - ${instrumentName}
- Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Action Required: Please review the client's bank statement and approve or reject this request.

Review request: ${reviewUrl}

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: rmEmail,
    subject: `New Investment Request - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send RM notification when client submits withdrawal request
 * Triggered when client submits withdrawal request
 */
export async function sendRMWithdrawalRequestNotification(
  rmEmail: string,
  rmName: string,
  clientName: string,
  trackingNumber: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const reviewUrl = `${config.app.url}/rm/withdrawal-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Withdrawal Request to Review</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Withdrawal Request Pending</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${rmName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            One of your clients has requested a withdrawal that requires your review.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Client Name:</strong> ${clientName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Withdrawal Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div style="background: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #991b1b;">
              <strong>Action Required:</strong> Please verify the client's portfolio balance and approve or reject this withdrawal request. If approved, it will be sent to Admin for final approval.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Review Withdrawal
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${rmName},

One of your clients has requested a withdrawal that requires your review.

Request Details:
- Client Name: ${clientName}
- Tracking Number: ${trackingNumber}
- Withdrawal Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Action Required: Please verify the client's portfolio balance and approve or reject this withdrawal request. If approved, it will be sent to Admin for final approval.

Review withdrawal: ${reviewUrl}

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: rmEmail,
    subject: `Withdrawal Request Pending - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send Admin notification when RM approves withdrawal (escalation)
 * Triggered when RM approves a withdrawal request
 */
export async function sendAdminWithdrawalEscalationEmail(
  adminEmail: string,
  adminName: string,
  clientName: string,
  trackingNumber: string,
  amount: number,
  currency: string,
  rmName: string
): Promise<boolean> {
  const reviewUrl = `${config.app.url}/admin/withdrawal-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Request Awaiting Final Approval</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Withdrawal Awaits Approval</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${adminName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            A withdrawal request has been approved by the RM and requires your final approval to proceed.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Client Name:</strong> ${clientName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Withdrawal Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Approved By RM:</strong> ${rmName}
            </p>
          </div>

          <div style="background: #ede9fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #5b21b6;">
              <strong>Action Required:</strong> Please review this withdrawal request and provide final approval or rejection. Once approved, funds will be transferred to the client's bank account.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Review Withdrawal
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${adminName},

A withdrawal request has been approved by the RM and requires your final approval to proceed.

Request Details:
- Client Name: ${clientName}
- Tracking Number: ${trackingNumber}
- Withdrawal Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Approved By RM: ${rmName}

Action Required: Please review this withdrawal request and provide final approval or rejection. Once approved, funds will be transferred to the client's bank account.

Review withdrawal: ${reviewUrl}

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: adminEmail,
    subject: `Withdrawal Awaiting Final Approval - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send DocAdmin notification when product request is approved - contract upload needed
 * Triggered when RM approves product purchase request
 */
export async function sendDocAdminContractUploadRequiredEmail(
  docAdminEmail: string,
  docAdminName: string,
  clientName: string,
  productName: string,
  trackingNumber: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const contractUploadUrl = `${config.app.url}/docadmin/product-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contract Upload Required</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Contract Upload Required</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${docAdminName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            A product investment request has been approved by the RM. Please prepare and upload the investment contract for the client to review.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Client Name:</strong> ${clientName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Product:</strong> ${productName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Investment Amount:</strong> ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div style="background: #e0e7ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #3730a3;">
              <strong>Action Required:</strong> Please prepare the investment contract with all relevant terms and upload it to the system. The client will be notified once the contract is ready for review.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${contractUploadUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Upload Contract
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${docAdminName},

A product investment request has been approved by the RM. Please prepare and upload the investment contract for the client to review.

Request Details:
- Client Name: ${clientName}
- Product: ${productName}
- Tracking Number: ${trackingNumber}
- Investment Amount: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Action Required: Please prepare the investment contract with all relevant terms and upload it to the system. The client will be notified once the contract is ready for review.

Upload contract: ${contractUploadUrl}

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: docAdminEmail,
    subject: `Contract Upload Required - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send client notification when contract is uploaded
 * Triggered when DocAdmin uploads contract for product request
 */
export async function sendContractUploadedEmail(
  email: string,
  firstName: string,
  productName: string,
  trackingNumber: string,
  contractUrl: string
): Promise<boolean> {
  const dashboardUrl = `${config.app.url}/client/product-requests`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Investment Contract Ready for Review</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Contract Ready for Review</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Excellent news! Your investment contract has been prepared and is ready for your review.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Product:</strong> ${productName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Tracking Number:</strong> ${trackingNumber}
            </p>
          </div>

          <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #065f46;">
              <strong>Next Steps:</strong><br>
              1. Review the contract carefully<br>
              2. Contact your RM if you have questions<br>
              3. Sign and submit when ready<br>
              4. Your investment will be activated upon contract completion
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${contractUrl}"
               style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-right: 10px;">
              View Contract
            </a>
            <a href="${dashboardUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Take your time to review all terms. If you have questions, your Relationship Manager is here to help.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Excellent news! Your investment contract has been prepared and is ready for your review.

Contract Details:
- Product: ${productName}
- Tracking Number: ${trackingNumber}

Next Steps:
1. Review the contract carefully
2. Contact your RM if you have questions
3. Sign and submit when ready
4. Your investment will be activated upon contract completion

View contract: ${contractUrl}
Go to dashboard: ${dashboardUrl}

Take your time to review all terms. If you have questions, your Relationship Manager is here to help.

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Investment Contract Ready - ${trackingNumber}`,
    html,
    text,
  });
}

/**
 * Send monthly payout reminder - 15th of month
 * Triggered by cron job
 */
export async function sendMonthlyPayoutReminderEmail(
  email: string,
  firstName: string,
  expectedPayout: number,
  currency: string,
  payoutDate: string
): Promise<boolean> {
  const dashboardUrl = `${config.app.url}/client/portfolio`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Payout Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Monthly Payout Reminder</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            This is a reminder that your monthly investment payout is scheduled for processing.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Expected Payout:</strong> ${currency} ${expectedPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Payout Date:</strong> ${payoutDate}
            </p>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Important:</strong> Payouts are typically processed within 2-3 business days of the scheduled date. Please ensure your bank details are up to date.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              View Portfolio
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            If you have questions about your payout, please contact your Relationship Manager.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

This is a reminder that your monthly investment payout is scheduled for processing.

Payout Details:
- Expected Payout: ${currency} ${expectedPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Payout Date: ${payoutDate}

Important: Payouts are typically processed within 2-3 business days of the scheduled date. Please ensure your bank details are up to date.

View portfolio: ${dashboardUrl}

If you have questions about your payout, please contact your Relationship Manager.

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: 'Monthly Payout Reminder - Wealth Management CRM',
    html,
    text,
  });
}

/**
 * Send contract renewal reminder - 60 days before expiry
 * Triggered by cron job
 */
export async function sendContractRenewalReminderEmail(
  email: string,
  firstName: string,
  productName: string,
  contractExpiryDate: string,
  daysRemaining: number
): Promise<boolean> {
  const contactUrl = `${config.app.url}/client/contact`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contract Renewal Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Contract Renewal Reminder</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Your investment contract is approaching its expiry date. We wanted to remind you to plan ahead for renewal or withdrawal.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Product:</strong> ${productName}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Contract Expiry Date:</strong> ${contractExpiryDate}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Days Remaining:</strong> ${daysRemaining} days
            </p>
          </div>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #92400e; font-weight: bold;">
              Your Options:
            </p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
              <li><strong>Renew:</strong> Continue your investment with updated terms</li>
              <li><strong>Withdraw:</strong> Request full withdrawal of your investment</li>
              <li><strong>Partial Withdrawal:</strong> Withdraw part and reinvest the rest</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${contactUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Contact Your RM
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            We recommend contacting your Relationship Manager well before the expiry date to discuss your options and plan your next steps.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Your investment contract is approaching its expiry date. We wanted to remind you to plan ahead for renewal or withdrawal.

Contract Details:
- Product: ${productName}
- Contract Expiry Date: ${contractExpiryDate}
- Days Remaining: ${daysRemaining} days

Your Options:
- Renew: Continue your investment with updated terms
- Withdraw: Request full withdrawal of your investment
- Partial Withdrawal: Withdraw part and reinvest the rest

Contact your RM: ${contactUrl}

We recommend contacting your Relationship Manager well before the expiry date to discuss your options and plan your next steps.

&copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: `Contract Renewal Reminder - ${productName}`,
    html,
    text,
  });
}

/**
 * Send payout completed email to client with receipt
 * Triggered when DocAdmin completes a payout
 */
export async function sendPayoutCompletedEmail(
  email: string,
  firstName: string,
  amount: number,
  currency: string,
  periodStart: Date,
  periodEnd: Date,
  contractNumber: string,
  receiptUrl?: string
): Promise<boolean> {
  const payoutsUrl = `${config.app.url}/client/payouts`;
  const formattedAmount = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency || 'AED',
  }).format(amount);

  const periodStartFormatted = periodStart.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const periodEndFormatted = periodEnd.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interest Payment Credited</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Interest Payment Credited</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Great news! Your interest payment has been successfully credited to your account.
          </p>

          <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
            <p style="margin: 10px 0; font-size: 20px; color: #059669; font-weight: bold;">
              Amount: ${formattedAmount}
            </p>
            <p style="margin: 8px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Contract:</strong> ${contractNumber}
            </p>
            <p style="margin: 8px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Period:</strong> ${periodStartFormatted} - ${periodEndFormatted}
            </p>
            <p style="margin: 8px 0; font-size: 14px; color: #6b7280;">
              <strong style="color: #1f2937;">Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          ${receiptUrl ? `
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #065f46;">
              📄 <strong>Payment Receipt</strong>
            </p>
            <p style="margin: 0; font-size: 13px; color: #047857;">
              Your payout receipt is attached to this email. Please save it for your records.
            </p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${payoutsUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              View Payout History
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Thank you for investing with us. Your next payout will be processed according to your contract schedule.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.<br>
            <span style="color: #6b7280;">This is an automated message. Please do not reply directly to this email.</span>
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

Great news! Your interest payment has been successfully credited to your account.

PAYMENT DETAILS
===============
Amount: ${formattedAmount}
Contract: ${contractNumber}
Period: ${periodStartFormatted} - ${periodEndFormatted}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${receiptUrl ? 'Your payout receipt is attached to this email. Please save it for your records.\n' : ''}
View your payout history: ${payoutsUrl}

Thank you for investing with us. Your next payout will be processed according to your contract schedule.

---
(c) ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
This is an automated message. Please do not reply directly to this email.
  `;

  return await sendEmail({
    to: email,
    subject: `Interest Payment Credited - ${formattedAmount}`,
    html,
    text,
  });
}

/**
 * Send payout reminder email to DocAdmin
 * Triggered by cron job for payouts due on 15th or month-end
 */
interface PendingPayoutData {
  id: string;
  amount: number | string | { toNumber(): number };
  client: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  productPurchaseRequest: {
    investment: {
      name: string;
    };
  };
}

export async function sendDocAdminPayoutReminder(
  email: string,
  payoutDate: Date,
  pendingPayouts: PendingPayoutData[]
): Promise<boolean> {
  const dashboardUrl = `${config.app.url}/docadmin/payouts`;
  const payoutDateFormatted = payoutDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalAmount = pendingPayouts.reduce((sum, payout) => sum + Number(payout.amount), 0);
  const formattedTotalAmount = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(totalAmount);

  // Build table rows
  const tableRows = pendingPayouts.map(payout => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">
        ${payout.client.user.firstName} ${payout.client.user.lastName}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">
        ${payout.productPurchaseRequest.investment.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; text-align: right;">
        ${new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(Number(payout.amount))}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pending Payouts Due</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Pending Payouts Due</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Payouts Due on ${payoutDateFormatted}</h2>

          <p style="font-size: 16px; color: #4b5563;">
            You have <strong style="color: #d97706;">${pendingPayouts.length} pending payout(s)</strong> scheduled for processing on ${payoutDateFormatted}.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0; font-size: 18px; color: #92400e; font-weight: bold;">
              Total Amount: ${formattedTotalAmount}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #78350f;">
              Number of Payouts: ${pendingPayouts.length}
            </p>
          </div>

          <h3 style="color: #1f2937; margin: 25px 0 15px 0; font-size: 18px;">Payout Details:</h3>

          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600;">Client</th>
                <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600;">Product</th>
                <th style="padding: 12px; text-align: right; font-size: 14px; color: #6b7280; font-weight: 600;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400e; font-weight: bold;">
              📋 Action Required:
            </p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #78350f; font-size: 14px;">
              <li>Review each payout in the dashboard</li>
              <li>Upload payment receipts</li>
              <li>Mark payouts as completed</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Process Payouts
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Please ensure all payouts are processed before the due date to maintain timely service to our clients.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            &copy; ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.<br>
            <span style="color: #6b7280;">This is an automated reminder.</span>
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Pending Payouts Due on ${payoutDateFormatted}

You have ${pendingPayouts.length} pending payout(s) scheduled for processing on ${payoutDateFormatted}.

SUMMARY
=======
Total Amount: ${formattedTotalAmount}
Number of Payouts: ${pendingPayouts.length}

PAYOUT DETAILS
==============
${pendingPayouts.map(p => `
- Client: ${p.client.user.firstName} ${p.client.user.lastName}
  Product: ${p.productPurchaseRequest.investment.name}
  Amount: ${new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(Number(p.amount))}
`).join('\n')}

ACTION REQUIRED:
- Review each payout in the dashboard
- Upload payment receipts
- Mark payouts as completed

Process payouts: ${dashboardUrl}

Please ensure all payouts are processed before the due date to maintain timely service to our clients.

---
(c) ${new Date().getFullYear()} Wealth Management CRM. All rights reserved.
This is an automated reminder.
  `;

  return await sendEmail({
    to: email,
    subject: `Payout Reminder: ${pendingPayouts.length} Payouts Due on ${payoutDateFormatted}`,
    html,
    text,
  });
}
