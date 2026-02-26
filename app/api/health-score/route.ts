import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface ScoreComponent {
  name: string;
  score: number; // 0-100
  weight: number;
  status: 'good' | 'warning' | 'danger';
  tip: string;
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);

    const [
      bills,
      actions,
      bankTransactions,
      statements,
      categories,
      vaultEntries,
      budgets,
      invoices,
    ] = await Promise.all([
      prisma.bill.findMany({ where: { userId: { in: userIds }, isActive: true } }),
      prisma.action.findMany({ where: { userId: { in: userIds }, status: { in: ['pending', 'approved'] } } }),
      prisma.bankTransaction.findMany({
        where: { statement: { userId: { in: userIds } } },
        include: { category: true },
      }),
      prisma.bankStatement.count({ where: { userId: { in: userIds } } }),
      prisma.category.count(),
      prisma.vaultEntry.count({ where: { userId: { in: userIds } } }),
      prisma.budget.findMany({ where: { userId: { in: userIds }, isActive: true } }),
      prisma.invoice.count({ where: { userId: { in: userIds } } }),
    ]);

    const components: ScoreComponent[] = [];

    // 1. Bill Management (weight: 20) - Do you have bills tracked?
    const billCount = bills.length;
    const billScore = billCount >= 5 ? 100 : billCount >= 2 ? 70 : billCount >= 1 ? 40 : 0;
    components.push({
      name: 'Bill Tracking',
      score: billScore,
      weight: 15,
      status: billScore >= 70 ? 'good' : billScore >= 40 ? 'warning' : 'danger',
      tip: billScore >= 70 ? 'Bills are well tracked' : 'Add more bills to track your commitments',
    });

    // 2. Transaction Categorisation (weight: 25) — What % of transactions are categorised?
    const totalTx = bankTransactions.length;
    const categorisedTx = bankTransactions.filter(t => t.categoryId).length;
    const catPercent = totalTx > 0 ? (categorisedTx / totalTx) * 100 : 0;
    const catScore = catPercent >= 90 ? 100 : catPercent >= 70 ? 80 : catPercent >= 50 ? 60 : catPercent >= 20 ? 30 : 0;
    components.push({
      name: 'Categorisation',
      score: catScore,
      weight: 25,
      status: catScore >= 80 ? 'good' : catScore >= 50 ? 'warning' : 'danger',
      tip: catScore >= 80 ? `${catPercent.toFixed(0)}% categorised` : `${(100 - catPercent).toFixed(0)}% of transactions need categorisation`,
    });

    // 3. Overdue Actions (weight: 15) - Any overdue actions?
    const now = new Date();
    const overdueActions = actions.filter(a => a.dueDate && new Date(a.dueDate) < now);
    const actionScore = overdueActions.length === 0 ? 100 : overdueActions.length <= 2 ? 60 : 20;
    components.push({
      name: 'Pending Actions',
      score: actionScore,
      weight: 15,
      status: actionScore >= 80 ? 'good' : actionScore >= 50 ? 'warning' : 'danger',
      tip: overdueActions.length === 0 ? 'No overdue actions' : `${overdueActions.length} overdue action(s) need attention`,
    });

    // 4. Savings Rate (weight: 20) - Income vs Expenses ratio
    const income = bankTransactions.filter(t => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0);
    const expenses = bankTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const savingsScore = savingsRate >= 20 ? 100 : savingsRate >= 10 ? 80 : savingsRate >= 0 ? 50 : 20;
    components.push({
      name: 'Savings Rate',
      score: savingsScore,
      weight: 20,
      status: savingsScore >= 80 ? 'good' : savingsScore >= 50 ? 'warning' : 'danger',
      tip: savingsRate >= 10 ? `Saving ${savingsRate.toFixed(0)}% of income` : income > 0 ? 'Spending exceeds or nearly matches income' : 'Upload statements to track savings',
    });

    // 5. Budget Coverage (weight: 10) - Do you have budgets set?
    const budgetScore = budgets.length >= 5 ? 100 : budgets.length >= 3 ? 70 : budgets.length >= 1 ? 40 : 0;
    components.push({
      name: 'Budget Planning',
      score: budgetScore,
      weight: 10,
      status: budgetScore >= 70 ? 'good' : budgetScore >= 40 ? 'warning' : 'danger',
      tip: budgetScore >= 70 ? `${budgets.length} budgets active` : 'Set budgets for your expense categories',
    });

    // 6. Data Freshness (weight: 15) - Recent statements uploaded?
    const statementsScore = statements >= 3 ? 100 : statements >= 1 ? 60 : 0;
    components.push({
      name: 'Data Freshness',
      score: statementsScore,
      weight: 15,
      status: statementsScore >= 80 ? 'good' : statementsScore >= 50 ? 'warning' : 'danger',
      tip: statementsScore >= 80 ? `${statements} statements uploaded` : 'Upload more bank statements for better insights',
    });

    // Calculate overall score (weighted average)
    const totalWeight = components.reduce((s, c) => s + c.weight, 0);
    const overallScore = Math.round(
      components.reduce((s, c) => s + (c.score * c.weight), 0) / totalWeight
    );

    const overallStatus = overallScore >= 75 ? 'good' : overallScore >= 50 ? 'warning' : 'danger';
    const grade = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : overallScore >= 50 ? 'D' : 'F';

    return NextResponse.json({
      score: overallScore,
      grade,
      status: overallStatus,
      components,
      summary: {
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100,
        totalTransactions: totalTx,
        categorisedPercent: Math.round(catPercent * 100) / 100,
        activeBills: billCount,
        overdueActions: overdueActions.length,
        budgetsActive: budgets.length,
      },
    });
  } catch (error: any) {
    console.error('[Health Score] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
