import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET - List all transactions with filters (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('statementId');
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const uncategorizedOnly = searchParams.get('uncategorizedOnly') === 'true';

    const where: any = {
      // Filter by user's statements only (multi-tenancy)
      statement: { userId: { in: userIds } },
    };

    if (statementId) where.statementId = statementId;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (uncategorizedOnly) where.categoryId = null;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.bankTransaction.findMany({
      where,
      include: {
        category: true,
        statement: {
          include: {
            account: {
              include: {
                provider: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
