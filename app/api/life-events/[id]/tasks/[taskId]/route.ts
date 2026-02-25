import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// PATCH: Update a life event task (e.g., mark as completed)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id, taskId } = await params;

    // Verify the life event belongs to this user
    const lifeEvent = await prisma.lifeEvent.findFirst({ where: { id, userId: { in: userIds } } });
    if (!lifeEvent) return NextResponse.json({ error: 'Life event not found' }, { status: 404 });

    const body = await request.json();

    // If marking as completed, set completedAt
    const updateData: Record<string, unknown> = { ...body };
    if (body.status === 'completed' && !body.completedAt) {
      updateData.completedAt = new Date();
    } else if (body.status !== 'completed') {
      updateData.completedAt = null;
    }

    const task = await prisma.lifeEventTask.update({
      where: { id: taskId },
      data: updateData
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id, taskId } = await params;

    // Verify the life event belongs to this user
    const lifeEvent = await prisma.lifeEvent.findFirst({ where: { id, userId: { in: userIds } } });
    if (!lifeEvent) return NextResponse.json({ error: 'Life event not found' }, { status: 404 });

    await prisma.lifeEventTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
