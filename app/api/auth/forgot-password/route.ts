import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/notifications';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetEmailHtml(fullName: string, code: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔑 Password Reset</h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0;">HomeLedger Security</p>
      </div>
      <div style="padding: 30px 20px; background: white;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${fullName},</h2>
        <p style="color: #475569; line-height: 1.6;">We received a request to reset your password. Use the code below:</p>
        <div style="background: #f1f5f9; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${code}</span>
        </div>
        <p style="color: #475569; line-height: 1.6;">This code expires in <strong>15 minutes</strong>.</p>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Didn't request this?</strong><br/>
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
        <p style="color: #1e293b; margin-top: 30px;">
          Stay secure,<br/>
          <strong>The HomeLedger Team</strong>
        </p>
      </div>
      <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} HomeLedger</p>
      </div>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a reset code has been sent.',
      });
    }

    // Generate 6-digit code
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any existing unused reset tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: code,
        expiresAt,
      },
    });

    // Send reset email
    const emailHtml = generateResetEmailHtml(user.fullName, code);
    await sendNotificationEmail({
      notificationId: process.env.NOTIF_ID_LOGIN_SECURITY_ALERT || '',
      recipientEmail: user.email,
      subject: `🔑 Your HomeLedger password reset code: ${code}`,
      body: emailHtml,
      isHtml: true,
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset code has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
