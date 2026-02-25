import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// PUT: Update a rule (only user's own rules)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;
    const body = await request.json();

    // Verify ownership (user can only edit their own rules)
    const existing = await (prisma as any).categorizationRule.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    // Prevent editing system rules
    if (existing.source === 'system' && existing.userId === null) {
      return NextResponse.json({ error: 'Cannot edit system rules' }, { status: 403 });
    }

    const updated = await (prisma as any).categorizationRule.update({
      where: { id },
      data: {
        keyword: body.keyword ?? existing.keyword,
        matchType: body.matchType ?? existing.matchType,
        categoryId: body.categoryId ?? existing.categoryId,
        patternField: body.patternField ?? existing.patternField,
        transactionType: body.transactionType !== undefined ? body.transactionType : existing.transactionType,
        description: body.description !== undefined ? body.description : existing.description,
        priority: body.priority ?? existing.priority,
        isActive: body.isActive ?? existing.isActive,
        autoApprove: body.autoApprove ?? existing.autoApprove,
      },
      include: { category: { select: { id: true, name: true, type: true } } },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[CatRules] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

// DELETE: Delete a rule (only user's own rules)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;

    const existing = await (prisma as any).categorizationRule.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    if (existing.source === 'system' && existing.userId === null) {
      return NextResponse.json({ error: 'Cannot delete system rules. Disable them instead.' }, { status: 403 });
    }

    await (prisma as any).categorizationRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CatRules] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
