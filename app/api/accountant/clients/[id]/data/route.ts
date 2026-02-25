import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// GET - Fetch client's financial data (delegated read-only access)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'overview';

    // Verify accountant role and active client relationship
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== 'accountant') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const relationship = await (prisma as any).accountantClient.findFirst({
      where: { id, accountantId: userId, status: 'active' },
    });
    if (!relationship || !relationship.clientId) {
      return NextResponse.json({ error: 'Client not found or not active' }, { status: 404 });
    }

    const clientId = relationship.clientId;

    // Update last accessed
    await (prisma as any).accountantClient.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });

    // Fetch data based on requested section
    const data: any = { clientId, section };

    if (section === 'overview' || section === 'all') {
      const [entities, statements, invoices, bills, categories] = await Promise.all([
        (prisma as any).entity.findMany({ where: { userId: clientId }, select: { id: true, name: true, type: true, companyNumber: true, status: true } }),
        prisma.bankStatement.findMany({ where: { userId: clientId }, select: { id: true, fileName: true, statementDate: true, totalCredits: true, totalDebits: true, parseStatus: true }, orderBy: { statementDate: 'desc' }, take: 10 }),
        (prisma.invoice as any).findMany({ where: { userId: clientId }, select: { id: true, invoiceNumber: true, clientName: true, totalAmount: true, status: true, issueDate: true }, orderBy: { issueDate: 'desc' }, take: 10 }),
        (prisma.bill as any).findMany({ where: { userId: clientId }, select: { id: true, billName: true, amount: true, frequency: true, dueDay: true, isActive: true }, orderBy: { dueDay: 'asc' } }),
        prisma.category.findMany({ where: { OR: [{ userId: null }, { userId: clientId }] } as any }),
      ]);

      data.entities = entities;
      data.recentStatements = statements;
      data.recentInvoices = invoices;
      data.bills = bills;
      data.categoryCount = categories.length;

      // Summary stats
      const allStatements = await prisma.bankStatement.findMany({ where: { userId: clientId }, select: { totalCredits: true, totalDebits: true } });
      data.totalCredits = allStatements.reduce((s: number, st: any) => s + st.totalCredits, 0);
      data.totalDebits = allStatements.reduce((s: number, st: any) => s + st.totalDebits, 0);
      data.statementCount = allStatements.length;
      data.invoiceCount = await prisma.invoice.count({ where: { userId: clientId } });
      data.billCount = await prisma.bill.count({ where: { userId: clientId } });
    }

    if (section === 'statements' || section === 'all') {
      data.statements = await prisma.bankStatement.findMany({
        where: { userId: clientId },
        include: { transactions: { include: { category: true }, orderBy: { date: 'desc' } } },
        orderBy: { statementDate: 'desc' },
      });
    }

    if (section === 'invoices' || section === 'all') {
      data.invoices = await (prisma.invoice as any).findMany({
        where: { userId: clientId },
        include: { category: true },
        orderBy: { issueDate: 'desc' },
      });
    }

    if (section === 'bills' || section === 'all') {
      data.bills = await (prisma.bill as any).findMany({
        where: { userId: clientId },
        include: { account: { include: { provider: true } }, category: true },
        orderBy: { dueDay: 'asc' },
      });
    }

    if (section === 'entities' || section === 'all') {
      data.entities = await (prisma as any).entity.findMany({
        where: { userId: clientId },
      });
    }

    if (section === 'documents' || section === 'all') {
      data.documents = await prisma.scannedDocument.findMany({
        where: { userId: clientId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Accountant] GET client data error:', error);
    return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 });
  }
}
