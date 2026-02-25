import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const budgets = await prisma.budget.findMany({
      where: { userId: { in: userIds } },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });

    // Calculate current spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        // Get current month's invoices for this category
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const invoices = await prisma.invoice.findMany({
          where: {
            userId: { in: userIds },
            categoryId: budget.categoryId,
            invoiceDate: { gte: startOfMonth },
            status: { in: ['processed', 'reviewed'] },
          },
        });

        // Also get bills for this category
        const bills = await prisma.bill.findMany({
          where: {
            userId: { in: userIds },
            categoryId: budget.categoryId,
            isActive: true,
          },
        });

        // Calculate monthly bill amount
        const monthlyBillAmount = bills.reduce((sum, bill) => {
          const multiplier = bill.frequency === 'yearly' ? 1/12 :
                            bill.frequency === 'quarterly' ? 1/3 :
                            bill.frequency === 'weekly' ? 4 : 1;
          return sum + (bill.amount * multiplier);
        }, 0);

        // Invoice spending this month
        const invoiceSpending = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const currentSpending = monthlyBillAmount + invoiceSpending;
        const percentageUsed = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;
        const isOverBudget = percentageUsed > 100;
        const isNearLimit = percentageUsed >= budget.alertAt && !isOverBudget;

        return {
          ...budget,
          currentSpending: Math.round(currentSpending * 100) / 100,
          percentageUsed: Math.round(percentageUsed * 10) / 10,
          remaining: Math.round((budget.amount - currentSpending) * 100) / 100,
          isOverBudget,
          isNearLimit,
        };
      })
    );

    return NextResponse.json(budgetsWithSpending);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { categoryId, amount, period, alertAt } = body;

    if (!categoryId || !amount) {
      return NextResponse.json(
        { error: 'Category and amount are required' },
        { status: 400 }
      );
    }

    // Check if budget already exists for this category/period
    const existing = await prisma.budget.findFirst({
      where: { categoryId, period: period || 'monthly', userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Budget already exists for this category' },
        { status: 409 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        categoryId,
        userId,
        amount,
        period: period || 'monthly',
        alertAt: alertAt || 80,
      },
      include: { category: true },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'budget.created',
        entityType: 'budget',
        entityId: budget.id,
        payload: { categoryName: budget.category?.name, amount },
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}
