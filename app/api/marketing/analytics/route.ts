import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPosts, publishedPosts, totalLeads, hotLeads,
      sentCampaigns, totalCreatives,
      leadsByTagRaw, leadsBySourceRaw, recentLeadsRaw, topPosts,
    ] = await Promise.all([
      (prisma as any).blogPost.count(),
      (prisma as any).blogPost.count({ where: { status: 'published' } }),
      (prisma as any).lead.count(),
      (prisma as any).lead.count({ where: { tag: 'hot' } }),
      (prisma as any).emailCampaign.count({ where: { status: 'sent' } }),
      (prisma as any).marketingCreative.count(),
      (prisma as any).lead.groupBy({ by: ['tag'], _count: { id: true } }),
      (prisma as any).lead.groupBy({ by: ['source'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 6 }),
      // Recent leads — last 30 days grouped by day
      (prisma as any).$queryRaw`
        SELECT DATE(created_at)::text as date, COUNT(*)::int as count
        FROM leads
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      (prisma as any).blogPost.findMany({
        where: { status: 'published' },
        select: { titleEn: true, viewCount: true, slug: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalPosts,
      publishedPosts,
      totalLeads,
      hotLeads,
      sentCampaigns,
      totalCreatives,
      leadsByTag: leadsByTagRaw.map((r: any) => ({ tag: r.tag, count: r._count.id })),
      leadsBySource: leadsBySourceRaw.map((r: any) => ({ source: r.source || 'direct', count: r._count.id })),
      recentLeads: (recentLeadsRaw as any[]).map((r: any) => ({
        date: new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        count: r.count,
      })),
      topPosts: topPosts.map((p: any) => ({ title: p.titleEn, views: p.viewCount, slug: p.slug })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Analytics]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
