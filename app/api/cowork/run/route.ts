import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeTask, runSystemMonitor } from '@/lib/claude-cowork';

export async function POST(req: NextRequest) {
  // Allow both authenticated admin calls and cron bearer token calls
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'homeledger-cron-2024';
  const isCron = authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { taskId, action } = body;

  if (action === 'monitor') {
    await runSystemMonitor();
    return NextResponse.json({ success: true, message: 'System monitor completed' });
  }

  if (action === 'run_scheduled') {
    const { prisma } = await import('@/lib/db');
    const now = new Date();
    const dueTasks = await (prisma as any).claudeTask.findMany({
      where: {
        isActive: true,
        schedule: { not: 'manual' },
        OR: [
          { nextRunAt: null },
          { nextRunAt: { lte: now } },
        ],
      },
    });

    const results = [];
    for (const task of dueTasks) {
      const result = await executeTask(task.id);
      results.push({ taskId: task.id, name: task.name, ...result });
    }
    return NextResponse.json({ success: true, ran: results.length, results });
  }

  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

  const result = await executeTask(taskId);
  return NextResponse.json(result);
}
