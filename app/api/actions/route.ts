import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ActionStatus, ActionPriority } from '@prisma/client';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ActionStatus | null;
    const priority = searchParams.get('priority') as ActionPriority | null;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = { userId: { in: userIds } };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (dateFrom || dateTo) {
      where.dueDate = {};
      if (dateFrom) (where.dueDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.dueDate as Record<string, unknown>).lte = new Date(dateTo);
    }

    const actions = await prisma.action.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    const now = new Date();
    const actionsWithOverdue = (actions ?? []).map((action) => ({
      ...action,
      isOverdue: action.dueDate && action.status === 'pending' && new Date(action.dueDate) < now,
    }));

    return NextResponse.json(actionsWithOverdue);
  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { actionType, title, description, status, priority, dueDate, createdBy } = body ?? {};

    if (!actionType || !title) {
      return NextResponse.json({ error: 'Action type and title are required' }, { status: 400 });
    }

    const action = await prisma.action.create({
      data: {
        actionType,
        title,
        description: description ?? null,
        status: status ?? 'pending',
        priority: priority ?? 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: createdBy ?? null,
        userId,
      },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'action.created',
        entityType: 'action',
        entityId: action.id,
        payload: { title, status: action.status, priority: action.priority },
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error('Error creating action:', error);
    return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
  }
}
