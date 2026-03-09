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

// GET single post
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const post = await (prisma as any).blogPost.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        author: { select: { id: true, fullName: true, email: true } },
        creatives: true,
        socialPosts: { include: { socialAccount: true } },
      },
    });

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PUT - update post
export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

    const existing = await (prisma as any).blogPost.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updateData: any = {};
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (titlePt !== undefined) updateData.titlePt = titlePt;
    if (rawSlug !== undefined) updateData.slug = slugify(rawSlug);
    if (excerptEn !== undefined) updateData.excerptEn = excerptEn;
    if (excerptPt !== undefined) updateData.excerptPt = excerptPt;
    if (contentEn !== undefined) { updateData.contentEn = contentEn; updateData.readingMins = estimateReadingMins(contentEn); }
    if (contentPt !== undefined) updateData.contentPt = contentPt;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (metaTitleEn !== undefined) updateData.metaTitleEn = metaTitleEn;
    if (metaTitlePt !== undefined) updateData.metaTitlePt = metaTitlePt;
    if (metaDescEn !== undefined) updateData.metaDescEn = metaDescEn;
    if (metaDescPt !== undefined) updateData.metaDescPt = metaDescPt;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
      }
    }
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;

    // Update tags
    if (tagIds !== undefined) {
      await (prisma as any).blogPostTag.deleteMany({ where: { postId: params.id } });
      if (tagIds.length > 0) {
        await (prisma as any).blogPostTag.createMany({
          data: tagIds.map((tagId: string) => ({ postId: params.id, tagId })),
        });
      }
    }

    const post = await (prisma as any).blogPost.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        tags: { include: { tag: true } },
        author: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    console.error('[Blog PUT]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE post
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await (prisma as any).blogPost.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
