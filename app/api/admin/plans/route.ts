import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/plans — Admin only: list all plans
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

// POST /api/admin/plans — Admin only: create a plan
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, displayName, price, interval, features, limits, isActive, isDefault, sortOrder } = await req.json();

    if (!name || !displayName) {
      return NextResponse.json({ error: 'name and displayName are required' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.subscriptionPlan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        price: price || 0,
        interval: interval || 'monthly',
        features: features || [],
        limits: limits || {},
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A plan with this name already exists' }, { status: 409 });
    }
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
