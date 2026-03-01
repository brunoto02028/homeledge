import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendVerificationCodeEmail } from '@/lib/email';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!email.includes('@') || email.length < 5) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
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

    // If no email provider is properly configured, skip OTP and allow direct login
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    const resendConfigured = !!process.env.RESEND_API_KEY;
    if (!smtpConfigured && !resendConfigured) {
      console.log(`[Login Code] No email provider configured — bypassing 2FA for ${user.email}`);
      return NextResponse.json({
        success: true,
        skipOtp: true,
        message: 'No email provider configured — logging in directly',
      });
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
    const emailResult = await sendVerificationCodeEmail(user.email, user.fullName, code);

    if (!emailResult.success) {
      console.error('[Login Code] Email delivery failed for', user.email, emailResult);
      // Invalidate the code we just created
      try {
        await prisma.emailVerificationToken.updateMany({
          where: { userId: user.id, token: code },
          data: { usedAt: new Date() },
        });
      } catch (cleanupError) {
        console.error('[Login Code] Failed to cleanup verification code:', cleanupError);
      }
      // FALLBACK: If email sending fails, bypass 2FA instead of blocking login
      console.log(`[Login Code] Email failed — falling back to bypass for ${user.email}`);
      return NextResponse.json({
        success: true,
        skipOtp: true,
        message: 'Email delivery failed — logging in directly',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      maskedEmail: maskEmail(user.email),
    });
  } catch (error: any) {
    console.error('Send login code error:', error);
    // Don't expose internal error details to client
    return NextResponse.json({ 
      error: error.message === 'UNAUTHORIZED' ? 'Unauthorized' : 'Internal server error' 
    }, { status: error.message === 'UNAUTHORIZED' ? 401 : 500 });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.length > 2
    ? local[0] + '•'.repeat(local.length - 2) + local[local.length - 1]
    : local[0] + '•';
  return `${masked}@${domain}`;
}
