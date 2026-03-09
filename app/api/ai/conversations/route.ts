import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/ai/conversations — list user's conversations (optionally filter by section)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const section = req.nextUrl.searchParams.get('section');
    const where: any = { userId, isActive: true };
    if (section) where.section = section;

    const conversations = await (prisma as any).aiConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        section: true,
        title: true,
        tokenCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('AI conversations list error:', error);
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
  }
}

// POST /api/ai/conversations — create or update a conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, section, title, messages } = await req.json();

    if (id) {
      // Update existing conversation
      const conversation = await (prisma as any).aiConversation.update({
        where: { id },
        data: {
          messages: messages || [],
          title: title || undefined,
          tokenCount: JSON.stringify(messages || []).length,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(conversation);
    } else {
      // Create new conversation
      const conversation = await (prisma as any).aiConversation.create({
        data: {
          userId,
          section: section || 'general',
          title: title || null,
          messages: messages || [],
          tokenCount: JSON.stringify(messages || []).length,
        },
      });
      return NextResponse.json(conversation);
    }
  } catch (error) {
    console.error('AI conversation save error:', error);
    return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
  }
}

// DELETE /api/ai/conversations — archive a conversation
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
    }

    await (prisma as any).aiConversation.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI conversation delete error:', error);
    return NextResponse.json({ error: 'Failed to archive conversation' }, { status: 500 });
  }
}
