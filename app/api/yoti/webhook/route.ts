import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionResult } from '@/lib/yoti-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Verify webhook auth token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.YOTI_WEBHOOK_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.error('[Yoti Webhook] Invalid auth token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, topic } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    console.log(`[Yoti Webhook] Received ${topic} for session ${session_id}`);

    // Only process session completion
    if (topic !== 'SESSION_COMPLETION' && topic !== 'CHECK_COMPLETION') {
      return NextResponse.json({ received: true });
    }

    // Get full result from Yoti
    const result = await getSessionResult(session_id);

    // Find the identity check record
    const check = await (prisma as any).identityCheck.findFirst({
      where: { sessionId: session_id },
    });

    if (!check) {
      console.error(`[Yoti Webhook] No identity check found for session ${session_id}`);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Determine if all checks passed
    const newStatus = result.state === 'COMPLETED'
      ? (result.passed ? 'completed' : 'failed')
      : result.state === 'EXPIRED' ? 'expired' : 'pending';

    // Update identity check
    await (prisma as any).identityCheck.update({
      where: { id: check.id },
      data: {
        status: newStatus,
        result: result as any,
        completedAt: newStatus !== 'pending' ? new Date() : null,
      },
    });

    // If verification passed, update user
    if (newStatus === 'completed') {
      await prisma.user.update({
        where: { id: check.userId },
        data: {
          idVerified: true,
          idVerifiedAt: new Date(),
          idVerificationData: result as any,
        } as any,
      });

      console.log(`[Yoti Webhook] User ${check.userId} identity verified successfully`);

      // Log event
      await (prisma as any).event.create({
        data: {
          userId: check.userId,
          type: 'identity_verified',
          description: 'Identity verification completed via Yoti',
          metadata: {
            sessionId: session_id,
            documentType: result.userProfile?.documentType,
            documentCountry: result.userProfile?.documentCountry,
          },
        },
      });
    }

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error: any) {
    console.error('[Yoti Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
