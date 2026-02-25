import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List all course levels with modules and attempt stats
export async function GET() {
  try {
    const userId = await requireUserId();

    const courses = await (prisma as any).courseLevel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { questions: { where: { isActive: true } } } },
          },
        },
      },
    });

    // Get user's best attempt per module
    const attempts = await (prisma as any).userExamAttempt.findMany({
      where: { userId, status: 'completed' },
      orderBy: { scorePercent: 'desc' },
    });

    const bestAttempts: Record<string, any> = {};
    for (const a of attempts) {
      if (!bestAttempts[a.moduleId] || (a.scorePercent || 0) > (bestAttempts[a.moduleId].scorePercent || 0)) {
        bestAttempts[a.moduleId] = a;
      }
    }

    const enriched = courses.map((c: any) => ({
      ...c,
      modules: c.modules.map((m: any) => ({
        ...m,
        questionCount: m._count?.questions || 0,
        bestAttempt: bestAttempts[m.id] || null,
      })),
    }));

    return NextResponse.json({ courses: enriched });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Academy Courses] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
