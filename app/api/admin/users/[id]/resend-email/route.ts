import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { sendAdminCreatedAccountEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'admin') throw new Error('FORBIDDEN');
  return userId;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, fullName: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a new temporary password
    const tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Update user's password and force change
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true } as any,
    });

    // Send the welcome email with new temp password
    const result = await sendAdminCreatedAccountEmail(
      user.email,
      user.fullName,
      user.role,
      tempPassword,
    );

    if (!result?.success) {
      return NextResponse.json({ error: 'Failed to send email. Check SMTP configuration.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Welcome email sent to ${user.email}` });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    console.error('[Resend Email] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to resend email' }, { status: 500 });
  }
}
