import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;

    const existing = await prisma.budget.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    const body = await request.json();
    const { amount, alertAt, isActive } = body;

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        amount,
        alertAt,
        isActive,
      },
      include: { category: true },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
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

    const existing = await prisma.budget.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}
