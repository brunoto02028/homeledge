import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPermissionsForPlan } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const body = await req.json().catch(() => ({}));

    let userId: string;
    let userEmail: string;
    let userName: string;

    // ── Flow 1: Logged-in user ──────────────────────────────────────
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id;

    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true, email: true, fullName: true, stripeCustomerId: true, plan: true } as any,
      });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const activePlans = ['intelligence', 'starter', 'pro', 'business', 'managed'];
      if (activePlans.includes((user as any).plan)) {
        return NextResponse.json({ error: 'Already subscribed', redirect: '/intelligence' }, { status: 400 });
      }

      userId = (user as any).id;
      userEmail = (user as any).email;
      userName = (user as any).fullName;

    // ── Flow 2: New user — inline registration ──────────────────────
    } else {
      const { email, fullName, password } = body;
      if (!email || !fullName || !password) {
        return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return NextResponse.json({ error: 'Email already registered. Please sign in first.', loginRequired: true }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const permissions = getPermissionsForPlan('intelligence');

      const newUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            role: 'user',
            status: 'active',
            emailVerified: true,
            plan: 'none',
            permissions,
            onboardingCompleted: true,
          } as any,
        });
        const household = await tx.household.create({
          data: { name: `${fullName}'s Household`, ownerId: u.id },
        });
        await tx.membership.create({
          data: { userId: u.id, householdId: household.id, role: 'owner' },
        });
        return u;
      });

      userId = newUser.id;
      userEmail = newUser.email;
      userName = newUser.fullName;
    }

    // ── Create Stripe customer + checkout ────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true } as any,
    });

    let customerId = (dbUser as any)?.stripeCustomerId;
    if (!customerId) {
      const customer = await (stripe.customers as any).create({
        email: userEmail,
        name: userName,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId } as any,
      });
    }

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
            unit_amount: 299,
            recurring: { interval: 'month' as const },
          },
          quantity: 1,
        }];

    const checkoutSession = await stripe.checkout.sessions.create({
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

    return NextResponse.json({ url: checkoutSession.url, newAccount: !sessionUserId });
  } catch (error: any) {
    console.error('[Intelligence Checkout] Error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
