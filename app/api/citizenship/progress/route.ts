import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/citizenship/progress — fetch quiz history
export async function GET() {
  try {
    const userId = await requireUserId();
    const attempts = await (prisma as any).citizenshipAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ attempts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load progress' }, { status: 500 });
  }
}

// POST /api/citizenship/progress — save a quiz attempt
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { mode, themeId, score, total, percentage, passed, answers, duration } = body;

    if (!mode || score == null || total == null || percentage == null || passed == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const attempt = await (prisma as any).citizenshipAttempt.create({
      data: {
        userId,
        mode,
        themeId: themeId || null,
        score,
        total,
        percentage,
        passed,
        answers: answers || [],
        duration: duration || null,
      },
    });

    return NextResponse.json({ attempt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save attempt' }, { status: 500 });
  }
}
