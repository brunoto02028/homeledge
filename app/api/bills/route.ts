import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BillFrequency, ExpenseType } from '@prisma/client';
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

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const frequency = searchParams.get('frequency') as BillFrequency | null;
    const accountId = searchParams.get('accountId');
    const isActive = searchParams.get('isActive');
    const expenseType = searchParams.get('expenseType') as ExpenseType | null;
    const entityId = searchParams.get('entityId');

    const where: Record<string, unknown> = { userId: { in: userIds } };
    if (categoryId) where.categoryId = categoryId;
    if (frequency) where.frequency = frequency;
    if (accountId) where.accountId = accountId;
    if (expenseType) where.expenseType = expenseType;
    if (entityId) where.entityId = entityId;
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true';

    const bills = await prisma.bill.findMany({
      where,
      include: {
        account: {
          include: { provider: true },
        },
        category: true,
      },
      orderBy: { dueDay: 'asc' },
    });

    const billsWithMonthly = (bills ?? []).map((bill) => ({
      ...bill,
      monthlyEquivalent: calculateMonthlyEquivalent(bill.amount, bill.frequency),
    }));

    return NextResponse.json(billsWithMonthly);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { accountId, billName, amount, currency, frequency, dueDay, categoryId, entityId, expenseType, isActive } = body ?? {};

    if (!billName || amount === undefined || !frequency || dueDay === undefined) {
      return NextResponse.json({ error: 'Bill name, amount, frequency, and due day are required' }, { status: 400 });
    }

    const bill = await (prisma.bill as any).create({
      data: {
        accountId: accountId || null,
        billName,
        userId,
        amount: parseFloat(amount),
        currency: currency ?? 'GBP',
        frequency,
        dueDay: parseInt(dueDay),
        categoryId: categoryId || null,
        entityId: entityId || null,
        expenseType: expenseType || 'recurring',
        isActive: isActive ?? true,
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
        eventType: 'bill.created',
        entityType: 'bill',
        entityId: bill.id,
        payload: { name: billName, amount, frequency },
      },
    });

    return NextResponse.json({
      ...bill,
      monthlyEquivalent: calculateMonthlyEquivalent(bill.amount, bill.frequency),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
