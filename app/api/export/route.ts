import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const sections = (searchParams.get('sections') || 'all').split(',');
    const includeAll = sections.includes('all');

    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      format,
    };

    // User profile
    if (includeAll || sections.includes('profile')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true, role: true, createdAt: true },
      });
      data.profile = user;
    }

    // Entities
    if (includeAll || sections.includes('entities')) {
      data.entities = await prisma.entity.findMany({
        where: { userId: { in: userIds } },
        select: {
          name: true, type: true, taxRegime: true, companyNumber: true, utr: true,
          vatNumber: true, isVatRegistered: true, registeredAddress: true, tradingAddress: true,
          financialYearStart: true, financialYearEnd: true, accountingBasis: true, isDefault: true,
        },
      });
    }

    // Bills
    if (includeAll || sections.includes('bills')) {
      data.bills = await prisma.bill.findMany({
        where: { userId: { in: userIds } },
        include: {
          category: { select: { name: true } },
          account: { include: { provider: { select: { name: true } } } },
        },
      });
    }

    // Invoices
    if (includeAll || sections.includes('invoices')) {
      data.invoices = await prisma.invoice.findMany({
        where: { userId: { in: userIds } },
        include: { category: { select: { name: true } } },
      });
    }

    // Bank Statements + Transactions
    if (includeAll || sections.includes('statements')) {
      const statements = await prisma.bankStatement.findMany({
        where: { userId: { in: userIds } },
        include: {
          transactions: {
            include: { category: { select: { name: true, type: true, hmrcMapping: true } } },
          },
        },
      });
      data.statements = statements.map((s: any) => ({
        fileName: s.fileName,
        bank: s.bank,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
        totalCredits: s.totalCredits,
        totalDebits: s.totalDebits,
        transactionCount: s.transactions.length,
        transactions: s.transactions.map((t: any) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category?.name || null,
          hmrcMapping: t.category?.hmrcMapping || null,
        })),
      }));
    }

    // Providers + Accounts
    if (includeAll || sections.includes('providers')) {
      data.providers = await prisma.provider.findMany({
        where: { userId: { in: userIds } },
        include: { accounts: { select: { accountName: true, accountNumber: true, accountType: true, isActive: true } } },
      });
    }

    // Categories
    if (includeAll || sections.includes('categories')) {
      data.categories = await prisma.category.findMany({
        select: { name: true, type: true, hmrcMapping: true, defaultDeductibilityPercent: true },
      });
    }

    // Budgets
    if (includeAll || sections.includes('budgets')) {
      data.budgets = await prisma.budget.findMany({
        where: { userId: { in: userIds } },
        include: { category: { select: { name: true } } },
      });
    }

    // Recurring Transfers
    if (includeAll || sections.includes('transfers')) {
      data.recurringTransfers = await prisma.recurringTransfer.findMany({
        where: { userId: { in: userIds } },
        include: { category: { select: { name: true } } },
      });
    }

    // Life Events + Tasks
    if (includeAll || sections.includes('life-events')) {
      data.lifeEvents = await prisma.lifeEvent.findMany({
        where: { userId: { in: userIds } },
        include: { tasks: true },
      });
    }

    // Actions
    if (includeAll || sections.includes('actions')) {
      data.actions = await prisma.action.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Taxpayer Profile
    if (includeAll || sections.includes('taxpayer')) {
      data.taxpayerProfile = await prisma.taxpayerProfile.findFirst({
        where: { userId: { in: userIds } },
      });
    }

    if (format === 'csv') {
      // Flatten transactions to CSV
      const txs = (data.statements as any[])?.flatMap((s: any) =>
        s.transactions.map((t: any) => ({
          statement: s.fileName,
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category || '',
          hmrcMapping: t.hmrcMapping || '',
        }))
      ) || [];

      const headers = ['statement', 'date', 'description', 'amount', 'type', 'category', 'hmrcMapping'];
      const csv = [
        headers.join(','),
        ...txs.map((t: any) => headers.map(h => `"${String(t[h] || '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="homeledger-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': `attachment; filename="homeledger-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Export] Error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
