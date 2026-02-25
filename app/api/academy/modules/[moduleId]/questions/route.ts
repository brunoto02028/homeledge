import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch questions for a module
// ?mode=timed|study — in timed mode, isCorrect is NOT sent to prevent dev-tools cheating
export async function GET(request: Request, { params }: { params: { moduleId: string } }) {
  try {
    await requireUserId();
    const { moduleId } = params;
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'study';

    const mod = await (prisma as any).examModule.findUnique({
      where: { id: moduleId },
      select: { id: true, title: true, code: true, passMarkPercent: true, timeLimitMinutes: true, totalQuestions: true, courseId: true },
    });

    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const allQuestions = await (prisma as any).question.findMany({
      where: { moduleId, isActive: true },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            optionText: true,
            sortOrder: true,
            // Only include correct answer info in study mode
            ...(mode === 'study' ? { isCorrect: true, explanation: true } : {}),
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // For timed mode, shuffle questions and pick totalQuestions count
    let questions = allQuestions;
    if (mode === 'timed') {
      // Shuffle using Fisher-Yates
      const shuffled = [...allQuestions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      questions = shuffled.slice(0, mod.totalQuestions || 40);

      // Also shuffle options within each question for timed mode
      questions = questions.map((q: any) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
        // Strip AI explanation in timed mode
        aiExplanation: undefined,
      }));
    }

    return NextResponse.json({
      module: mod,
      questions,
      mode,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Academy Questions] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
