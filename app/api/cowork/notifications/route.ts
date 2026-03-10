import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  const notifications = await (prisma as any).systemNotification.findMany({
    where: { ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const unreadCount = await (prisma as any).systemNotification.count({ where: { isRead: false } });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, markAllRead } = body;

  if (markAllRead) {
    await (prisma as any).systemNotification.updateMany({ where: { isRead: false }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  }

  if (id) {
    await (prisma as any).systemNotification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 });
}
