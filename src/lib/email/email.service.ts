/**
 * Email Service
 * Handles sending emails using nodemailer
 */

import nodemailer from 'nodemailer';
import { config } from '@/lib/config';

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
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  // Skip email sending in development if configured
  if (config.email.skip) {
    // eslint-disable-next-line no-console
    console.log('📧 Email sending skipped (development mode)');
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
        <title>Purchase Request Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Purchase Request Approved</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Great news! Your purchase request has been approved by your Relationship Manager.
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
            Your purchase will be processed and reflected in your portfolio shortly.
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
    subject: `Purchase Request Approved - ${trackingNumber}`,
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
        <title>Purchase Request Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Purchase Request Update</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            We're writing to inform you that your purchase request could not be approved at this time.
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
    subject: `Purchase Request Update - ${trackingNumber}`,
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
            This document is now on file and meets our verification requirements. If all your required documents are verified, you'll have full access to investment features.
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

This document is now on file and meets our verification requirements. If all your required documents are verified, you'll have full access to investment features.

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
