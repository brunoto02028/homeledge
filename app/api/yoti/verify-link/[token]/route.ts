import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createIdvSession, getSessionResult } from '@/lib/yoti-client';

export const dynamic = 'force-dynamic';

// GET - Get verification link info (public - no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const link = await (prisma as any).verificationLink.findUnique({
      where: { token },
    });

    if (!link) {
      return NextResponse.json({ error: 'Verification link not found' }, { status: 404 });
    }

    if (new Date() > new Date(link.expiresAt)) {
      return NextResponse.json({ error: 'Verification link has expired', expired: true }, { status: 410 });
    }

    return NextResponse.json({
      clientName: link.clientName,
      companyName: link.companyName,
      status: link.status,
      result: link.status === 'completed' ? link.result : null,
    });
  } catch (error: any) {
    console.error('[Verify Link] GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - Start verification for this link (public - no auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const link = await (prisma as any).verificationLink.findUnique({
      where: { token },
    });

    if (!link) {
      return NextResponse.json({ error: 'Verification link not found' }, { status: 404 });
    }

    if (new Date() > new Date(link.expiresAt)) {
      return NextResponse.json({ error: 'Verification link has expired' }, { status: 410 });
    }

    if (link.status === 'completed') {
      return NextResponse.json({ error: 'Already verified', status: 'completed' }, { status: 400 });
    }

    // If session already started and recent, return existing
    if (link.sessionId && link.status === 'started') {
      const result = await getSessionResult(link.sessionId);
      if (result.state === 'COMPLETED') {
        await (prisma as any).verificationLink.update({
          where: { id: link.id },
          data: {
            status: result.passed ? 'completed' : 'failed',
            result: result as any,
            completedAt: new Date(),
          },
        });
        return NextResponse.json({ status: result.passed ? 'completed' : 'failed', result });
      }
      return NextResponse.json({
        sessionId: link.sessionId,
        status: 'started',
        iframeUrl: (link.result as any)?.iframeUrl,
      });
    }

    // Create new Yoti session
    const baseUrl = process.env.NEXTAUTH_URL || 'https://homeledger.co.uk';
    const session = await createIdvSession({
      callbackUrl: `${baseUrl}/verify/${token}?status=callback`,
    });

    await (prisma as any).verificationLink.update({
      where: { id: link.id },
      data: {
        sessionId: session.sessionId,
        status: 'started',
        result: { iframeUrl: session.iframeUrl } as any,
      },
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      iframeUrl: session.iframeUrl,
      status: 'started',
    });
  } catch (error: any) {
    console.error('[Verify Link] POST error:', error);
    return NextResponse.json({ error: 'Failed to start verification' }, { status: 500 });
  }
}
