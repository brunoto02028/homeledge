import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

// POST /api/analytics — Receive batched analytics events
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { events } = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'events array required' }, { status: 400 });
    }

    // Limit batch size to prevent abuse
    const batch = events.slice(0, 50);

    const data = batch.map((e: any) => ({
      userId: userId || null,
      sessionId: String(e.sessionId || 'unknown'),
      eventType: String(e.eventType || 'unknown'),
      page: String(e.page || '/'),
      x: e.x != null ? Number(e.x) : null,
      y: e.y != null ? Number(e.y) : null,
      elementTag: e.elementTag ? String(e.elementTag).slice(0, 50) : null,
      elementText: e.elementText ? String(e.elementText).slice(0, 200) : null,
      elementId: e.elementId ? String(e.elementId).slice(0, 100) : null,
      viewport: e.viewport ? String(e.viewport).slice(0, 20) : null,
      duration: e.duration != null ? Math.round(Number(e.duration)) : null,
      scrollDepth: e.scrollDepth != null ? Math.min(100, Math.max(0, Math.round(Number(e.scrollDepth)))) : null,
      referrer: e.referrer ? String(e.referrer).slice(0, 500) : null,
      userAgent: e.userAgent ? String(e.userAgent).slice(0, 500) : null,
      metadata: e.metadata || null,
    }));

    await (prisma as any).analyticsEvent.createMany({ data });

    return NextResponse.json({ ok: true, count: data.length });
  } catch (error: any) {
    console.error('[Analytics] Error:', error.message);
    return NextResponse.json({ error: 'Failed to store events' }, { status: 500 });
  }
}

// GET /api/analytics — Admin-only: query analytics data
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || null; // filter by page
    const eventType = searchParams.get('eventType') || null;
    const days = parseInt(searchParams.get('days') || '7');
    const targetUserId = searchParams.get('userId') || null;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = { createdAt: { gte: since } };
    if (page) where.page = page;
    if (eventType) where.eventType = eventType;
    if (targetUserId) where.userId = targetUserId;

    // Summary stats
    const [
      totalEvents,
      uniqueSessions,
      pageViews,
      clicks,
      activeUsers,
    ] = await Promise.all([
      (prisma as any).analyticsEvent.count({ where }),
      (prisma as any).analyticsEvent.groupBy({ by: ['sessionId'], where }).then((r: any[]) => r.length),
      (prisma as any).analyticsEvent.count({ where: { ...where, eventType: 'page_view' } }),
      (prisma as any).analyticsEvent.count({ where: { ...where, eventType: 'click' } }),
      (prisma as any).analyticsEvent.groupBy({ by: ['userId'], where: { ...where, userId: { not: null } } }).then((r: any[]) => r.length),
    ]);

    // Top pages
    const topPages = await (prisma as any).analyticsEvent.groupBy({
      by: ['page'],
      where: { ...where, eventType: 'page_view' },
      _count: { page: true },
      orderBy: { _count: { page: 'desc' } },
      take: 20,
    });

    // Heatmap data (clicks with x,y coordinates)
    const heatmapFilter = { ...where, eventType: 'click', x: { not: null }, y: { not: null } };
    if (page) heatmapFilter.page = page;
    const heatmapData = await (prisma as any).analyticsEvent.findMany({
      where: heatmapFilter,
      select: { x: true, y: true, page: true, elementTag: true, elementText: true, elementId: true },
      take: 5000,
      orderBy: { createdAt: 'desc' },
    });

    // Average session duration
    const sessionDurations = await (prisma as any).analyticsEvent.groupBy({
      by: ['sessionId'],
      where: { ...where, duration: { not: null } },
      _sum: { duration: true },
    });
    const avgDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((sum: number, s: any) => sum + (s._sum.duration || 0), 0) / sessionDurations.length)
      : 0;

    // Average scroll depth per page
    const scrollDepths = await (prisma as any).analyticsEvent.groupBy({
      by: ['page'],
      where: { ...where, scrollDepth: { not: null } },
      _avg: { scrollDepth: true },
      orderBy: { _avg: { scrollDepth: 'desc' } },
      take: 20,
    });

    // Daily activity (for chart)
    const dailyActivity = await (prisma as any).analyticsEvent.groupBy({
      by: ['createdAt'],
      where,
      _count: { id: true },
    });
    // Aggregate by date
    const dailyMap: Record<string, number> = {};
    for (const d of dailyActivity) {
      const date = new Date(d.createdAt).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + d._count.id;
    }
    const daily = Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));

    // Recent sessions with user info
    const recentSessions = await (prisma as any).analyticsEvent.findMany({
      where: { ...where, eventType: 'session_start' },
      select: {
        sessionId: true,
        userId: true,
        page: true,
        viewport: true,
        userAgent: true,
        createdAt: true,
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      summary: {
        totalEvents,
        uniqueSessions,
        pageViews,
        clicks,
        activeUsers,
        avgDuration,
        days,
      },
      topPages: topPages.map((p: any) => ({ page: p.page, count: p._count.page })),
      heatmapData,
      scrollDepths: scrollDepths.map((s: any) => ({ page: s.page, avgDepth: Math.round(s._avg.scrollDepth) })),
      daily,
      recentSessions: recentSessions.map((s: any) => ({
        sessionId: s.sessionId,
        user: s.user?.fullName || s.user?.email || 'Anonymous',
        userId: s.userId,
        viewport: s.viewport,
        userAgent: s.userAgent,
        startedAt: s.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[Analytics GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
