import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET - List user's shared links
export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const links = await prisma.sharedLink.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(links);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - Create a shared link
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { label, scope, expiresInDays } = await request.json();

    if (!label) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const link = await prisma.sharedLink.create({
      data: {
        userId,
        label,
        scope: scope || ['reports', 'categories', 'bills'],
        expiresAt,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[SharedLinks] Error:', error);
    return NextResponse.json({ error: 'Failed to create shared link' }, { status: 500 });
  }
}

// DELETE - Revoke a shared link
export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId();
    const { linkId } = await request.json();

    const userIds = await getAccessibleUserIds(userId);
    const link = await prisma.sharedLink.findFirst({
      where: { id: linkId, userId: { in: userIds } },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await prisma.sharedLink.delete({ where: { id: linkId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
