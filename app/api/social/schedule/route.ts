import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const platform = searchParams.get('platform');

  const posts = await prisma.socialPost.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(platform ? { platform } : {}),
    },
    include: { socialAccount: true, creative: true },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { socialAccountId, platform, caption, hashtags, mediaUrls, scheduledAt, postType, creativeId, blogPostId } = body;

  if (!socialAccountId || !platform || !caption) {
    return NextResponse.json({ error: 'socialAccountId, platform and caption are required' }, { status: 400 });
  }

  const post = await prisma.socialPost.create({
    data: {
      socialAccountId,
      platform,
      caption,
      hashtags: hashtags || [],
      mediaUrls: mediaUrls || [],
      postType: postType || 'feed',
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      creativeId: creativeId || null,
      blogPostId: blogPostId || null,
    },
    include: { socialAccount: true },
  });

  return NextResponse.json({ post });
}
