import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { suggestTasks } from '@/lib/claude-cowork';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tasks = await (prisma as any).claudeTask.findMany({
    include: {
      logs: { orderBy: { runAt: 'desc' }, take: 1 },
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'suggest') {
    const suggestions = await suggestTasks();
    return NextResponse.json({ suggestions });
  }

  const { name, description, taskType, schedule, requiresApproval, context, notifyEmail, notifySms, notifyInApp } = body;

  if (!name || !taskType || !schedule) {
    return NextResponse.json({ error: 'name, taskType and schedule are required' }, { status: 400 });
  }

  const task = await (prisma as any).claudeTask.create({
    data: {
      name,
      description: description || null,
      taskType,
      schedule,
      requiresApproval: requiresApproval ?? false,
      context: context || null,
      notifyEmail: notifyEmail ?? true,
      notifySms: notifySms ?? false,
      notifyInApp: notifyInApp ?? true,
      isActive: true,
    },
  });

  return NextResponse.json({ task });
}
