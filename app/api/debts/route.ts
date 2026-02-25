import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireUserId();
    const debts = await (prisma as any).debt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(debts);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Debts] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { name, type, totalAmount, remainingAmount, interestRate, monthlyPayment, lender, startDate, endDate, notes } = await request.json();

    if (!name || !totalAmount) {
      return NextResponse.json({ error: 'Name and total amount are required' }, { status: 400 });
    }

    const debt = await (prisma as any).debt.create({
      data: {
        userId,
        name,
        type: type || 'loan',
        totalAmount: parseFloat(totalAmount),
        remainingAmount: parseFloat(remainingAmount || totalAmount),
        interestRate: interestRate ? parseFloat(interestRate) : null,
        monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : null,
        lender: lender || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Debts] POST error:', error);
    return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 });
  }
}
