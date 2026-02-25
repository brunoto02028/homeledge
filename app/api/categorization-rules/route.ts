import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// GET: List all rules (system + user's own)
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // 'system' | 'manual' | 'auto_learned' | null

    const where: any = {
      isActive: true,
      OR: [{ userId: null }, { userId }],
    };
    if (source) where.source = source;

    const rules = await (prisma as any).categorizationRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { usageCount: 'desc' }],
      include: { category: { select: { id: true, name: true, type: true, color: true, icon: true } } },
    });

    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('[CatRules] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

// POST: Create a new user rule
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    const { keyword, matchType, categoryId, patternField, transactionType, description, priority, entityId } = body;

    if (!keyword || !categoryId) {
      return NextResponse.json({ error: 'keyword and categoryId are required' }, { status: 400 });
    }

    const rule = await (prisma as any).categorizationRule.create({
      data: {
        userId,
        entityId: entityId || null,
        keyword,
        matchType: matchType || 'contains',
        patternField: patternField || 'description',
        transactionType: transactionType || null,
        categoryId,
        confidence: 1.0,
        autoApprove: true,
        priority: priority ?? 5,
        source: 'manual',
        description: description || null,
        isActive: true,
      },
      include: { category: { select: { id: true, name: true, type: true } } },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A rule with this keyword already exists' }, { status: 409 });
    }
    console.error('[CatRules] POST error:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}
