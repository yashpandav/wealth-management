/**
 * Email Template Builder — EMDEE Ventures
 * Brand: Navy #002369 · Steel #657997 · Cream #F6F6F6 · Gold #C9A84C
 */

export type AccentColor = 'navy' | 'green' | 'amber' | 'red' | 'steel' | 'gold';

const ACCENT: Record<AccentColor, { bg: string; border: string; text: string; light: string; label: string }> = {
  navy:  { bg: '#002369', border: '#002369', text: '#ffffff', light: '#EBF0F8', label: '#002369' },
  green: { bg: '#0f6b4d', border: '#0f6b4d', text: '#ffffff', light: '#E8F5EE', label: '#0f6b4d' },
  amber: { bg: '#b8860b', border: '#C9A84C', text: '#ffffff', light: '#FBF5E0', label: '#8a6200' },
  red:   { bg: '#9b2020', border: '#9b2020', text: '#ffffff', light: '#FDEAEA', label: '#7a1515' },
  steel: { bg: '#4a6580', border: '#657997', text: '#ffffff', light: '#EEF2F6', label: '#3d5570' },
  gold:  { bg: '#9A7B2E', border: '#C9A84C', text: '#ffffff', light: '#FBF5E0', label: '#7a6020' },
};

/** App base URL for logo & links */
const APP_URL = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// ─── Shared partials ──────────────────────────────────────────────────────────

/** Top gold accent strip (3 px) */
const TOP_ACCENT = `
  <tr>
    <td style="height:4px;background:linear-gradient(to right,#002369 0%,#C9A84C 50%,#002369 100%);font-size:0;line-height:0;">&nbsp;</td>
  </tr>`;

/** Logo + company name header */
const HEADER = `
  <tr>
    <td style="background:#ffffff;padding:28px 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <img
              src="${APP_URL}/images/logo/primary-logo-1.png"
              alt="EMDEE Ventures"
              height="48"
              style="height:48px;width:auto;display:block;border:0;"
            />
          </td>
          <td style="vertical-align:middle;text-align:right;padding-left:16px;">
            <div style="font-family:Georgia,serif;font-size:9px;letter-spacing:3.5px;
              text-transform:uppercase;color:#657997;line-height:1.4;">
              Wealth Management Platform
            </div>
            <div style="font-family:Georgia,serif;font-size:8.5px;letter-spacing:2px;
              text-transform:uppercase;color:#C9A84C;margin-top:3px;">
              For a Better Tomorrow
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

/** Full-bleed gold gradient divider */
const GOLD_RULE = `
  <tr>
    <td style="height:1px;background:linear-gradient(to right,transparent,#C9A84C 20%,#C9A84C 80%,transparent);font-size:0;line-height:0;">&nbsp;</td>
  </tr>`;

/** Hairline rule for body sections */
const THIN_RULE = `<div style="height:1px;background:#DDE3EB;margin:24px 0;"></div>`;

/** Footer */
const FOOTER = `
  <tr>
    <td style="background:#F6F6F6;border-top:1px solid #DDE3EB;padding:28px 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;padding-bottom:16px;">
            <img
              src="${APP_URL}/images/logo/primary-logo-1.png"
              alt="EMDEE Ventures"
              height="32"
              style="height:32px;width:auto;display:inline-block;border:0;opacity:0.65;"
            />
          </td>
        </tr>
        <tr>
          <td style="text-align:center;">
            <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:2.5px;
              text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">
              For a Better Tomorrow
            </div>
            <div style="font-family:Georgia,serif;font-size:11px;color:#9aa5b4;
              line-height:1.7;margin-bottom:8px;">
              &copy; ${new Date().getFullYear()} EMDEE Ventures — Wealth Management CRM. All rights reserved.<br>
              This is an automated message. Please do not reply directly to this email.
            </div>
            <div style="font-family:Arial,sans-serif;font-size:9.5px;letter-spacing:1px;
              text-transform:uppercase;color:#b8c2cc;margin-top:10px;">
              AED-Denominated &nbsp;·&nbsp; KYC-Verified &nbsp;·&nbsp; Receipt-Based Payouts &nbsp;·&nbsp; Two-Tier Approvals
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Row { label: string; value: string }

