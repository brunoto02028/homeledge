import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { caption, hashtags, mediaUrls, scheduledAt, status, postType } = body;

  const post = await prisma.socialPost.update({
    where: { id: params.id },
    data: {
      ...(caption !== undefined ? { caption } : {}),
      ...(hashtags !== undefined ? { hashtags } : {}),
      ...(mediaUrls !== undefined ? { mediaUrls } : {}),
      ...(postType !== undefined ? { postType } : {}),
      ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
      ...(status !== undefined ? { status } : {}),
    },
    include: { socialAccount: true },
  });

  return NextResponse.json({ post });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.socialPost.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
