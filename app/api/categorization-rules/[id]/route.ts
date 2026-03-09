import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// PUT: Update a rule (only user's own rules)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;
    const body = await request.json();

    const existing = await (prisma as any).categorizationRule.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const isSystemRule = existing.source === 'system' && existing.userId === null;
    const entityId: string | null = body.entityId || null;

    // ── KEY FIX: System rule + entityId = create entity-scoped OVERRIDE ──────────
    // Instead of mutating the global rule (which would affect ALL entities),
    // we create a new user rule scoped to this entity with higher priority.
    if (isSystemRule && entityId) {
      // Check if an override already exists for this entity+keyword combination
      const overrideExists = await (prisma as any).categorizationRule.findFirst({
        where: {
          keyword: body.keyword ?? existing.keyword,
          matchType: body.matchType ?? existing.matchType,
          userId,
          entityId,
        },
      });

      if (overrideExists) {
        // Update the existing override
        const updated = await (prisma as any).categorizationRule.update({
          where: { id: overrideExists.id },
          data: {
            categoryId: body.categoryId ?? overrideExists.categoryId,
            matchType: body.matchType ?? overrideExists.matchType,
            transactionType: body.transactionType !== undefined ? (body.transactionType || null) : overrideExists.transactionType,
            description: body.description ?? overrideExists.description,
            priority: body.priority ?? overrideExists.priority,
            isActive: body.isActive ?? overrideExists.isActive,
          },
          include: { category: { select: { id: true, name: true, type: true } } },
        });
        return NextResponse.json({ ...updated, _overrideCreated: false });
      }

      // Create new entity-scoped override (higher priority than system rule)
      const override = await (prisma as any).categorizationRule.create({
        data: {
          userId,
          entityId,
          keyword: body.keyword ?? existing.keyword,
          matchType: body.matchType ?? existing.matchType,
          patternField: existing.patternField,
          transactionType: body.transactionType || existing.transactionType || null,
          categoryId: body.categoryId ?? existing.categoryId,
          confidence: 1.0,
          autoApprove: true,
          priority: (existing.priority ?? 0) + 10, // higher priority than system rule
          source: 'manual',
          description: body.description || `Override for ${entityId}: ${body.keyword ?? existing.keyword}`,
          isActive: true,
        },
        include: { category: { select: { id: true, name: true, type: true } } },
      });
      return NextResponse.json({ ...override, _overrideCreated: true }, { status: 201 });
    }

    // ── Normal edit for user/auto-learned rules or system toggle (no entityId) ──
    const updateData: Record<string, unknown> = {};
    if (isSystemRule) {
      // Only allow toggling isActive for system rules globally (no entity scope)
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
    } else {
      if (body.keyword !== undefined) updateData.keyword = body.keyword;
      if (body.matchType !== undefined) updateData.matchType = body.matchType;
      if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
      if (body.patternField !== undefined) updateData.patternField = body.patternField;
      if (body.transactionType !== undefined) updateData.transactionType = body.transactionType || null;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.autoApprove !== undefined) updateData.autoApprove = body.autoApprove;
      if (body.entityId !== undefined) updateData.entityId = body.entityId || null;
    }

    const updated = await (prisma as any).categorizationRule.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true, type: true } } },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'A rule with this keyword already exists for this entity' }, { status: 409 });
    }
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
