import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const [creatives, total] = await Promise.all([
      (prisma as any).marketingCreative.findMany({
        include: { blogPost: { select: { titleEn: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).marketingCreative.count(),
    ]);

    return NextResponse.json({ creatives, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, type, imageUrl, captionEn, captionPt, hashtags, prompt, blogPostId, status } = await req.json();
    if (!title || !type) return NextResponse.json({ error: 'title and type required' }, { status: 400 });

    const creative = await (prisma as any).marketingCreative.create({
      data: {
        title, type, imageUrl, captionEn, captionPt,
        hashtags: hashtags || [],
        prompt, blogPostId: blogPostId || null,
        status: status || 'draft',
      },
    });
    return NextResponse.json(creative, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
