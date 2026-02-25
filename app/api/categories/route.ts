import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_CATEGORIES, CategoryType } from '@/lib/types';
import { requireUserId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const entityId = searchParams.get('entityId');
    const regime = searchParams.get('regime'); // 'hmrc' | 'companies_house' | 'all'

    // Determine tax regime from entity if provided
    let effectiveRegime = regime || null;
    if (entityId && !effectiveRegime) {
      try {
        const entity = await (prisma as any).entity.findUnique({
          where: { id: entityId },
          select: { type: true, taxRegime: true },
        });
        if (entity) {
          const companyTypes = ['limited_company', 'llp', 'partnership'];
          effectiveRegime = companyTypes.includes(entity.type) ? 'companies_house' : 'hmrc';
        }
      } catch { /* ignore, return all */ }
    }

    // Build where clause
    const where: any = {};
    if (type) where.type = type as CategoryType;
    if (effectiveRegime && effectiveRegime !== 'all') {
      where.taxRegime = { in: [effectiveRegime, 'universal'] };
    }

    // Return global defaults (userId=null) + user's custom categories
    let userId: string | null = null;
    try { userId = await requireUserId(); } catch { /* public access fallback */ }
    
    if (userId) {
      where.OR = [{ userId: null }, { userId }];
    } else {
      where.userId = null;
    }

    const categories = await prisma.category.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { name, description, icon, color, type } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const catData: any = {
      name,
      description,
      icon,
      color,
      type: type || 'expense',
      userId, // user-owned custom category
      taxRegime: body.taxRegime || 'universal',
      chMapping: body.chMapping || null,
      isDefault: false,
    };
    const category = await prisma.category.create({ data: catData });

    // Create event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'category.created',
        entityType: 'category',
        entityId: category.id,
        payload: { name: category.name, type: category.type },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2002' 
      ? 'Category with this name already exists' 
      : 'Failed to create category';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Seed/upgrade default categories — adds missing ones, updates existing with HMRC mappings
export async function PUT() {
  try {
    const existing = await prisma.category.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map(c => c.name.toLowerCase()));

    let created = 0;
    let updated = 0;

    for (const cat of DEFAULT_CATEGORIES) {
      const catData: any = {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isDefault: true,
      };
      // Add hmrcMapping and deductibility if present
      if ('hmrcMapping' in cat && cat.hmrcMapping) {
        catData.hmrcMapping = cat.hmrcMapping;
      }
      if ('deductibilityPercent' in cat && cat.deductibilityPercent !== undefined) {
        catData.defaultDeductibilityPercent = cat.deductibilityPercent;
      }

      if (existingNames.has(cat.name.toLowerCase())) {
        // Update existing global category with HMRC mapping and deductibility
        const existingCat = await (prisma.category as any).findFirst({ where: { name: cat.name, userId: null } });
        if (existingCat) {
          await prisma.category.update({
            where: { id: existingCat.id },
            data: {
              description: cat.description,
              ...(catData.hmrcMapping ? { hmrcMapping: catData.hmrcMapping } : {}),
              ...(catData.defaultDeductibilityPercent !== undefined ? { defaultDeductibilityPercent: catData.defaultDeductibilityPercent } : {}),
            },
          });
        }
        updated++;
      } else {
        // Create new category
        await prisma.category.create({ data: catData });
        created++;
      }
    }

    return NextResponse.json({
      message: `Categories synced: ${created} created, ${updated} updated`,
      created,
      updated,
      total: existing.length + created,
    });
  } catch (error) {
    console.error('Error seeding/upgrading categories:', error);
    return NextResponse.json({ error: 'Failed to sync categories' }, { status: 500 });
  }
}
