import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [totalPosts, publishedPosts, totalLeads, hotLeads, sentCampaigns, totalCreatives] = await Promise.all([
      (prisma as any).blogPost.count(),
      (prisma as any).blogPost.count({ where: { status: 'published' } }),
      (prisma as any).lead.count(),
      (prisma as any).lead.count({ where: { tag: 'hot' } }),
      (prisma as any).emailCampaign.count({ where: { status: 'sent' } }),
      (prisma as any).marketingCreative.count(),
    ]);

    return NextResponse.json({ totalPosts, publishedPosts, totalLeads, hotLeads, sentCampaigns, totalCreatives });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
