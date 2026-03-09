import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

async function requireAdmin() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'admin') throw new Error('FORBIDDEN');
  return userId;
}

export const dynamic = 'force-dynamic';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
}

// GET - List all service packages (admin sees inactive too)
export async function GET() {
  try {
    await requireAdmin();
    const packages = await (prisma as any).servicePackage.findMany({
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    });
    return NextResponse.json({ packages });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - Create service package + Stripe product
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const {
      title, slug, description, shortDescription, priceGbp, originalPriceGbp,
      currency = 'GBP', deliverables = [], requirements = [], estimatedDays,
      category, iconEmoji, isFeatured = false, sortOrder = 0, isActive = true,
    } = body;

    if (!title || !slug || !description || !priceGbp) {
      return NextResponse.json({ error: 'title, slug, description, priceGbp are required' }, { status: 400 });
    }

    let stripeProductId: string | null = null;
    let stripePriceId: string | null = null;

    const stripe = getStripe();
    if (stripe) {
      const product = await stripe.products.create({
        name: title,
        description: shortDescription || description.substring(0, 255),
        metadata: { slug, category: category || '', platform: 'clarityco' },
      });
      stripeProductId = product.id;

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(priceGbp * 100),
        currency: currency.toLowerCase(),
      });
      stripePriceId = price.id;
    }

    const pkg = await (prisma as any).servicePackage.create({
      data: {
        title, slug, description, shortDescription, priceGbp: parseFloat(priceGbp),
        originalPriceGbp: originalPriceGbp ? parseFloat(originalPriceGbp) : null,
        currency, deliverables, requirements,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        category, iconEmoji, isFeatured, sortOrder: parseInt(sortOrder), isActive,
        stripeProductId, stripePriceId,
      },
    });

    return NextResponse.json({ package: pkg, stripeSync: !!stripe });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    console.error('[Admin Services POST]', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
