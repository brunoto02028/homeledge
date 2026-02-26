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
    await sendVerificationCodeEmail(user.email, user.fullName, code);

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
