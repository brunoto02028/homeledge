import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const entityId = searchParams.get('entityId');
    const accountId = searchParams.get('accountId');

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Step 1: Get statement IDs filtered by entity/account (avoids relation filter issues)
    const statementsForFilter = await prisma.bankStatement.findMany({
      where: {
        userId: { in: userIds },
        ...(entityId ? { entityId } : {}),
        ...(accountId ? { accountId } : {}),
      },
      select: { id: true },
    });
    const statementIds = statementsForFilter.map(s => s.id);

    // Step 2: Get all transactions with categories (filtered by statementIds)
    const transactions = await prisma.bankTransaction.findMany({
      where: {
        statementId: { in: statementIds },
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      include: {
        category: true,
      },
    });

    // Calculate totals
    let totalBankOutflow = 0;
    let totalBankIncome = 0;
    let totalAllowableExpenses = 0;
    let totalNonDeductible = 0;

    const categoryBreakdown: Record<string, {
      name: string;
      type: string;
      bankAmount: number;
      allowableAmount: number;
      deductibilityPercent: number;
      transactionCount: number;
    }> = {};

    const nonDeductibleCategories: { name: string; amount: number }[] = [];

    transactions.forEach((tx: { type: string; amount: number; appliedDeductibilityPercent: number | null; categoryId: string | null; category: { defaultDeductibilityPercent: number; name: string; type: string } | null }) => {
      // Get deductibility percent: use transaction override or category default
      const deductibilityPercent = tx.appliedDeductibilityPercent ?? 
        (tx.category?.defaultDeductibilityPercent ?? 0);
      
      const allowableAmount = tx.amount * (deductibilityPercent / 100);
      const nonDeductibleAmount = tx.amount - allowableAmount;

      if (tx.type === 'debit') {
        totalBankOutflow += tx.amount;
        totalAllowableExpenses += allowableAmount;
        totalNonDeductible += nonDeductibleAmount;
      } else {
        totalBankIncome += tx.amount;
      }

      // Category breakdown
      const categoryName = tx.category?.name || 'Uncategorized';
      const categoryId = tx.categoryId || 'uncategorized';
      
      if (!categoryBreakdown[categoryId]) {
        categoryBreakdown[categoryId] = {
          name: categoryName,
          type: tx.category?.type || 'expense',
          bankAmount: 0,
          allowableAmount: 0,
          deductibilityPercent: deductibilityPercent,
          transactionCount: 0,
        };
      }

      if (tx.type === 'debit') {
        categoryBreakdown[categoryId].bankAmount += tx.amount;
        categoryBreakdown[categoryId].allowableAmount += allowableAmount;
        categoryBreakdown[categoryId].transactionCount++;
      }
    });

    // Build non-deductible categories list (sorted by amount)
    Object.values(categoryBreakdown)
      .filter(cat => cat.type === 'expense' && cat.deductibilityPercent < 100)
      .forEach(cat => {
        const nonDeductible = cat.bankAmount - cat.allowableAmount;
        if (nonDeductible > 0) {
          nonDeductibleCategories.push({ name: cat.name, amount: nonDeductible });
        }
      });

    nonDeductibleCategories.sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      bankReality: {
        totalIncome: totalBankIncome,
        totalOutflow: totalBankOutflow,
        netPosition: totalBankIncome - totalBankOutflow,
      },
      taxReality: {
        totalIncome: totalBankIncome,
        totalAllowableExpenses,
        taxableProfit: totalBankIncome - totalAllowableExpenses,
      },
      reconciliation: {
        totalNonDeductible,
        topNonDeductibleCategories: nonDeductibleCategories.slice(0, 5),
        percentageAllowable: totalBankOutflow > 0 
          ? Math.round((totalAllowableExpenses / totalBankOutflow) * 100) 
          : 0,
      },
      categoryBreakdown: Object.entries(categoryBreakdown)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.bankAmount - a.bankAmount),
    });
  } catch (error) {
    console.error('Tax reality API error:', error);
    return NextResponse.json({ error: 'Failed to calculate tax reality' }, { status: 500 });
  }
}
