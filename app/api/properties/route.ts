import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all properties
export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const properties = await prisma.property.findMany({
      where: { userId: { in: userIds } },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(properties);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST - Create property
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { name, type, address, postcode, purchasePrice, purchaseDate, currentValue, mortgageBalance, mortgageRate, mortgageType, monthlyPayment, rentalIncome, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        userId,
        name,
        type: type || 'residential',
        address: address || null,
        postcode: postcode || null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        mortgageBalance: mortgageBalance ? parseFloat(mortgageBalance) : null,
        mortgageRate: mortgageRate ? parseFloat(mortgageRate) : null,
        mortgageType: mortgageType || null,
        monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : null,
        rentalIncome: rentalIncome ? parseFloat(rentalIncome) : null,
        notes: notes || null,
      },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'property.created',
        entityType: 'Property',
        entityId: property.id,
        payload: { name, type: type || 'residential' },
      },
    }).catch(() => {});

    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Properties] Error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
