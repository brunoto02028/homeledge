import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
}

const IDV_PLANS: Record<string, { price: number; checks: number; name: string; validityDays: number }> = {
  'single-check': { price: 299, checks: 1, name: 'Single Check', validityDays: 30 },
  'business-pack': { price: 1999, checks: 10, name: 'Business Pack', validityDays: 60 },
  'enterprise': { price: 4999, checks: 50, name: 'Enterprise', validityDays: 90 },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, customerName, customerEmail, companyName, purpose } = body;

    if (!planId || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const plan = IDV_PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Identity Verification — ${plan.name}`,
              description: `${plan.checks} identity verification check${plan.checks > 1 ? 's' : ''} (${plan.validityDays}-day validity)`,
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'idv_purchase',
        planId,
        checks: String(plan.checks),
        validityDays: String(plan.validityDays),
        customerName,
        customerEmail,
        companyName: companyName || '',
        purpose: purpose || '',
      },
      success_url: `${process.env.NEXTAUTH_URL}/verify-purchase?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/verify-purchase?status=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[Stripe IDV Checkout] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 });
  }
}
