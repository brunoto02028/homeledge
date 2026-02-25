import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// PUT - Update transaction (category, notes, description, amount, date, type)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const data = await request.json();

    // Verify transaction belongs to user's statement
    const existing = await prisma.bankTransaction.findFirst({ where: { id, statement: { userId: { in: userIds } } } });
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isReconciled !== undefined) updateData.isReconciled = data.isReconciled;
    if (data.isApproved !== undefined) updateData.isApproved = data.isApproved;
    if (data.appliedDeductibilityPercent !== undefined) {
      updateData.appliedDeductibilityPercent = Math.max(0, Math.min(100, parseInt(data.appliedDeductibilityPercent) || 0));
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.type !== undefined) updateData.type = data.type;

    const transaction = await prisma.bankTransaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        statement: true,
      },
    });

    // Update statement totals if amount or type changed
    if (data.amount !== undefined || data.type !== undefined) {
      const credits = await prisma.bankTransaction.aggregate({
        where: { statementId: transaction.statementId, type: 'credit' },
        _sum: { amount: true },
      });

      const debits = await prisma.bankTransaction.aggregate({
        where: { statementId: transaction.statementId, type: 'debit' },
        _sum: { amount: true },
      });

      await prisma.bankStatement.update({
        where: { id: transaction.statementId },
        data: {
          totalCredits: credits._sum.amount || 0,
          totalDebits: Math.abs(debits._sum.amount || 0),
        },
      });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE - Delete a single transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;

    // Verify transaction belongs to user's statement
    const existing = await prisma.bankTransaction.findFirst({ where: { id, statement: { userId: { in: userIds } } } });
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = await prisma.bankTransaction.delete({
      where: { id },
    });

    // Update statement totals
    const credits = await prisma.bankTransaction.aggregate({
      where: { statementId: transaction.statementId, type: 'credit' },
      _sum: { amount: true },
    });

    const debits = await prisma.bankTransaction.aggregate({
      where: { statementId: transaction.statementId, type: 'debit' },
      _sum: { amount: true },
    });

    await prisma.bankStatement.update({
      where: { id: transaction.statementId },
      data: {
        totalCredits: credits._sum.amount || 0,
        totalDebits: Math.abs(debits._sum.amount || 0),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
