import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendNotificationEmail } from '@/lib/notifications';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateOTPEmailHtml(fullName: string, code: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Login Verification</h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0;">HomeLedger Security</p>
      </div>
      <div style="padding: 30px 20px; background: white;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${fullName},</h2>
        <p style="color: #475569; line-height: 1.6;">Your login verification code is:</p>
        <div style="background: #f1f5f9; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${code}</span>
        </div>
        <p style="color: #475569; line-height: 1.6;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #1e293b; margin-top: 30px;">
          Stay secure,<br/>
          <strong>The HomeLedger Team</strong>
        </p>
      </div>
      <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">If you didn't request this code, please ignore this email.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} HomeLedger</p>
      </div>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 });
    }

    if (user.status === 'pending_verification' || !user.emailVerified) {
      return NextResponse.json({
        error: 'Please verify your email first.',
        requiresVerification: true,
        email: user.email,
      }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate 6-digit OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused codes for this user
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create new verification code
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: code,
        expiresAt,
      },
    });

    // Send OTP email
    const emailHtml = generateOTPEmailHtml(user.fullName, code);
    await sendNotificationEmail({
      notificationId: process.env.NOTIF_ID_LOGIN_SECURITY_ALERT || '',
      recipientEmail: user.email,
      subject: `🔐 Your HomeLedger login code: ${code}`,
      body: emailHtml,
      isHtml: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      maskedEmail: maskEmail(user.email),
    });
  } catch (error) {
    console.error('Send login code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.length > 2
    ? local[0] + '•'.repeat(local.length - 2) + local[local.length - 1]
    : local[0] + '•';
  return `${masked}@${domain}`;
}
