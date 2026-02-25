import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch recent events as notifications
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';

    const where: Record<string, unknown> = { userId: { in: userIds } };
    if (unreadOnly) where.readAt = null;

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
    });

    const unreadCount = await prisma.event.count({
      where: { userId: { in: userIds }, readAt: null },
    });

    return NextResponse.json({ events, unreadCount });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - Mark notifications as read
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { eventIds, markAll } = await request.json();

    if (markAll) {
      await prisma.event.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (eventIds?.length) {
      await prisma.event.updateMany({
        where: { id: { in: eventIds }, userId },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
