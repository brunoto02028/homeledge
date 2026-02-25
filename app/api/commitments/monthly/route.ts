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

export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const [activeBills, accounts, pendingActions, recentActions, totalInvoices, bankTransactions] = await Promise.all([
      prisma.bill.findMany({
        where: { isActive: true, userId: { in: userIds } },
        include: {
          account: {
            include: { provider: true },
          },
          category: true,
        },
      }),
      prisma.account.count({ where: { isActive: true, provider: { userId: { in: userIds } } } }),
      prisma.action.count({ where: { status: 'pending', userId: { in: userIds } } }),
      prisma.action.findMany({
        where: { status: { in: ['pending', 'approved'] }, userId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.invoice.count({ where: { userId: { in: userIds } } }),
      // Get bank transactions with categories for spending breakdown
      prisma.bankTransaction.findMany({
        where: { statement: { userId: { in: userIds } } },
        include: { category: true },
      }),
    ]);

    // Calculate total monthly commitments from bills
    let totalMonthly = 0;
    const byCategory: Record<string, { amount: number; color?: string }> = {};

    for (const bill of activeBills ?? []) {
      const monthly = calculateMonthlyEquivalent(bill.amount, bill.frequency);
      totalMonthly += monthly;
      
      const categoryName = bill.category?.name ?? 'Other';
      const categoryColor = bill.category?.color ?? '#6b7280';
      
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = { amount: 0, color: categoryColor };
      }
      byCategory[categoryName].amount += monthly;
    }

    // Add bank transaction expenses to category breakdown (for spending chart)
    let bankIncome = 0;
    let bankExpenses = 0;
    for (const tx of bankTransactions ?? []) {
      if (tx.type === 'credit') {
        bankIncome += Math.abs(Number(tx.amount));
      } else {
        bankExpenses += Math.abs(Number(tx.amount));
        // Add to category breakdown for spending chart
        const categoryName = tx.category?.name ?? 'Uncategorized';
        const categoryColor = tx.category?.color ?? '#9ca3af';
        if (!byCategory[categoryName]) {
          byCategory[categoryName] = { amount: 0, color: categoryColor };
        }
        byCategory[categoryName].amount += Math.abs(Number(tx.amount));
      }
    }

    // Get upcoming bills (sorted by due day)
    const now = new Date();
    const currentDay = now.getDate();
    
    const upcomingBills = (activeBills ?? []).map((bill) => {
      const dueDate = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
      if (bill.dueDay < currentDay) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      return {
        ...bill,
        monthlyEquivalent: calculateMonthlyEquivalent(bill.amount, bill.frequency),
        nextDueDate: dueDate.toISOString(),
      };
    }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

    // Add isOverdue to actions
    const actionsWithOverdue = (recentActions ?? []).map((action) => ({
      ...action,
      isOverdue: action.dueDate && action.status === 'pending' && new Date(action.dueDate) < now,
    }));

    // Calculate total monthly from bills + bank statement expenses
    const totalMonthlyAll = totalMonthly + bankExpenses;

    return NextResponse.json({
      totalMonthly: Math.round(totalMonthlyAll * 100) / 100,
      billsMonthly: Math.round(totalMonthly * 100) / 100,
      bankIncome: Math.round(bankIncome * 100) / 100,
      bankExpenses: Math.round(bankExpenses * 100) / 100,
      currency: 'GBP',
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        amount: Math.round(data.amount * 100) / 100,
        color: data.color,
      })).sort((a, b) => b.amount - a.amount),
      upcomingBills,
      recentActions: actionsWithOverdue,
      stats: {
        totalAccounts: accounts ?? 0,
        activeBills: activeBills?.length ?? 0,
        pendingActions: pendingActions ?? 0,
        totalInvoices: totalInvoices ?? 0,
        totalBankTransactions: bankTransactions?.length ?? 0,
      },
    });
  } catch (error) {
    console.error('Error fetching monthly commitments:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly commitments' }, { status: 500 });
  }
}
