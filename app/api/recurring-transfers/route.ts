import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all recurring transfers
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = { userId: { in: userIds } };
    if (isActive !== null && isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    if (type) where.type = type;

    const transfers = await prisma.recurringTransfer.findMany({
      where,
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: [{ isActive: 'desc' }, { dayOfMonth: 'asc' }],
    });

    return NextResponse.json(transfers);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[RecurringTransfers] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST - Create recurring transfer
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { name, type, fromAccount, toAccount, toName, reference, amount, currency, frequency, dayOfMonth, startDate, endDate, categoryId, notes } = body;

    if (!name || amount === undefined || !frequency) {
      return NextResponse.json({ error: 'Name, amount, and frequency are required' }, { status: 400 });
    }

    const transfer = await prisma.recurringTransfer.create({
      data: {
        userId,
        name,
        type: type || 'standing_order',
        fromAccount: fromAccount || null,
        toAccount: toAccount || null,
        toName: toName || null,
        reference: reference || null,
        amount: parseFloat(amount),
        currency: currency || 'GBP',
        frequency,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        categoryId: categoryId || null,
        notes: notes || null,
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'transfer.created',
        entityType: 'RecurringTransfer',
        entityId: transfer.id,
        payload: { name, amount, frequency, type: type || 'standing_order' },
      },
    }).catch(() => {});

    return NextResponse.json(transfer, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[RecurringTransfers] Error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
