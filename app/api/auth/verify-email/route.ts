import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

// POST /api/auth/verify-email — Verify email with 6-digit code
export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified && user.status === 'active') {
      return NextResponse.json({ success: true, message: 'Email already verified' });
    }

    // Find valid verification token
    const validToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!validToken) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Mark token as used and activate user
    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: validToken.id },
        data: { usedAt: new Date() },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          status: 'active',
        },
      });

      await tx.event.create({
        data: {
          userId: user.id,
          eventType: 'user.email_verified',
          entityType: 'User',
          entityId: user.id,
          payload: { email: user.email },
        },
      });
    });

    // Send welcome email now that user is verified
    try {
      await sendWelcomeEmail(user.email, user.fullName);
    } catch { /* non-critical */ }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.',
    });
  } catch (error: any) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
