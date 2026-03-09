import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/ai/feedback — save thumbs up/down for an AI response
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, section, userMessage, aiResponse, rating, feedbackNote } = await req.json();

    if (!userMessage || !aiResponse || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (![1, 2].includes(rating)) {
      return NextResponse.json({ error: 'Rating must be 1 (thumbs down) or 2 (thumbs up)' }, { status: 400 });
    }

    const feedback = await (prisma as any).aiChatFeedback.create({
      data: {
        userId,
        conversationId: conversationId || null,
        section: section || 'general',
        userMessage,
        aiResponse,
        rating,
        feedbackNote: feedbackNote || null,
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    console.error('AI feedback error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

// GET /api/ai/feedback — get feedback stats for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const section = req.nextUrl.searchParams.get('section');
    const where: any = { userId };
    if (section) where.section = section;

    const [total, positive, negative] = await Promise.all([
      (prisma as any).aiChatFeedback.count({ where }),
      (prisma as any).aiChatFeedback.count({ where: { ...where, rating: 2 } }),
      (prisma as any).aiChatFeedback.count({ where: { ...where, rating: 1 } }),
    ]);

    return NextResponse.json({ total, positive, negative, satisfactionRate: total > 0 ? Math.round((positive / total) * 100) : null });
  } catch (error) {
    console.error('AI feedback stats error:', error);
    return NextResponse.json({ error: 'Failed to get feedback stats' }, { status: 500 });
  }
}
