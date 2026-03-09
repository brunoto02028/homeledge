import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getCurrentUserId } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST — Create or update a session recording
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { action, sessionToken, events, deviceInfo, stats } = body;

    if (action === 'start') {
      // Start a new session
      const session = await (prisma as any).userSession.create({
        data: {
          userId,
          sessionToken: sessionToken || `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          userAgent: deviceInfo?.userAgent,
          viewport: deviceInfo?.viewport,
          device: deviceInfo?.device,
          browser: deviceInfo?.browser,
          os: deviceInfo?.os,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        },
      });
      return NextResponse.json({ success: true, sessionId: session.id, sessionToken: session.sessionToken });
    }

    if (action === 'append' && sessionToken) {
      // Append recording events to existing session
      const existing = await (prisma as any).userSession.findUnique({ where: { sessionToken } });
      if (!existing || existing.userId !== userId) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const existingData = (existing.recordingData as any[]) || [];
      const merged = [...existingData, ...(events || [])];
      const jsonSize = JSON.stringify(merged).length;

      // Cap at 10MB per session to prevent DB bloat
      if (jsonSize > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Session recording too large' }, { status: 413 });
      }

      await (prisma as any).userSession.update({
        where: { sessionToken },
        data: {
          recordingData: merged,
          recordingSize: jsonSize,
          hasRecording: true,
          pagesVisited: stats?.pagesVisited ?? existing.pagesVisited,
          clickCount: stats?.clickCount ?? existing.clickCount,
          scrollEvents: stats?.scrollEvents ?? existing.scrollEvents,
        },
      });
      return NextResponse.json({ success: true, eventsStored: merged.length });
    }

    if (action === 'end' && sessionToken) {
      // End session
      const existing = await (prisma as any).userSession.findUnique({ where: { sessionToken } });
      if (!existing || existing.userId !== userId) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const now = new Date();
      const duration = Math.round((now.getTime() - new Date(existing.startedAt).getTime()) / 1000);

      await (prisma as any).userSession.update({
        where: { sessionToken },
        data: {
          endedAt: now,
          duration,
          isActive: false,
          pagesVisited: stats?.pagesVisited ?? existing.pagesVisited,
          clickCount: stats?.clickCount ?? existing.clickCount,
          scrollEvents: stats?.scrollEvents ?? existing.scrollEvents,
        },
      });
      return NextResponse.json({ success: true, duration });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Analytics Sessions]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — Admin: list all sessions (with optional userId filter)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const includeRecording = url.searchParams.get('recording') === 'true';

    const where: any = {};
    if (userId) where.userId = userId;

    const sessions = await (prisma as any).userSession.findMany({
      where,
      select: {
        id: true,
        userId: true,
        sessionToken: true,
        startedAt: true,
        endedAt: true,
        duration: true,
        userAgent: true,
        viewport: true,
        device: true,
        browser: true,
        os: true,
        pagesVisited: true,
        clickCount: true,
        scrollEvents: true,
        hasRecording: true,
        recordingSize: true,
        isActive: true,
        ...(includeRecording ? { recordingData: true } : {}),
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ sessions });
  } catch (err: any) {
    console.error('[Analytics Sessions GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
