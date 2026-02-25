import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Submit exam answers and calculate score
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { attemptId, answers, timeSpentSeconds } = await request.json();

    // answers: [{questionId, selectedOptionId}]
    if (!attemptId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'attemptId and answers array required' }, { status: 400 });
    }

    const attempt = await (prisma as any).userExamAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== userId) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status === 'completed') {
      return NextResponse.json({ error: 'Attempt already submitted' }, { status: 400 });
    }

    // Fetch correct answers from DB
    const questionIds = answers.map((a: any) => a.questionId);
    const correctOptions = await (prisma as any).questionOption.findMany({
      where: {
        questionId: { in: questionIds },
        isCorrect: true,
      },
      select: { id: true, questionId: true },
    });

    const correctMap = new Map(correctOptions.map((o: any) => [o.questionId, o.id]));

    // Grade each answer
    let correctAnswers = 0;
    const gradedAnswers = answers.map((a: any) => {
      const correctOptionId = correctMap.get(a.questionId);
      const isCorrect = a.selectedOptionId === correctOptionId;
      if (isCorrect) correctAnswers++;
      return {
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        correctOptionId,
        isCorrect,
      };
    });

    const totalQuestions = answers.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10 : 0;

    // Get pass mark from module
    const mod = await (prisma as any).examModule.findUnique({
      where: { id: attempt.moduleId },
      select: { passMarkPercent: true },
    });
    const passed = scorePercent >= (mod?.passMarkPercent || 70);

    // Update attempt
    const updated = await (prisma as any).userExamAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'completed',
        correctAnswers,
        totalQuestions,
        scorePercent,
        passed,
        finishedAt: new Date(),
        timeSpentSeconds: timeSpentSeconds || null,
        answers: gradedAnswers,
      },
    });

    return NextResponse.json({
      attempt: updated,
      results: {
        totalQuestions,
        correctAnswers,
        scorePercent,
        passed,
        passMarkPercent: mod?.passMarkPercent || 70,
        gradedAnswers,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Academy Exam Submit] Error:', error);
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 });
  }
}
