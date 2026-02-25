import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Start a new exam attempt
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { moduleId, mode } = await request.json();

    if (!moduleId || !mode) {
      return NextResponse.json({ error: 'moduleId and mode are required' }, { status: 400 });
    }

    const mod = await (prisma as any).examModule.findUnique({
      where: { id: moduleId },
      select: { id: true, timeLimitMinutes: true, totalQuestions: true },
    });

    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const attempt = await (prisma as any).userExamAttempt.create({
      data: {
        userId,
        moduleId,
        mode,
        status: 'in_progress',
        totalQuestions: mod.totalQuestions || 40,
        timeLimitMinutes: mode === 'timed' ? mod.timeLimitMinutes : null,
      },
    });

    return NextResponse.json({ attempt });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Academy Exam Start] Error:', error);
    return NextResponse.json({ error: 'Failed to start exam' }, { status: 500 });
  }
}

// GET - List user's exam attempts
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const url = new URL(request.url);
    const moduleId = url.searchParams.get('moduleId');

    const where: any = { userId };
    if (moduleId) where.moduleId = moduleId;

    const attempts = await (prisma as any).userExamAttempt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        module: {
          select: { title: true, code: true, passMarkPercent: true },
        },
      },
    });

    return NextResponse.json({ attempts });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Academy Exam List] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
  }
}
