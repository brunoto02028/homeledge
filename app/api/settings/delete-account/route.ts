import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sensitiveLimiter, getClientIp } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/settings/delete-account
 * GDPR Article 17 — Right to Erasure
 *
 * Permanently deletes the user account and ALL associated data.
 * Requires password confirmation for safety.
 */
export async function DELETE(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = sensitiveLimiter.check(`delete-account:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const userId = await requireUserId();
    const body = await request.json();
    const { password, confirmation } = body;

    // Require explicit confirmation text
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please type "DELETE MY ACCOUNT" to confirm.' },
        { status: 400 }
      );
    }

    // Verify password
    if (!password) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Block admin self-deletion for safety
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be self-deleted. Please contact another admin.' },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
    }

    // Audit trail before deletion
    await auditLog(userId, 'auth.account_deleted', 'user', userId, {
      ip: getClientIp(request),
      metadata: { email: user.email, reason: 'gdpr_right_to_erasure' },
    });

    // Delete user — Prisma cascades will delete all related records
    await prisma.user.delete({ where: { id: userId } });

    console.log(`[GDPR] Account deleted: userId=${userId}, email=${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[GDPR Delete] Error:', error);
    return NextResponse.json({ error: 'Failed to delete account. Please contact support.' }, { status: 500 });
  }
}
