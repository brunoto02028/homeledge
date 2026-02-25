import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { isMockMode, completeMockSession, getSessionResult } from '@/lib/yoti-client';

export const dynamic = 'force-dynamic';

// POST - Simulate completing a mock verification session
export async function POST(request: Request) {
  try {
    if (!isMockMode()) {
      return NextResponse.json({ error: 'Not available in production mode' }, { status: 400 });
    }

    const userId = await requireUserId();
    const { sessionId } = await request.json();

    if (!sessionId || !completeMockSession(sessionId)) {
      return NextResponse.json({ error: 'Invalid mock session' }, { status: 400 });
    }

    // Get mock result
    const result = await getSessionResult(sessionId);

    // Update identity check
    await (prisma as any).identityCheck.updateMany({
      where: { sessionId, userId },
      data: {
        status: 'completed',
        result: result as any,
        completedAt: new Date(),
      },
    });

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        idVerified: true,
        idVerifiedAt: new Date(),
        idVerificationData: result as any,
      } as any,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Yoti Mock] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
