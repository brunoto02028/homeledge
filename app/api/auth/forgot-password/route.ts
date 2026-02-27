import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!email.includes('@') || email.length < 5) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
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
    await sendPasswordResetEmail(user.email, user.fullName, code);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset code has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset code has been sent.',
    });
  }
}