export interface EmailTemplateConfig {
  accent?: AccentColor;
  heading: string;
  subheading?: string;
  greeting?: string;
  intro: string;
  rows?: Row[];
  callout?: { title: string; body: string; color?: AccentColor };
  cta?: { label: string; href: string };
  cta2?: { label: string; href: string };
  footerNote?: string;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildEmail(cfg: EmailTemplateConfig): string {
  const accent = ACCENT[cfg.accent ?? 'navy'];

  // ── Banner ──
  const banner = `
    <tr>
      <td style="background:${accent.bg};padding:0;">
        <!-- Inner banner table -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:36px 40px 32px;">
              <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;
                color:#ffffff;line-height:1.35;letter-spacing:0.2px;">
                ${cfg.heading}
              </div>
              ${cfg.subheading ? `
              <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2.5px;
                text-transform:uppercase;color:rgba(255,255,255,0.55);margin-top:10px;">
                ${cfg.subheading}
              </div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Banner-bottom gold line -->
    <tr>
      <td style="height:3px;background:linear-gradient(to right,#C9A84C,rgba(201,168,76,0.3));font-size:0;line-height:0;">&nbsp;</td>
    </tr>`;

  // ── Greeting ──
  const greeting = cfg.greeting
    ? `<div style="font-family:Georgia,serif;font-size:17px;font-weight:600;
        color:#002369;margin-bottom:14px;">${cfg.greeting}</div>`
    : '';

  // ── Intro ──
  const intro = `
    <div style="font-family:Georgia,serif;font-size:15px;color:#3d4d5c;
      line-height:1.8;margin-bottom:${cfg.rows?.length || cfg.callout ? '28px' : '0'};">
      ${cfg.intro}
    </div>`;

  // ── Info rows ──
  const card = cfg.rows?.length ? `
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border-collapse:collapse;border:1px solid #DDE3EB;
        border-radius:4px;margin-bottom:28px;overflow:hidden;">
      ${cfg.rows.map((r, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#FAFBFC'};">
          <td style="padding:11px 16px;border-bottom:1px solid #DDE3EB;
            font-family:Arial,sans-serif;font-size:10.5px;font-weight:700;
            letter-spacing:1px;text-transform:uppercase;color:#657997;
            white-space:nowrap;width:38%;">
            ${r.label}
          </td>
          <td style="padding:11px 16px;border-bottom:1px solid #DDE3EB;
            font-family:Georgia,serif;font-size:14px;color:#002369;font-weight:600;
            border-left:1px solid #DDE3EB;">
            ${r.value}
          </td>
        </tr>`).join('')}
    </table>` : '';

  // ── Callout box ──
  const callout = cfg.callout ? (() => {
    const c = ACCENT[cfg.callout!.color ?? cfg.accent ?? 'steel'];
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="width:4px;background:${c.border};border-radius:2px 0 0 2px;">&nbsp;</td>
          <td style="background:${c.light};padding:14px 18px;border:1px solid ${c.border};
            border-left:none;border-radius:0 4px 4px 0;">
            <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:800;
              letter-spacing:1.5px;text-transform:uppercase;color:${c.label};
              margin-bottom:8px;">
              ${cfg.callout!.title}
            </div>
            <div style="font-family:Georgia,serif;font-size:13.5px;color:#3d4d5c;
              line-height:1.7;">
              ${cfg.callout!.body}
            </div>
          </td>
        </tr>
      </table>`;
  })() : '';

  // ── CTA buttons ──
  const primaryBtn = cfg.cta ? `
    <table cellpadding="0" cellspacing="0" style="display:inline-table;">
      <tr>
        <td style="background:${accent.bg};border-radius:2px;">
          <a href="${cfg.cta.href}"
            style="display:inline-block;padding:13px 30px;
              font-family:Arial,sans-serif;font-size:10.5px;font-weight:800;
              letter-spacing:2px;text-transform:uppercase;color:#ffffff;
              text-decoration:none;">
            ${cfg.cta.label}
          </a>
        </td>
      </tr>
    </table>` : '';

  const secondaryBtn = cfg.cta2 ? `
    <table cellpadding="0" cellspacing="0" style="display:inline-table;margin-left:10px;">
      <tr>
        <td style="background:#ffffff;border:1.5px solid #002369;border-radius:2px;">
          <a href="${cfg.cta2.href}"
            style="display:inline-block;padding:11.5px 24px;
              font-family:Arial,sans-serif;font-size:10.5px;font-weight:700;
              letter-spacing:2px;text-transform:uppercase;color:#002369;
              text-decoration:none;">
            ${cfg.cta2.label}
          </a>
        </td>
      </tr>
    </table>` : '';

  const ctaBlock = (primaryBtn || secondaryBtn) ? `
    <div style="text-align:center;margin:32px 0 8px;">
      ${primaryBtn}${secondaryBtn}
    </div>` : '';

  // ── Footer note ──
  const footerNote = cfg.footerNote ? `
    ${THIN_RULE}
    <div style="font-family:Georgia,serif;font-size:12.5px;color:#8a96a3;
      line-height:1.7;font-style:italic;">
      ${cfg.footerNote}
    </div>` : '';

  // ─── Assemble ──────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${cfg.heading}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#E8EDF2;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
  style="background-color:#E8EDF2;min-height:100%;padding:32px 0;">
  <tr>
    <td align="center" style="padding:0 16px;">

      <!-- Email card -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:600px;width:100%;background:#ffffff;
          border-radius:4px;overflow:hidden;
          box-shadow:0 2px 16px rgba(0,35,105,0.10),0 1px 4px rgba(0,35,105,0.06);">

        ${TOP_ACCENT}
        ${HEADER}
        ${GOLD_RULE}
        ${banner}

        <!-- Body -->
        <tr>
          <td style="padding:38px 40px 32px;">
            ${greeting}
            ${intro}
            ${card}
            ${callout}
            ${ctaBlock}
            ${footerNote}
          </td>
        </tr>

        ${FOOTER}

      </table>
      <!-- /Email card -->

      <!-- Post-card note -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:600px;width:100%;margin-top:20px;">
        <tr>
          <td style="text-align:center;padding:0 16px;">
            <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.5px;
              color:#9aa5b4;line-height:1.6;">
              EMDEE Ventures &nbsp;·&nbsp; Wealth Management CRM &nbsp;·&nbsp; UAE
            </div>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>`;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Format AED amount */
export function fmtAED(amount: number, currency = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Format date for email */
export function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-AE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
