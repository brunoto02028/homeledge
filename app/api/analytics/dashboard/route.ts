import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    const path = url.searchParams.get('path') || null;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Total unique visitors
    const totalVisitors = await (prisma as any).siteVisitor.count({
      where: { lastSeen: { gte: since } },
    });

    // Total page views
    const totalPageViews = await (prisma as any).sitePageView.count({
      where: { enteredAt: { gte: since }, ...(path ? { path } : {}) },
    });

    // Total events
    const totalEvents = await (prisma as any).siteEvent.count({
      where: { createdAt: { gte: since }, ...(path ? { path } : {}) },
    });

    // Page views by path (top pages)
    const topPages = await (prisma as any).sitePageView.groupBy({
      by: ['path'],
      where: { enteredAt: { gte: since } },
      _count: { id: true },
      _avg: { timeOnPage: true, scrollDepth: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    // Daily visitors trend
    const dailyPageViews = await (prisma as any).$queryRawUnsafe(`
      SELECT DATE(entered_at) as date, COUNT(*) as views, COUNT(DISTINCT visitor_id) as unique_visitors
      FROM site_page_views
      WHERE entered_at >= $1
      ${path ? `AND path = '${path}'` : ''}
      GROUP BY DATE(entered_at)
      ORDER BY date ASC
    `, since);

    // Device breakdown
    const devices = await (prisma as any).siteVisitor.groupBy({
      by: ['device'],
      where: { lastSeen: { gte: since } },
      _count: { id: true },
    });

    // Browser breakdown
    const browsers = await (prisma as any).siteVisitor.groupBy({
      by: ['browser'],
      where: { lastSeen: { gte: since } },
      _count: { id: true },
    });

    // Referrer breakdown
    const referrers = await (prisma as any).siteVisitor.groupBy({
      by: ['referrer'],
      where: { lastSeen: { gte: since }, referrer: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Click heatmap data (x, y coordinates for a specific path)
    const heatmapPath = path || '/';
    const clickEvents = await (prisma as any).siteEvent.findMany({
      where: {
        createdAt: { gte: since },
        path: heatmapPath,
        type: { in: ['click', 'cta_click', 'nav_click'] },
        x: { not: null },
        y: { not: null },
      },
      select: { x: true, y: true, type: true, target: true },
      take: 5000,
    });

    // Top clicked elements
    const topClicks = await (prisma as any).siteEvent.groupBy({
      by: ['target'],
      where: {
        createdAt: { gte: since },
        type: { in: ['click', 'cta_click', 'nav_click'] },
        target: { not: null },
        ...(path ? { path } : {}),
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    // Average time on page
    const avgTime = await (prisma as any).sitePageView.aggregate({
      where: { enteredAt: { gte: since }, timeOnPage: { not: null }, ...(path ? { path } : {}) },
      _avg: { timeOnPage: true, scrollDepth: true },
    });

    // Recent visitors (last 20)
    const recentVisitors = await (prisma as any).siteVisitor.findMany({
      where: { lastSeen: { gte: since } },
      orderBy: { lastSeen: 'desc' },
      take: 20,
      select: {
        id: true, ip: true, device: true, browser: true, os: true, referrer: true,
        firstSeen: true, lastSeen: true, totalVisits: true, country: true, city: true,
        _count: { select: { pageViews: true, events: true } },
      },
    });

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      overview: {
        totalVisitors,
        totalPageViews,
        totalEvents,
        avgTimeOnPage: Math.round(avgTime._avg?.timeOnPage || 0),
        avgScrollDepth: Math.round(avgTime._avg?.scrollDepth || 0),
      },
      topPages: topPages.map((p: any) => ({
        path: p.path,
        views: p._count.id,
        avgTime: Math.round(p._avg?.timeOnPage || 0),
        avgScroll: Math.round(p._avg?.scrollDepth || 0),
      })),
      dailyTrend: (dailyPageViews as any[]).map((d: any) => ({
        date: d.date,
        views: Number(d.views),
        uniqueVisitors: Number(d.unique_visitors),
      })),
      devices: devices.map((d: any) => ({ device: d.device || 'Unknown', count: d._count.id })),
      browsers: browsers.map((b: any) => ({ browser: b.browser || 'Unknown', count: b._count.id })),
      referrers: referrers.map((r: any) => ({ referrer: r.referrer, count: r._count.id })),
      heatmap: { path: heatmapPath, clicks: clickEvents },
      topClicks: topClicks.map((c: any) => ({ target: c.target, count: c._count.id })),
      recentVisitors,
    });
  } catch (error: any) {
    console.error('[Analytics Dashboard]', error?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
