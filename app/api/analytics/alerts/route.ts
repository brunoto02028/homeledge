import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST — Report a screenshot/recording/devtools alert
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { alertType, method, page, keyCombo, viewport, metadata } = body;

    if (!alertType || !page) {
      return NextResponse.json({ error: 'alertType and page required' }, { status: 400 });
    }

    const alert = await (prisma as any).screenshotAlert.create({
      data: {
        userId,
        sessionId: body.sessionId || null,
        alertType,
        method: method || null,
        page,
        keyCombo: keyCombo || null,
        viewport: viewport || null,
        userAgent: req.headers.get('user-agent') || null,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        metadata: metadata || null,
      },
    });

    console.log(`[ALERT] ${alertType} detected — user:${userId} page:${page} method:${method || 'unknown'}`);
    return NextResponse.json({ success: true, alertId: alert.id });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Analytics Alerts]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — Admin: list all alerts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const alertType = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const where: any = {};
    if (userId) where.userId = userId;
    if (alertType) where.alertType = alertType;

    const alerts = await (prisma as any).screenshotAlert.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Summary counts
    const counts = await (prisma as any).screenshotAlert.groupBy({
      by: ['alertType'],
      _count: { id: true },
      ...(userId ? { where: { userId } } : {}),
    });

    return NextResponse.json({ alerts, summary: counts });
  } catch (err: any) {
    console.error('[Analytics Alerts GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
