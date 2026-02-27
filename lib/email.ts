import nodemailer from 'nodemailer';

// SMTP configuration - set these env vars on the server
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.SMTP_FROM || 'HomeLedger <noreply@homeledger.co.uk>';
const BASE_URL = process.env.NEXTAUTH_URL || 'https://homeledger.co.uk';

function baseTemplate(content: string, preheader: string = '') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HomeLedger</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b,#334155);padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#f59e0b,#d97706);width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="color:#1e293b;font-size:20px;font-weight:bold;">£</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:bold;">HomeLedger</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e2e8f0;background-color:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                HomeLedger — Your finances, simplified<br>
                <a href="${BASE_URL}" style="color:#64748b;text-decoration:none;">${BASE_URL.replace('https://', '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(text: string, url: string, color: string = '#1e293b') {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:${color};border-radius:8px;padding:12px 28px;">
          <a href="${url}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">${text}</a>
        </td>
      </tr>
    </table>`;
}

// ─── Email Templates ─────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, name: string) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Welcome to HomeLedger, ${name}! 🎉</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Your account has been created successfully. HomeLedger helps you manage your finances,
      track expenses, generate HMRC reports, and much more.
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#475569;line-height:1.6;">Here's what you can do:</p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>Upload bank statements and auto-categorise transactions</li>
      <li>Track bills and recurring payments</li>
      <li>Generate Self Assessment tax reports</li>
      <li>Store credentials securely in the Vault</li>
      <li>Set financial projections and savings goals</li>
    </ul>
    ${buttonHtml('Get Started', `${BASE_URL}/onboarding`)}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  `, `Welcome to HomeLedger, ${name}!`);

  return sendEmail(email, `Welcome to HomeLedger, ${name}! 🎉`, html);
}

export async function sendVerificationCodeEmail(email: string, name: string, code: string) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Your Login Code</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, here's your one-time verification code to sign in:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;padding:16px 32px;background-color:#f1f5f9;border-radius:12px;font-size:32px;font-weight:bold;letter-spacing:6px;color:#1e293b;">
        ${code}
      </span>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#475569;">
      This code expires in <strong>10 minutes</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If you didn't request this code, someone may be trying to access your account. You can safely ignore this email.
    </p>
  `, `Your HomeLedger login code: ${code}`);

  return sendEmail(email, `Your HomeLedger Login Code: ${code}`, html);
}

export async function sendInvitationEmail(email: string, inviterName: string, householdName: string, token: string) {
  const acceptUrl = `${BASE_URL}/invite/${token}`;
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">You've Been Invited!</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      <strong>${inviterName}</strong> has invited you to join <strong>${householdName}</strong> on HomeLedger.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      HomeLedger is a finance management platform that helps families and teams
      track expenses, manage bills, and stay on top of their finances together.
    </p>
    ${buttonHtml('Accept Invitation', acceptUrl, '#f59e0b')}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      This invitation expires in 7 days. If you don't recognise this invitation, you can safely ignore it.
    </p>
  `, `${inviterName} invited you to ${householdName} on HomeLedger`);

  return sendEmail(email, `${inviterName} invited you to ${householdName}`, html);
}

export async function sendOnboardingReminderEmail(email: string, name: string, percentComplete: number) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Complete Your Setup, ${name}</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      You're <strong>${percentComplete}%</strong> through setting up your HomeLedger account.
      Finish the setup to unlock all features.
    </p>
    <div style="background-color:#f1f5f9;border-radius:8px;height:8px;margin:16px 0;">
      <div style="background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:8px;height:8px;width:${percentComplete}%;"></div>
    </div>
    ${buttonHtml('Continue Setup', `${BASE_URL}/onboarding`)}
  `, `You're ${percentComplete}% done setting up HomeLedger`);

  return sendEmail(email, `Complete your HomeLedger setup (${percentComplete}% done)`, html);
}

