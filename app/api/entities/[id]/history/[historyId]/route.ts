import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// PUT /api/entities/[id]/history/[historyId] — Update a history entry
export async function PUT(request: Request, { params }: { params: { id: string; historyId: string } }) {
  try {
    const userId = await requireUserId();
    const { id: entityId, historyId } = params;

    // Verify entity belongs to user
    const entity = await (prisma as any).entity.findFirst({
      where: { id: entityId, userId },
    });
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const existing = await (prisma as any).entityHistory.findFirst({
      where: { id: historyId, entityId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, title, description, date, fileUrl, fileName, fileSize, fileMimeType, metadata, tags, isPinned } = body;

    const updated = await (prisma as any).entityHistory.update({
      where: { id: historyId },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileName !== undefined && { fileName }),
        ...(fileSize !== undefined && { fileSize }),
        ...(fileMimeType !== undefined && { fileMimeType }),
        ...(metadata !== undefined && { metadata }),
        ...(tags !== undefined && { tags }),
        ...(isPinned !== undefined && { isPinned }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Entity History] PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/entities/[id]/history/[historyId] — Delete a history entry
export async function DELETE(request: Request, { params }: { params: { id: string; historyId: string } }) {
  try {
    const userId = await requireUserId();
    const { id: entityId, historyId } = params;

    const entity = await (prisma as any).entity.findFirst({
      where: { id: entityId, userId },
    });
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const existing = await (prisma as any).entityHistory.findFirst({
      where: { id: historyId, entityId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 });
    }

    await (prisma as any).entityHistory.delete({ where: { id: historyId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Entity History] DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
