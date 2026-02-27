import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
}

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

// POST - Create a new purchase with Stripe Checkout (falls back to pending if Stripe not configured)
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true, stripeCustomerId: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const stripe = getStripe();

    // If Stripe is configured and package has a price, create a checkout session
    if (stripe && pkg.priceGbp > 0) {
      // Get or create Stripe customer
      let customerId = (user as any).stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName,
          metadata: { userId },
        });
        customerId = customer.id;
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId } as any,
        });
      }

      // Create purchase record first (pending)
      const purchase = await (prisma as any).userPurchase.create({
        data: {
          userId,
          servicePackageId,
          status: 'pending',
          amountPaid: pkg.priceGbp,
          currency: pkg.currency || 'GBP',
        },
      });

      // Create Stripe checkout session for one-time payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: (pkg.currency || 'GBP').toLowerCase(),
            product_data: {
              name: pkg.title,
              description: pkg.shortDescription || `${pkg.title} — Professional service`,
            },
            unit_amount: Math.round(pkg.priceGbp * 100), // Stripe uses pence
          },
          quantity: 1,
        }],
        success_url: `${process.env.NEXTAUTH_URL}/services?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/services?purchase=cancelled`,
        metadata: { userId, purchaseId: purchase.id, servicePackageId },
      });

      return NextResponse.json({ purchase, checkoutUrl: session.url }, { status: 201 });
    }

    // Fallback: free service or Stripe not configured — mark as pending
    const purchase = await (prisma as any).userPurchase.create({
      data: {
        userId,
        servicePackageId,
        status: pkg.priceGbp === 0 ? 'paid' : 'pending',
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
