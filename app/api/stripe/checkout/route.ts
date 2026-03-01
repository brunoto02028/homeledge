import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
}

const PLANS: Record<string, { priceId: string; name: string }> = {
  intelligence: {
    priceId: process.env.STRIPE_PRICE_INTELLIGENCE || '',
    name: 'Intelligence',
  },
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    name: 'Starter',
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO || '',
    name: 'Pro',
  },
  business: {
    priceId: process.env.STRIPE_PRICE_BUSINESS || '',
    name: 'Business',
  },
  managed: {
    priceId: process.env.STRIPE_PRICE_MANAGED || '',
    name: 'Managed',
  },
};

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { plan } = await req.json();

    if (!PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const stripe = getStripe();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true, stripeCustomerId: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

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

    // Create checkout session with 7-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId, plan },
      },
      success_url: `${process.env.NEXTAUTH_URL}/settings?subscription=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/settings?subscription=cancelled`,
      metadata: { userId, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
