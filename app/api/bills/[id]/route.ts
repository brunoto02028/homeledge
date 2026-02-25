import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BillFrequency } from '@prisma/client';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function calculateMonthlyEquivalent(amount: number, frequency: BillFrequency): number {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return (amount * 4) / 12;
    case 'yearly':
      return amount / 12;
    case 'one_time':
      return 0;
    default:
      return amount;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const bill = await prisma.bill.findFirst({
      where: { id, userId: { in: userIds } },
      include: {
        account: {
          include: { provider: true },
        },
        category: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...bill,
      monthlyEquivalent: calculateMonthlyEquivalent(bill.amount, bill.frequency),
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
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

    // Verify ownership
    const existing = await prisma.bill.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

    const body = await request.json();
    const { billName, amount, currency, frequency, dueDay, categoryId, expenseType, isActive } = body ?? {};

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        ...(billName && { billName }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(frequency && { frequency }),
        ...(dueDay !== undefined && { dueDay: parseInt(dueDay) }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(expenseType && { expenseType }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        account: {
          include: { provider: true },
        },
        category: true,
      },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'bill.updated',
        entityType: 'bill',
        entityId: bill.id,
        payload: { name: bill.billName, amount: bill.amount },
      },
    });

    return NextResponse.json({
      ...bill,
      monthlyEquivalent: calculateMonthlyEquivalent(bill.amount, bill.frequency),
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
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
    const bill = await prisma.bill.findFirst({ where: { id, userId: { in: userIds } } });
    
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    await prisma.bill.delete({ where: { id } });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'bill.deleted',
        entityType: 'bill',
        entityId: id,
        payload: { name: bill.billName },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
