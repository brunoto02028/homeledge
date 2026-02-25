import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, code, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 });
    }

    // Find valid reset token
    const validToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!validToken) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: validToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Log event
    await prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'user.password_reset',
        entityType: 'User',
        entityId: user.id,
        payload: { email: user.email },
      },
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
