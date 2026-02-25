import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireUserId();
    const goals = await (prisma as any).savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(goals);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[SavingsGoals] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch savings goals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { name, targetAmount, currentAmount, deadline, icon, color } = await request.json();

    if (!name || !targetAmount) {
      return NextResponse.json({ error: 'Name and target amount are required' }, { status: 400 });
    }

    const goal = await (prisma as any).savingsGoal.create({
      data: {
        userId,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        deadline: deadline ? new Date(deadline) : null,
        icon: icon || null,
        color: color || null,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[SavingsGoals] POST error:', error);
    return NextResponse.json({ error: 'Failed to create savings goal' }, { status: 500 });
  }
}
