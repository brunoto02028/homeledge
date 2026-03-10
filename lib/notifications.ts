/**
 * Unified Notification Engine for Clarity & Co
 * Supports: Email (SMTP/Resend), SMS (Twilio), In-App (DB)
 */

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export interface NotificationPayload {
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  body: string;
  notifyEmail?: boolean;
  notifySms?: boolean;
  notifyInApp?: boolean;
  metadata?: Record<string, any>;
}

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_FROM?.replace(/.*<(.+)>/, '$1') || 'hello@clarityco.co.uk';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '';

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { type, title, body, notifyEmail, notifySms, notifyInApp, metadata } = payload;

  await Promise.allSettled([
    notifyInApp ? saveInAppNotification(type, title, body, metadata) : Promise.resolve(),
    notifyEmail ? sendEmailNotification(title, body) : Promise.resolve(),
    notifySms && ADMIN_PHONE ? sendSmsNotification(title, body) : Promise.resolve(),
  ]);
}

async function saveInAppNotification(
  type: string, title: string, body: string, metadata?: Record<string, any>
): Promise<void> {
  await (prisma as any).systemNotification.create({
    data: { type, channel: 'in_app', title, body, metadata: metadata || {}, sentAt: new Date() },
  });
}

async function sendEmailNotification(title: string, body: string): Promise<void> {
  try {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#7c3aed;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:18px">Clarity &amp; Co — Co-Work Alert</h2>
        </div>
        <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <h3 style="margin:0 0 12px;color:#111827">${title}</h3>
          <p style="color:#374151;white-space:pre-wrap;line-height:1.6">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
          <p style="color:#9ca3af;font-size:12px">Sent by Claude Co-Work · ${new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>`;
    await sendEmail(ADMIN_EMAIL, title, html);
  } catch (err) {
    console.error('[Notifications] Email failed:', err);
  }
}

async function sendSmsNotification(title: string, body: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.warn('[Notifications] Twilio not configured — SMS skipped');
    return;
  }
  try {
    const message = `Clarity Co-Work: ${title}\n${body.slice(0, 140)}`;
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: ADMIN_PHONE, From: process.env.TWILIO_FROM_NUMBER, Body: message }).toString(),
    });
  } catch (err) {
    console.error('[Notifications] SMS failed:', err);
  }
}

// Legacy compat — kept for any existing callers
export async function sendNotificationEmail(params: { notificationId: string; recipientEmail: string; subject: string; body: string; isHtml?: boolean }): Promise<boolean> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = 'Clarity & Co';
    const senderEmail = appUrl ? `noreply@${new URL(appUrl).hostname}` : 'noreply@clarityco.co.uk';

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: params.notificationId,
        subject: params.subject,
        body: params.body,
        is_html: params.isHtml ?? true,
        recipient_email: params.recipientEmail,
        sender_email: senderEmail,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      if (result.notification_disabled) {
        console.log('Notification disabled by user, skipping email');
        return true; // Don't treat as failure
      }
      console.error('Failed to send notification:', result.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

export function generateWelcomeEmailHtml(fullName: string, accountType: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Clarity & Co! 🎉</h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0;">Your finances, simplified</p>
      </div>
      
      <div style="padding: 30px 20px; background: white;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${fullName}!</h2>
        
        <p style="color: #475569; line-height: 1.6;">
          Thank you for creating your ${accountType === 'business' ? 'Business' : 'Household'} account. 
          You're all set to start managing your finances with Clarity & Co.
        </p>
        
        <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">🚀 Get Started:</h3>
          <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Upload bank statements for automatic categorisation</li>
            <li>Track bills and set up payment reminders</li>
            <li>Use "Capture & Classify" to scan documents</li>
            <li>Generate HMRC-compliant tax reports</li>
          </ul>
        </div>
        
        <p style="color: #475569; line-height: 1.6;">
          If you have any questions, we're here to help!
        </p>
        
        <p style="color: #1e293b; margin-top: 30px;">
          Best regards,<br/>
          <strong>The Clarity & Co Team</strong>
        </p>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Clarity & Co</p>
        <p style="margin: 5px 0 0 0;">Your finances, simplified.</p>
      </div>
    </div>
  `;
}

export function generateLoginAlertHtml(
  fullName: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  timestamp: Date
): string {
  const deviceInfo = parseUserAgent(userAgent);
  const formattedTime = timestamp.toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔐 New Login Detected</h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0;">Clarity & Co Security</p>
      </div>
      
      <div style="padding: 30px 20px; background: white;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${fullName},</h2>
        
        <p style="color: #475569; line-height: 1.6;">
          A new sign-in was detected on your Clarity & Co account.
        </p>
        
        <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">📋 Login Details:</h3>
          <table style="color: #475569; width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>IP Address:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${ipAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Device:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${deviceInfo.device}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Browser:</strong></td>
              <td style="padding: 8px 0;">${deviceInfo.browser}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>⚠️ Wasn't you?</strong><br/>
            If you didn't make this sign-in, please change your password immediately and contact support.
          </p>
        </div>
        
        <p style="color: #1e293b; margin-top: 30px;">
          Stay secure,<br/>
          <strong>The Clarity & Co Security Team</strong>
        </p>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">This is an automated security notification from Clarity & Co.</p>
        <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Clarity & Co</p>
      </div>
    </div>
  `;
}

function parseUserAgent(userAgent: string): { browser: string; device: string } {
  let browser = 'Unknown Browser';
  let device = 'Unknown Device';

  // Detect browser
  if (userAgent.includes('Firefox')) {
    browser = 'Mozilla Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Microsoft Edge';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Google Chrome';
  } else if (userAgent.includes('Safari')) {
    browser = 'Apple Safari';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect device/OS
  if (userAgent.includes('iPhone')) {
    device = 'iPhone (iOS)';
  } else if (userAgent.includes('iPad')) {
    device = 'iPad (iOS)';
  } else if (userAgent.includes('Android')) {
    device = userAgent.includes('Mobile') ? 'Android Phone' : 'Android Tablet';
  } else if (userAgent.includes('Windows')) {
    device = 'Windows PC';
  } else if (userAgent.includes('Mac OS')) {
    device = 'Mac';
  } else if (userAgent.includes('Linux')) {
    device = 'Linux PC';
  }

  return { browser, device };
}
