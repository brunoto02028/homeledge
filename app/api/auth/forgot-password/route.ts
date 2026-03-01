import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email';

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

    // Check if email is configured before proceeding
    if (!isEmailConfigured()) {
      console.error('[Forgot Password] Email service not configured — cannot send reset code');
      return NextResponse.json({
        error: 'Email service is temporarily unavailable. Please contact support or try again later.',
      }, { status: 503 });
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
    const emailResult = await sendPasswordResetEmail(user.email, user.fullName, code);

    if (!emailResult.success) {
      console.error('[Forgot Password] Email delivery failed for', user.email, emailResult);
      // Invalidate the code since email didn't send
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, token: code },
        data: { usedAt: new Date() },
      });
      return NextResponse.json({
        error: 'Failed to send reset code. Please try again later.',
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset code has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({
      error: 'An error occurred. Please try again later.',
    }, { status: 500 });
  }
}
