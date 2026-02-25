import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// GET /api/entities/[id]/history — List history entries for an entity
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const entityId = params.id;

    // Verify entity belongs to user
    const entity = await (prisma as any).entity.findFirst({
      where: { id: entityId, userId },
    });
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // filter by type
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { entityId };
    if (type) where.type = type;

    const [entries, total] = await Promise.all([
      (prisma as any).entityHistory.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { date: 'desc' }],
        take: limit,
        skip: offset,
      }),
      (prisma as any).entityHistory.count({ where }),
    ]);

    return NextResponse.json({ entries, total, limit, offset });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Entity History] GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch history' }, { status: 500 });
  }
}

// POST /api/entities/[id]/history — Create a history entry
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const entityId = params.id;

    // Verify entity belongs to user
    const entity = await (prisma as any).entity.findFirst({
      where: { id: entityId, userId },
    });
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, title, description, date, fileUrl, fileName, fileSize, fileMimeType, metadata, tags, isPinned } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const entry = await (prisma as any).entityHistory.create({
      data: {
        entityId,
        userId,
        type: type || 'note',
        title,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        fileMimeType: fileMimeType || null,
        metadata: metadata || null,
        tags: tags || [],
        isPinned: isPinned || false,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Entity History] POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create history entry' }, { status: 500 });
  }
}
