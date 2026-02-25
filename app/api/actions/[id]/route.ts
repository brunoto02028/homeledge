import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const action = await prisma.action.findFirst({ where: { id, userId: { in: userIds } } });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const now = new Date();
    return NextResponse.json({
      ...action,
      isOverdue: action.dueDate && action.status === 'pending' && new Date(action.dueDate) < now,
    });
  } catch (error) {
    console.error('Error fetching action:', error);
    return NextResponse.json({ error: 'Failed to fetch action' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const body = await request.json();
    const { actionType, title, description, status, priority, dueDate } = body ?? {};

    const existingAction = await prisma.action.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (actionType) updateData.actionType = actionType;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) {
      updateData.status = status;
      if (status === 'completed' && existingAction.status !== 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const action = await prisma.action.update({
      where: { id },
      data: updateData,
    });

    const eventType = status === 'completed' ? 'action.completed' : 'action.updated';
    await prisma.event.create({
      data: {
        userId,
        eventType,
        entityType: 'action',
        entityId: action.id,
        payload: { title: action.title, status: action.status },
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const action = await prisma.action.findFirst({ where: { id, userId: { in: userIds } } });
    
    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    await prisma.action.delete({ where: { id } });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'action.deleted',
        entityType: 'action',
        entityId: id,
        payload: { title: action.title },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
  }
}
