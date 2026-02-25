import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET - List all bank statements (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const entityId = searchParams.get('entityId');

    const where: any = { userId: { in: userIds } };
    if (accountId) where.accountId = accountId;
    if (entityId) where.entityId = entityId;
    const statements = await prisma.bankStatement.findMany({
      where,
      include: {
        account: {
          include: {
            provider: true,
          },
        },
        transactions: {
          include: {
            category: true,
          },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { statementDate: 'desc' },
    });

    return NextResponse.json(statements);
  } catch (error) {
    console.error('Error fetching statements:', error);
    return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 });
  }
}

// POST - Create new bank statement (with userId)
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = await request.json();

    const statement = await prisma.bankStatement.create({
      data: {
        fileName: data.fileName,
        cloudStoragePath: data.cloudStoragePath,
        accountId: data.accountId || null,
        entityId: data.entityId || null,
        userId,
        periodStart: data.periodStart ? new Date(data.periodStart) : null,
        periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
        totalCredits: data.totalCredits || 0,
        totalDebits: data.totalDebits || 0,
        openingBalance: data.openingBalance || null,
        closingBalance: data.closingBalance || null,
        extractedText: data.extractedText || null,
        parseStatus: data.parseStatus || 'needs_review',
        parseError: data.parseError || null,
      },
      include: {
        account: {
          include: {
            provider: true,
          },
        },
      },
    });

    // Create transactions if provided
    if (data.transactions && data.transactions.length > 0) {
      const createdTransactions = [];
      const duplicates = [];

      for (const tx of data.transactions) {
        try {
          const created = await prisma.bankTransaction.create({
            data: {
              statementId: statement.id,
              date: new Date(tx.date),
              description: tx.description,
              reference: tx.reference || null,
              amount: tx.amount,
              type: tx.type === 'credit' ? 'credit' : 'debit',
              balance: tx.balance || null,
              categoryId: tx.categoryId || null,
              notes: tx.notes || null,
            },
          });
          createdTransactions.push(created);
        } catch (err: any) {
          if (err.code === 'P2002') {
            duplicates.push(tx);
          } else {
            throw err;
          }
        }
      }

      // Update totals
      const totals = await prisma.bankTransaction.aggregate({
        where: { statementId: statement.id },
        _sum: {
          amount: true,
        },
      });

      const credits = await prisma.bankTransaction.aggregate({
        where: { statementId: statement.id, type: 'credit' },
        _sum: { amount: true },
      });

      const debits = await prisma.bankTransaction.aggregate({
        where: { statementId: statement.id, type: 'debit' },
        _sum: { amount: true },
      });

      await prisma.bankStatement.update({
        where: { id: statement.id },
        data: {
          totalCredits: credits._sum.amount || 0,
          totalDebits: Math.abs(debits._sum.amount || 0),
        },
      });

      // Count how many were auto-categorized
      const categorizedCount = createdTransactions.filter(tx => tx.categoryId !== null).length;

      return NextResponse.json({
        statement,
        transactionsCreated: createdTransactions.length,
        duplicatesSkipped: duplicates.length,
        categorizedCount,
      });
    }

    return NextResponse.json({ statement });
  } catch (error) {
    console.error('Error creating statement:', error);
    return NextResponse.json({ error: 'Failed to create statement' }, { status: 500 });
  }
}
