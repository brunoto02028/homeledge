import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Public endpoint: fetch shared data by token (no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const link = await prisma.sharedLink.findUnique({
      where: { token },
      include: { user: { select: { fullName: true } } },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Link not found or inactive' }, { status: 404 });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This shared link has expired' }, { status: 410 });
    }

    // Update access stats
    await prisma.sharedLink.update({
      where: { id: link.id },
      data: { lastUsedAt: new Date(), accessCount: { increment: 1 } },
    });

    const userId = link.userId;
    const scope = link.scope || [];
    const data: Record<string, unknown> = {
      ownerName: link.user.fullName,
      label: link.label,
      scope,
      generatedAt: new Date().toISOString(),
    };

    // Fetch data based on scope
    if (scope.includes('reports') || scope.includes('summary')) {
      const [txs, cats] = await Promise.all([
        prisma.bankTransaction.findMany({
          where: { statement: { userId } },
          include: { category: { select: { name: true, type: true, hmrcMapping: true } } },
        }),
        prisma.category.findMany({
          select: { name: true, type: true, hmrcMapping: true, defaultDeductibilityPercent: true },
        }),
      ]);

      const income = txs.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      const expenses = txs.filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

      // Group by category
      const byCategory: Record<string, { amount: number; type: string; hmrc: string | null }> = {};
      txs.forEach((t: any) => {
        const catName = t.category?.name || 'Uncategorized';
        if (!byCategory[catName]) {
          byCategory[catName] = { amount: 0, type: t.category?.type || 'expense', hmrc: t.category?.hmrcMapping || null };
        }
        byCategory[catName].amount += Math.abs(t.amount);
      });

      data.financialSummary = {
        totalIncome: Math.round(income * 100) / 100,
        totalExpenses: Math.round(expenses * 100) / 100,
        netProfit: Math.round((income - expenses) * 100) / 100,
        totalTransactions: txs.length,
        byCategory: Object.entries(byCategory)
          .map(([name, info]) => ({ name, amount: Math.round(info.amount * 100) / 100, type: info.type, hmrcMapping: info.hmrc }))
          .sort((a, b) => b.amount - a.amount),
        categories: cats,
      };
    }

    if (scope.includes('bills')) {
      const bills = await prisma.bill.findMany({
        where: { userId, isActive: true },
        include: {
          category: { select: { name: true } },
          account: { include: { provider: { select: { name: true } } } },
        },
        orderBy: { dueDay: 'asc' },
      });

      data.bills = bills.map((b: any) => ({
        name: b.billName,
        amount: b.amount,
        currency: b.currency,
        frequency: b.frequency,
        dueDay: b.dueDay,
        category: b.category?.name,
        provider: b.account?.provider?.name,
      }));
    }

    if (scope.includes('invoices')) {
      const invoices = await prisma.invoice.findMany({
        where: { userId },
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      data.invoices = invoices.map((i: any) => ({
        providerName: i.providerName,
        invoiceNumber: i.invoiceNumber,
        amount: i.amount,
        status: i.status,
        invoiceDate: i.invoiceDate,
        category: i.category?.name,
      }));
    }

    if (scope.includes('entities')) {
      const entities = await prisma.entity.findMany({
        where: { userId },
        select: { name: true, type: true, taxRegime: true, companyNumber: true, utr: true },
      });
      data.entities = entities;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[SharedLink View] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
