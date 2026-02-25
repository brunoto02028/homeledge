import { NextRequest, NextResponse } from 'next/server';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { recordFeedback } from '@/lib/categorization-engine';

// PATCH: Update transaction category + record feedback for learning
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id: transactionId } = await params;
    const body = await request.json();
    const { categoryId, learnRule = true } = body;

    const { prisma } = await import('@/lib/db');

    // Verify transaction belongs to user's statement
    const existing = await prisma.bankTransaction.findFirst({
      where: { id: transactionId, statement: { userId: { in: userIds } } },
      include: { category: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }

    // Get the new category
    const newCategory = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!newCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Update the transaction
    await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        categoryId,
        hmrcMapping: newCategory.hmrcMapping,
        isTaxDeductible: newCategory.type === 'expense' && newCategory.hmrcMapping !== 'none',
        needsReview: false,
        isApproved: true,
      },
    });

    // Record feedback for the 4-layer engine (Layer 4: Feedback Loop)
    let ruleCreated = false;
    if (learnRule && existing.categoryId !== categoryId) {
      try {
        const feedbackResult = await recordFeedback({
          userId,
          transactionId,
          transactionText: existing.description,
          merchantName: undefined,
          amount: existing.amount,
          suggestedCategory: existing.category?.name || 'none',
          suggestedCategoryId: existing.categoryId || undefined,
          finalCategory: newCategory.name,
          finalCategoryId: categoryId,
        });
        ruleCreated = feedbackResult.ruleCreated;
      } catch (fbErr) {
        console.error('[Categorize] Feedback recording error (non-fatal):', fbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: ruleCreated
        ? 'Category updated and new auto-rule created from repeated corrections!'
        : 'Category updated. The system will learn from this correction.',
      ruleCreated,
    });
  } catch (error) {
    console.error('Error categorizing transaction:', error);
    return NextResponse.json({ error: 'Failed to categorize transaction' }, { status: 500 });
  }
}
