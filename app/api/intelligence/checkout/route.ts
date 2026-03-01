import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
}

export async function POST() {
  try {
    const userId = await requireUserId();
    const stripe = getStripe();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true, stripeCustomerId: true, plan: true } as any,
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Already subscribed to intelligence or higher plan
    const activePlans = ['intelligence', 'starter', 'pro', 'business', 'managed'];
    if (activePlans.includes((user as any).plan)) {
      return NextResponse.json({ error: 'Already subscribed', redirect: '/intelligence' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = (user as any).stripeCustomerId;
    if (!customerId) {
      const customer = await (stripe.customers as any).create({
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

    // Use STRIPE_PRICE_INTELLIGENCE if available, otherwise create price inline
    const priceId = process.env.STRIPE_PRICE_INTELLIGENCE;

    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'HomeLedger Intelligence',
              description: 'Real-time global intelligence dashboard — news, military tracking, earthquakes, economic data',
            },
            unit_amount: 299, // £2.99
            recurring: { interval: 'month' as const },
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId, plan: 'intelligence' },
      },
      success_url: `${process.env.NEXTAUTH_URL}/intelligence?subscription=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/intelligence/subscribe?subscription=cancelled`,
      metadata: { userId, plan: 'intelligence' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Login required', loginRequired: true }, { status: 401 });
    }
    console.error('[Intelligence Checkout] Error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
