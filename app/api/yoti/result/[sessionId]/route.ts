import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { getSessionResult } from '@/lib/yoti-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { sessionId } = await params;

    // Find the identity check
    const check = await (prisma as any).identityCheck.findFirst({
      where: { sessionId, userId },
    });

    if (!check) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // If already completed, return cached result
    if (check.status === 'completed' || check.status === 'failed') {
      return NextResponse.json({
        status: check.status,
        result: check.result,
        completedAt: check.completedAt,
      });
    }

    // Poll Yoti for latest result
    const result = await getSessionResult(sessionId);

    const newStatus = result.state === 'COMPLETED'
      ? (result.passed ? 'completed' : 'failed')
      : result.state === 'EXPIRED' ? 'expired' : 'pending';

    // Update check
    await (prisma as any).identityCheck.update({
      where: { id: check.id },
      data: {
        status: newStatus,
        result: result as any,
        ...(newStatus !== 'pending' && { completedAt: new Date() }),
      },
    });

    // If completed, update user
    if (newStatus === 'completed') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          idVerified: true,
          idVerifiedAt: new Date(),
          idVerificationData: result as any,
        } as any,
      });
    }

    return NextResponse.json({
      status: newStatus,
      result,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Yoti] Get result error:', error);
    return NextResponse.json({ error: 'Failed to get result' }, { status: 500 });
  }
}
