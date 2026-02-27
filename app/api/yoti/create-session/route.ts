import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { createIdvSession } from '@/lib/yoti-client';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const userId = await requireUserId();

    // Check if user already has a pending or completed verification
    const existing = await (prisma as any).identityCheck.findFirst({
      where: {
        userId,
        type: 'idv',
        status: { in: ['pending', 'completed'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing?.status === 'completed') {
      return NextResponse.json({ error: 'Identity already verified' }, { status: 400 });
    }

    // If there's a pending session less than 30 min old, return it
    if (existing?.status === 'pending' && existing.sessionId) {
      const age = Date.now() - new Date(existing.createdAt).getTime();
      if (age < 30 * 60 * 1000) {
        return NextResponse.json({
          sessionId: existing.sessionId,
          iframeUrl: (existing.result as any)?.iframeUrl || '',
          existing: true,
        });
      }
      // Mark old session as expired
      await (prisma as any).identityCheck.update({
        where: { id: existing.id },
        data: { status: 'expired' },
      });
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL}/verify-identity/callback`;

    const session = await createIdvSession({
      callbackUrl,
    });

    // Save to DB
    await (prisma as any).identityCheck.create({
      data: {
        userId,
        type: 'idv',
        provider: 'yoti',
        sessionId: session.sessionId,
        status: 'pending',
        result: {
          iframeUrl: session.iframeUrl,
          clientSessionToken: session.clientSessionToken,
        } as any,
      },
    });

    // Update user with verification session ID
    await prisma.user.update({
      where: { id: userId },
      data: { idVerificationId: session.sessionId } as any,
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      iframeUrl: session.iframeUrl,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Yoti] Create session error:', error);
    return NextResponse.json({ error: 'Failed to create verification session' }, { status: 500 });
  }
}
