import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function publishToInstagram(
  igAccountId: string,
  pageAccessToken: string,
  mediaUrls: string[],
  caption: string,
  postType: string
): Promise<string> {
  const baseUrl = 'https://graph.facebook.com/v21.0';

  if (postType === 'carousel' && mediaUrls.length > 1) {
    // Create carousel children
    const childIds: string[] = [];
    for (const url of mediaUrls) {
      const childRes = await fetch(`${baseUrl}/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: pageAccessToken,
        }),
      });
      const childData = await childRes.json();
      if (childData.error) throw new Error(childData.error.message);
      childIds.push(childData.id);
    }

    // Create carousel container
    const containerRes = await fetch(`${baseUrl}/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption,
        access_token: pageAccessToken,
      }),
    });
    const containerData = await containerRes.json();
    if (containerData.error) throw new Error(containerData.error.message);

    // Publish carousel
    const publishRes = await fetch(`${baseUrl}/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerData.id, access_token: pageAccessToken }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);
    return publishData.id;

  } else if (postType === 'story') {
    // Single image story
    const mediaRes = await fetch(`${baseUrl}/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'STORIES',
        image_url: mediaUrls[0],
        access_token: pageAccessToken,
      }),
    });
    const mediaData = await mediaRes.json();
    if (mediaData.error) throw new Error(mediaData.error.message);

    const publishRes = await fetch(`${baseUrl}/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: mediaData.id, access_token: pageAccessToken }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);
    return publishData.id;

  } else {
    // Single image feed post
    const mediaRes = await fetch(`${baseUrl}/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: mediaUrls[0],
        caption,
        access_token: pageAccessToken,
      }),
    });
    const mediaData = await mediaRes.json();
    if (mediaData.error) throw new Error(mediaData.error.message);

    const publishRes = await fetch(`${baseUrl}/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: mediaData.id, access_token: pageAccessToken }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);
    return publishData.id;
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const {
      socialAccountId, creativeId, blogPostId,
      postType = 'feed', caption, hashtags = [],
      mediaUrls = [], scheduledAt,
    } = await req.json();

    if (!socialAccountId || mediaUrls.length === 0) {
      return NextResponse.json({ error: 'socialAccountId and mediaUrls are required' }, { status: 400 });
    }

    const account = await (prisma as any).socialAccount.findUnique({ where: { id: socialAccountId } });
    if (!account || !account.isActive) {
      return NextResponse.json({ error: 'Social account not found or inactive' }, { status: 404 });
    }

    const fullCaption = hashtags.length > 0
      ? `${caption}\n\n${hashtags.map((h: string) => `#${h}`).join(' ')}`
      : caption;

    // Create post record
    const post = await (prisma as any).socialPost.create({
      data: {
        socialAccountId,
        creativeId: creativeId || null,
        blogPostId: blogPostId || null,
        platform: account.platform,
        postType,
        caption: fullCaption,
        hashtags,
        mediaUrls,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    // Publish immediately if not scheduled
    if (!scheduledAt) {
      try {
        const externalId = await publishToInstagram(
          account.accountId,
          account.accessToken,
          mediaUrls,
          fullCaption,
          postType
        );

        await (prisma as any).socialPost.update({
          where: { id: post.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            externalId,
          },
        });

        // Update creative status
        if (creativeId) {
          await (prisma as any).marketingCreative.update({
            where: { id: creativeId },
            data: { status: 'published' },
          });
        }

        return NextResponse.json({ success: true, post: { ...post, status: 'published', externalId } });
      } catch (publishErr: any) {
        await (prisma as any).socialPost.update({
          where: { id: post.id },
          data: { status: 'failed', errorMessage: publishErr.message },
        });
        return NextResponse.json({ error: `Publish failed: ${publishErr.message}` }, { status: 502 });
      }
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Social Publish]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
