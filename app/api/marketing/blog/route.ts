import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function estimateReadingMins(content: string) {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// GET - list all posts (admin)
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) where.OR = [
      { titleEn: { contains: search, mode: 'insensitive' } },
      { titlePt: { contains: search, mode: 'insensitive' } },
    ];

    const [posts, total] = await Promise.all([
      (prisma as any).blogPost.findMany({
        where,
        include: {
          category: true,
          tags: { include: { tag: true } },
          author: { select: { id: true, fullName: true, email: true } },
          _count: { select: { creatives: true, socialPosts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Blog GET]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - create post
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
      titleEn, titlePt, slug: rawSlug, excerptEn, excerptPt,
      contentEn, contentPt, coverImage, metaTitleEn, metaTitlePt,
      metaDescEn, metaDescPt, keywords, status, publishedAt,
      scheduledAt, categoryId, tagIds,
    } = body;

    if (!titleEn || !contentEn) {
      return NextResponse.json({ error: 'titleEn and contentEn are required' }, { status: 400 });
    }

    const slug = rawSlug ? slugify(rawSlug) : slugify(titleEn);
    const readingMins = estimateReadingMins(contentEn);

    const post = await (prisma as any).blogPost.create({
      data: {
        titleEn, titlePt, slug, excerptEn, excerptPt,
        contentEn, contentPt, coverImage,
        metaTitleEn, metaTitlePt, metaDescEn, metaDescPt,
        keywords: keywords || [],
        status: status || 'draft',
        publishedAt: publishedAt ? new Date(publishedAt) : (status === 'published' ? new Date() : null),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        readingMins,
        categoryId: categoryId || null,
        authorId: userId,
        tags: tagIds?.length ? {
          create: tagIds.map((tagId: string) => ({ tagId })),
        } : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
        author: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    console.error('[Blog POST]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
