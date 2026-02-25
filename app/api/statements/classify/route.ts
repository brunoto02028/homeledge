import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { classifyTransactions } from '@/lib/hmrc-classifier';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// POST: Classify/re-classify transactions for a statement
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const body = await request.json();
    const { statementId, transactionIds } = body;

    if (!statementId && !transactionIds) {
      return NextResponse.json(
        { error: 'Either statementId or transactionIds is required' },
        { status: 400 }
      );
    }

    // Get transactions to classify
    let transactions;
    if (statementId) {
      // Verify statement belongs to user
      const statement = await prisma.bankStatement.findFirst({ where: { id: statementId, userId: { in: userIds } } });
      if (!statement) {
        return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
      }
      transactions = await prisma.bankTransaction.findMany({
        where: { statementId }
      });
    } else {
      transactions = await prisma.bankTransaction.findMany({
        where: { id: { in: transactionIds }, statement: { userId: { in: userIds } } }
      });
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found' },
        { status: 404 }
      );
    }

    console.log(`[Classify] Processing ${transactions.length} transactions`);

    // Classify transactions
    const classifications = await classifyTransactions(
      transactions.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        type: tx.type as 'debit' | 'credit'
      }))
    );

    // Update transactions with classifications
    let updated = 0;
    let rulesApplied = 0;
    let aiClassified = 0;

    for (const tx of transactions) {
      const classification = classifications.get(tx.id);
      if (classification) {
        await prisma.bankTransaction.update({
          where: { id: tx.id },
          data: {
            suggestedCategoryId: classification.categoryId,
            categoryId: classification.source === 'rule' ? classification.categoryId : tx.categoryId,
            hmrcMapping: classification.hmrcMapping as any,
            isTaxDeductible: classification.isTaxDeductible,
            confidenceScore: classification.confidenceScore,
            aiReasoning: classification.aiReasoning,
            needsReview: classification.needsReview,
            cleanDescription: tx.cleanDescription || tx.description
          }
        });
        updated++;
        if (classification.source === 'rule') {
          rulesApplied++;
        } else {
          aiClassified++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: transactions.length,
      updated,
      rulesApplied,
      aiClassified,
      message: `Classified ${updated} transactions: ${rulesApplied} by rules, ${aiClassified} by AI`
    });
  } catch (error) {
    console.error('Error classifying transactions:', error);
    return NextResponse.json(
      { error: 'Failed to classify transactions' },
      { status: 500 }
    );
  }
}
