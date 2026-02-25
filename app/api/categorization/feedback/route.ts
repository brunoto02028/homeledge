import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { recordFeedback } from '@/lib/categorization-engine';

// POST: Record category correction feedback
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    const { transactionId, transactionText, merchantName, amount, suggestedCategory, suggestedCategoryId, finalCategory, finalCategoryId, entityId } = body;

    if (!transactionText || !finalCategory || !finalCategoryId) {
      return NextResponse.json({ error: 'transactionText, finalCategory, finalCategoryId are required' }, { status: 400 });
    }

    const result = await recordFeedback({
      userId,
      entityId: entityId || undefined,
      transactionId: transactionId || undefined,
      transactionText,
      merchantName: merchantName || undefined,
      amount: amount || undefined,
      suggestedCategory: suggestedCategory || 'none',
      suggestedCategoryId: suggestedCategoryId || undefined,
      finalCategory,
      finalCategoryId,
    });

    return NextResponse.json({
      feedbackId: result.feedbackId,
      ruleCreated: result.ruleCreated,
      message: result.ruleCreated
        ? 'Feedback recorded and auto-rule created from repeated corrections!'
        : 'Feedback recorded. System will learn from this correction.',
    });
  } catch (error: any) {
    console.error('[CatFeedback] POST error:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}