export async function sendPasswordChangedEmail(email: string, name: string) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Password Changed</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, your HomeLedger password was successfully changed.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      If you didn't make this change, please reset your password immediately or contact support.
    </p>
    ${buttonHtml('Reset Password', `${BASE_URL}/forgot-password`, '#dc2626')}
  `, 'Your HomeLedger password was changed');

  return sendEmail(email, 'Your HomeLedger password was changed', html);
}

export async function sendDeadlineReminderEmail(
  email: string,
  name: string,
  deadlines: { title: string; dueDate: string; urgency: string; type: string }[]
) {
  const deadlineRows = deadlines.map(d => {
    const color = d.urgency === 'overdue' ? '#dc2626' : d.urgency === 'due_soon' ? '#d97706' : '#2563eb';
    const label = d.urgency === 'overdue' ? 'OVERDUE' : d.urgency === 'due_soon' ? 'DUE SOON' : 'UPCOMING';
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:14px;color:#1e293b;font-weight:500;">${d.title}</span><br>
          <span style="font-size:12px;color:#64748b;">${d.type} · Due: ${d.dueDate}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;text-align:right;">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:${color};background-color:${color}15;">${label}</span>
        </td>
      </tr>`;
  }).join('');

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Deadline Reminder</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, you have <strong>${deadlines.length} upcoming deadline${deadlines.length > 1 ? 's' : ''}</strong> that need your attention:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${deadlineRows}
    </table>
    ${buttonHtml('View Tax Timeline', `${BASE_URL}/tax-timeline`)}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      You can manage notification preferences in your account settings.
    </p>
  `, `${deadlines.length} deadline${deadlines.length > 1 ? 's' : ''} need your attention`);

  return sendEmail(email, `HomeLedger: ${deadlines.length} deadline${deadlines.length > 1 ? 's' : ''} need attention`, html);
}

export async function sendBudgetAlertEmail(
  email: string,
  name: string,
  alerts: { categoryName: string; budgeted: number; spent: number; percentage: number }[]
) {
  const alertRows = alerts.map(a => {
    const color = a.percentage >= 100 ? '#dc2626' : '#d97706';
    const label = a.percentage >= 100 ? 'OVER BUDGET' : 'NEAR LIMIT';
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:14px;color:#1e293b;font-weight:500;">${a.categoryName}</span><br>
          <span style="font-size:12px;color:#64748b;">£${a.spent.toFixed(2)} of £${a.budgeted.toFixed(2)} (${a.percentage.toFixed(0)}%)</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;text-align:right;">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:${color};background-color:${color}15;">${label}</span>
        </td>
      </tr>`;
  }).join('');

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Budget Alert</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, <strong>${alerts.length} budget${alerts.length > 1 ? 's are' : ' is'}</strong> at or near the limit:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${alertRows}
    </table>
    ${buttonHtml('View Budgets', `${BASE_URL}/reports`)}
  `, `${alerts.length} budget alert${alerts.length > 1 ? 's' : ''}`);

  return sendEmail(email, `HomeLedger: Budget Alert — ${alerts.length} budget${alerts.length > 1 ? 's' : ''} at limit`, html);
}

export async function sendSignupVerificationEmail(email: string, name: string, code: string) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Verify Your Email</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, thank you for registering! Please verify your email with the code below:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;padding:16px 32px;background-color:#f1f5f9;border-radius:12px;font-size:32px;font-weight:bold;letter-spacing:6px;color:#1e293b;">
        ${code}
      </span>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#475569;">
      This code expires in <strong>30 minutes</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  `, `Your HomeLedger verification code: ${code}`);

  return sendEmail(email, `Your HomeLedger verification code: ${code}`, html);
}

export async function sendPasswordResetEmail(email: string, name: string, code: string) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Password Reset</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, we received a request to reset your password. Use the code below:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;padding:16px 32px;background-color:#f1f5f9;border-radius:12px;font-size:32px;font-weight:bold;letter-spacing:6px;color:#1e293b;">
        ${code}
      </span>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#475569;">
      This code expires in <strong>15 minutes</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If you didn't request this, please ignore this email. Your password will remain unchanged.
    </p>
  `, `Your HomeLedger password reset code: ${code}`);

  return sendEmail(email, `Your HomeLedger password reset code: ${code}`, html);
}

export async function sendLoginAlertEmail(
  email: string,
  name: string,
  ipAddress: string,
  userAgent: string,
  timestamp: Date
) {
  const deviceInfo = parseUserAgent(userAgent);
  const formattedTime = timestamp.toLocaleString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">New Login Detected</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, a new sign-in was detected on your HomeLedger account.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#f8fafc;border-radius:8px;">
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Email</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${email}</td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Time</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${formattedTime}</td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">IP Address</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${ipAddress}</td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Device</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${deviceInfo.device}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#64748b;">Browser</td><td style="padding:10px 16px;font-size:14px;color:#1e293b;">${deviceInfo.browser}</td></tr>
    </table>
    <p style="margin:16px 0;padding:12px 16px;background-color:#fef3c7;border:1px solid #f59e0b;border-radius:8px;font-size:13px;color:#92400e;">
      <strong>Wasn't you?</strong> Change your password immediately and contact support.
    </p>
  `, 'New login detected on your HomeLedger account');

  return sendEmail(email, 'New login detected on your HomeLedger account', html);
}

