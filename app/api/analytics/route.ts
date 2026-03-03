import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}

// POST /api/analytics — Receive batched analytics events
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const ip = getClientIp(req);
    const { events } = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'events array required' }, { status: 400 });
    }

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
      ipAddress: ip,
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

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || null;
    const eventType = searchParams.get('eventType') || null;
    const days = parseInt(searchParams.get('days') || '7');
    const targetUserId = searchParams.get('userId') || null;
    const view = searchParams.get('view') || 'overview'; // overview | users | user-detail

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = { createdAt: { gte: since } };
    if (page) where.page = page;
    if (eventType) where.eventType = eventType;
    if (targetUserId) where.userId = targetUserId;

    // ===== VIEW: USER LIST =====
    if (view === 'users') {
      // Get all users with activity in the period
      const userGroups = await (prisma as any).analyticsEvent.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { id: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
      });

      const userIds = userGroups.map((g: any) => g.userId).filter(Boolean);
      const users = userIds.length > 0 ? await (prisma as any).user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true, email: true, plan: true, status: true, createdAt: true },
      }) : [];
      const userMap = Object.fromEntries(users.map((u: any) => [u.id, u]));

      // Get per-user stats in parallel
      const userStatsPromises = userGroups.map(async (g: any) => {
        const uid = g.userId;
        const uWhere = { ...where, userId: uid };
        const [pageViews, clicks, sessions, durations, ips] = await Promise.all([
          (prisma as any).analyticsEvent.count({ where: { ...uWhere, eventType: 'page_view' } }),
          (prisma as any).analyticsEvent.count({ where: { ...uWhere, eventType: 'click' } }),
          (prisma as any).analyticsEvent.groupBy({ by: ['sessionId'], where: uWhere }).then((r: any[]) => r.length),
          (prisma as any).analyticsEvent.groupBy({
            by: ['sessionId'], where: { ...uWhere, duration: { not: null } }, _sum: { duration: true },
          }),
          (prisma as any).analyticsEvent.groupBy({ by: ['ipAddress'], where: { ...uWhere, ipAddress: { not: null } } }),
        ]);
        const totalDuration = durations.reduce((s: number, d: any) => s + (d._sum.duration || 0), 0);
        const avgDuration = durations.length > 0 ? Math.round(totalDuration / durations.length) : 0;
        const dbUser = userMap[uid];
        return {
          userId: uid,
          name: dbUser?.fullName || 'Unknown',
          email: dbUser?.email || '',
          plan: dbUser?.plan || 'none',
          status: dbUser?.status || 'unknown',
          totalEvents: g._count.id,
          pageViews,
          clicks,
          sessions,
          avgDuration,
          totalDuration,
          ips: ips.map((ip: any) => ip.ipAddress),
          firstSeen: g._min.createdAt,
          lastSeen: g._max.createdAt,
        };
      });

      const userStats = await Promise.all(userStatsPromises);
      userStats.sort((a: any, b: any) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

      return NextResponse.json({ view: 'users', users: userStats, days });
    }

    // ===== VIEW: SINGLE USER DETAIL =====
    if (view === 'user-detail' && targetUserId) {
      const uWhere = { createdAt: { gte: since }, userId: targetUserId };
      const targetUser = await (prisma as any).user.findUnique({
        where: { id: targetUserId },
        select: { id: true, fullName: true, email: true, plan: true, status: true, createdAt: true },
      });

      // All events for this user
      const allEvents = await (prisma as any).analyticsEvent.findMany({
        where: uWhere,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, sessionId: true, eventType: true, page: true,
          x: true, y: true, elementTag: true, elementText: true, elementId: true,
          viewport: true, duration: true, scrollDepth: true, referrer: true,
          userAgent: true, ipAddress: true, createdAt: true,
        },
        take: 10000,
      });

      // Page breakdown
      const pageBreakdown: Record<string, { views: number; clicks: number; totalDuration: number; avgScroll: number; scrollCount: number }> = {};
      for (const ev of allEvents) {
        if (!pageBreakdown[ev.page]) pageBreakdown[ev.page] = { views: 0, clicks: 0, totalDuration: 0, avgScroll: 0, scrollCount: 0 };
        const pb = pageBreakdown[ev.page];
        if (ev.eventType === 'page_view') {
          pb.views++;
          if (ev.duration) pb.totalDuration += ev.duration;
          if (ev.scrollDepth != null) { pb.avgScroll += ev.scrollDepth; pb.scrollCount++; }
        }
        if (ev.eventType === 'click') pb.clicks++;
      }
      const pages = Object.entries(pageBreakdown)
        .map(([pg, d]) => ({
          page: pg, views: d.views, clicks: d.clicks,
          avgDuration: d.views > 0 ? Math.round(d.totalDuration / d.views) : 0,
          avgScroll: d.scrollCount > 0 ? Math.round(d.avgScroll / d.scrollCount) : 0,
        }))
        .sort((a, b) => b.views - a.views);

      // Session breakdown
      const sessionMap: Record<string, any[]> = {};
      for (const ev of allEvents) {
        if (!sessionMap[ev.sessionId]) sessionMap[ev.sessionId] = [];
        sessionMap[ev.sessionId].push(ev);
      }
      const sessions = Object.entries(sessionMap).map(([sid, evts]) => {
        const start = evts[0];
        const end = evts[evts.length - 1];
        const totalDuration = evts.filter((e: any) => e.duration).reduce((s: number, e: any) => s + e.duration, 0);
        const pagesVisited = [...new Set(evts.map((e: any) => e.page))];
        const clickCount = evts.filter((e: any) => e.eventType === 'click').length;
        const maxScroll = Math.max(...evts.filter((e: any) => e.scrollDepth != null).map((e: any) => e.scrollDepth), 0);
        return {
          sessionId: sid,
          startedAt: start.createdAt,
          endedAt: end.createdAt,
          duration: totalDuration,
          pagesVisited,
          pageCount: pagesVisited.length,
          clicks: clickCount,
          events: evts.length,
          maxScroll,
          viewport: start.viewport,
          userAgent: start.userAgent,
          ip: start.ipAddress,
        };
      }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      // Heatmap clicks for this user
      const heatmapClicks = allEvents
        .filter((e: any) => e.eventType === 'click' && e.x != null && e.y != null)
        .map((e: any) => ({ x: e.x, y: e.y, page: e.page, elementTag: e.elementTag, elementText: e.elementText, elementId: e.elementId }));

      // Navigation flow (page transitions)
      const navFlow: { from: string; to: string; count: number }[] = [];
      const navMap: Record<string, number> = {};
      for (const evts of Object.values(sessionMap)) {
        const pageViewEvents = evts.filter((e: any) => e.eventType === 'page_view');
        for (let i = 1; i < pageViewEvents.length; i++) {
          const from = pageViewEvents[i - 1].page;
          const to = pageViewEvents[i].page;
          if (from !== to) {
            const key = `${from}→${to}`;
            navMap[key] = (navMap[key] || 0) + 1;
          }
        }
      }
      for (const [key, count] of Object.entries(navMap)) {
        const [from, to] = key.split('→');
        navFlow.push({ from, to, count });
      }
      navFlow.sort((a, b) => b.count - a.count);

      // Activity timeline (events grouped by hour)
      const hourlyMap: Record<string, { views: number; clicks: number }> = {};
      for (const ev of allEvents) {
        const hour = new Date(ev.createdAt).toISOString().slice(0, 13) + ':00';
        if (!hourlyMap[hour]) hourlyMap[hour] = { views: 0, clicks: 0 };
        if (ev.eventType === 'page_view') hourlyMap[hour].views++;
        if (ev.eventType === 'click') hourlyMap[hour].clicks++;
      }
      const activityTimeline = Object.entries(hourlyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, d]) => ({ hour, ...d }));

      // IPs used
      const ips = [...new Set(allEvents.map((e: any) => e.ipAddress).filter(Boolean))];

      // Summary
      const totalClicks = allEvents.filter((e: any) => e.eventType === 'click').length;
      const totalPageViews = allEvents.filter((e: any) => e.eventType === 'page_view').length;
      const totalDuration = allEvents.filter((e: any) => e.duration).reduce((s: number, e: any) => s + e.duration, 0);

      return NextResponse.json({
        view: 'user-detail',
        user: targetUser,
        summary: {
          totalEvents: allEvents.length,
          pageViews: totalPageViews,
          clicks: totalClicks,
          sessions: sessions.length,
          totalDuration,
          avgSessionDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0,
          uniquePages: pages.length,
          ips,
        },
        pages,
        sessions,
        heatmapClicks,
        navFlow: navFlow.slice(0, 30),
        activityTimeline,
        days,
      });
    }

    // ===== VIEW: OVERVIEW (default) =====
    const [totalEvents, uniqueSessions, pageViews, clicks, activeUsers] = await Promise.all([
      (prisma as any).analyticsEvent.count({ where }),
      (prisma as any).analyticsEvent.groupBy({ by: ['sessionId'], where }).then((r: any[]) => r.length),
      (prisma as any).analyticsEvent.count({ where: { ...where, eventType: 'page_view' } }),
      (prisma as any).analyticsEvent.count({ where: { ...where, eventType: 'click' } }),
      (prisma as any).analyticsEvent.groupBy({ by: ['userId'], where: { ...where, userId: { not: null } } }).then((r: any[]) => r.length),
    ]);

    const topPages = await (prisma as any).analyticsEvent.groupBy({
      by: ['page'],
      where: { ...where, eventType: 'page_view' },
      _count: { page: true },
      orderBy: { _count: { page: 'desc' } },
      take: 20,
    });

    const heatmapFilter = { ...where, eventType: 'click', x: { not: null }, y: { not: null } };
    if (page) heatmapFilter.page = page;
    const heatmapData = await (prisma as any).analyticsEvent.findMany({
      where: heatmapFilter,
      select: { x: true, y: true, page: true, elementTag: true, elementText: true, elementId: true, userId: true },
      take: 5000,
      orderBy: { createdAt: 'desc' },
    });

    const sessionDurations = await (prisma as any).analyticsEvent.groupBy({
      by: ['sessionId'],
      where: { ...where, duration: { not: null } },
      _sum: { duration: true },
    });
    const avgDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((sum: number, s: any) => sum + (s._sum.duration || 0), 0) / sessionDurations.length)
      : 0;

    const scrollDepths = await (prisma as any).analyticsEvent.groupBy({
      by: ['page'],
      where: { ...where, scrollDepth: { not: null } },
      _avg: { scrollDepth: true },
      orderBy: { _avg: { scrollDepth: 'desc' } },
      take: 20,
    });

    const dailyActivity = await (prisma as any).analyticsEvent.groupBy({
      by: ['createdAt'], where, _count: { id: true },
    });
    const dailyMap: Record<string, number> = {};
    for (const d of dailyActivity) {
      const date = new Date(d.createdAt).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + d._count.id;
    }
    const daily = Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));

    const recentSessions = await (prisma as any).analyticsEvent.findMany({
      where: { ...where, eventType: 'session_start' },
      select: {
        sessionId: true, userId: true, page: true, viewport: true,
        userAgent: true, ipAddress: true, createdAt: true,
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      view: 'overview',
      summary: { totalEvents, uniqueSessions, pageViews, clicks, activeUsers, avgDuration, days },
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
        ip: s.ipAddress,
        startedAt: s.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[Analytics GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
