import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const taskId = searchParams.get('taskId');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');

  const logs = await (prisma as any).claudeTaskLog.findMany({
    where: {
      ...(taskId ? { taskId } : {}),
      ...(status ? { status } : {}),
    },
    include: { task: { select: { name: true, taskType: true } } },
    orderBy: { runAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ logs });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { logId, action } = body;

  if (!logId || !action) return NextResponse.json({ error: 'logId and action required' }, { status: 400 });

  const status = action === 'approve' ? 'approved' : 'rejected';
  const log = await (prisma as any).claudeTaskLog.update({
    where: { id: logId },
    data: { status, approvedAt: action === 'approve' ? new Date() : null },
    include: { task: true },
  });

  return NextResponse.json({ log });
}