export async function sendAdminCreatedAccountEmail(email: string, name: string, role: string, tempPassword?: string) {
  const passwordRow = tempPassword
    ? `<tr><td style="padding:10px 16px;font-size:14px;color:#64748b;">Temporary Password</td><td style="padding:10px 16px;font-size:14px;color:#1e293b;font-family:monospace;font-weight:bold;">${tempPassword}</td></tr>`
    : '';

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Welcome to HomeLedger!</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, an administrator has created a HomeLedger account for you.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#f8fafc;border-radius:8px;">
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Email</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${email}</td></tr>
      <tr><td style="padding:10px 16px;${tempPassword ? 'border-bottom:1px solid #e2e8f0;' : ''}font-size:14px;color:#64748b;">Role</td><td style="padding:10px 16px;${tempPassword ? 'border-bottom:1px solid #e2e8f0;' : ''}font-size:14px;color:#1e293b;">${role}</td></tr>
      ${passwordRow}
    </table>
    <p style="margin:16px 0;padding:12px 16px;background-color:#fef3c7;border:1px solid #f59e0b;border-radius:8px;font-size:13px;color:#92400e;">
      <strong>Important:</strong> You will be asked to change your password on first login. Do not share your credentials with anyone.
    </p>
    ${buttonHtml('Sign In to HomeLedger', `${BASE_URL}/login`)}
  `, `Your HomeLedger account has been created`);

  return sendEmail(email, `Welcome to HomeLedger, ${name}!`, html);
}

function parseUserAgent(userAgent: string): { browser: string; device: string } {
  let browser = 'Unknown Browser';
  let device = 'Unknown Device';
  if (userAgent.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (userAgent.includes('Edg')) browser = 'Microsoft Edge';
  else if (userAgent.includes('Chrome')) browser = 'Google Chrome';
  else if (userAgent.includes('Safari')) browser = 'Apple Safari';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
  if (userAgent.includes('iPhone')) device = 'iPhone (iOS)';
  else if (userAgent.includes('iPad')) device = 'iPad (iOS)';
  else if (userAgent.includes('Android')) device = userAgent.includes('Mobile') ? 'Android Phone' : 'Android Tablet';
  else if (userAgent.includes('Windows')) device = 'Windows PC';
  else if (userAgent.includes('Mac OS')) device = 'Mac';
  else if (userAgent.includes('Linux')) device = 'Linux PC';
  return { browser, device };
}

export async function sendVerificationLinksEmail(
  email: string,
  name: string,
  links: { url: string; token: string; expiresAt: Date | string }[],
  planName?: string,
) {
  const linksHtml = links.map((l, i) => `
    <tr>
      <td style="padding:8px 16px;font-size:14px;color:#64748b;">Link ${i + 1}</td>
      <td style="padding:8px 16px;">
        <a href="${l.url}" style="color:#2563eb;text-decoration:none;font-size:14px;font-weight:600;word-break:break-all;">${l.url}</a>
        <br><span style="font-size:12px;color:#94a3b8;">Expires: ${new Date(l.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </td>
    </tr>`).join('');

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Your Verification Links Are Ready</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, your payment has been confirmed${planName ? ` for the <strong>${planName}</strong> plan` : ''}. 
      Here ${links.length === 1 ? 'is your verification link' : `are your ${links.length} verification links`}:
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;">
      ${linksHtml}
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">
      Share each link with the person who needs to verify their identity. Each link can only be used once.
    </p>
  `);

  return sendEmail(email, `Your HomeLedger Verification Links (${links.length})`, html);
}

// ─── Send Helper ─────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
    return { success: false, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email] Failed to send to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}
