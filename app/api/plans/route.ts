import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/plans — Public: list active plans for pricing page
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        price: true,
        interval: true,
        features: true,
        isDefault: true,
        sortOrder: true,
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching public plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
