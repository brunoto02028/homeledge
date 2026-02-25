import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List user's purchases
export async function GET() {
  try {
    const userId = await requireUserId();

    const purchases = await (prisma as any).userPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        servicePackage: {
          select: { title: true, slug: true, iconEmoji: true, category: true, estimatedDays: true },
        },
      },
    });

    return NextResponse.json({ purchases });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Purchases] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

// POST - Create a new purchase (Stripe-ready — currently marks as pending)
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { servicePackageId } = await request.json();

    if (!servicePackageId) {
      return NextResponse.json({ error: 'servicePackageId is required' }, { status: 400 });
    }

    const pkg = await (prisma as any).servicePackage.findUnique({
      where: { id: servicePackageId },
    });

    if (!pkg || !pkg.isActive) {
      return NextResponse.json({ error: 'Service package not found or inactive' }, { status: 404 });
    }

    // Check for existing pending/paid purchase of same package
    const existing = await (prisma as any).userPurchase.findFirst({
      where: {
        userId,
        servicePackageId,
        status: { in: ['pending', 'paid', 'in_progress'] },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'You already have an active purchase for this service', existingPurchase: existing }, { status: 409 });
    }

    // TODO: Integrate Stripe Checkout here
    // For now, create purchase as pending (manual payment or free trial)
    const purchase = await (prisma as any).userPurchase.create({
      data: {
        userId,
        servicePackageId,
        status: 'pending',
        amountPaid: pkg.priceGbp,
        currency: pkg.currency || 'GBP',
      },
      include: {
        servicePackage: {
          select: { title: true, slug: true, iconEmoji: true },
        },
      },
    });

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Purchases] Error:', error);
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }
}
