import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { getPermissionsForPlan } from '@/lib/permissions';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        // Handle IDV purchases (no auth, one-time payment)
        if (session.metadata?.type === 'idv_purchase') {
          const checks = parseInt(session.metadata.checks || '1');
          const validityDays = parseInt(session.metadata.validityDays || '30');
          const customerName = session.metadata.customerName || 'Customer';
          const customerEmail = session.metadata.customerEmail || '';
          const companyName = session.metadata.companyName || null;

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + validityDays);

          for (let i = 0; i < checks; i++) {
            const token = crypto.randomBytes(24).toString('hex');
            await (prisma as any).verificationLink.create({
              data: {
                token,
                createdById: `stripe_${session.id}`,
                clientName: customerName,
                clientEmail: customerEmail,
                companyName,
                status: 'pending',
                expiresAt,
              },
            });
          }
          console.log(`[Stripe Webhook] IDV purchase: ${checks} links generated for ${customerEmail}`);
          break;
        }

        // Handle subscription plan upgrades
        if (userId && plan) {
          const permissions = getPermissionsForPlan(plan);
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              plan,
              permissions,
            } as any,
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId } as any,
        });

        if (user) {
          // Extend plan expiry
          const periodEnd = invoice.lines.data[0]?.period?.end;
          if (periodEnd) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                planExpiresAt: new Date(periodEnd * 1000),
              } as any,
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId } as any,
        });

        if (user) {
          const status = subscription.status;
          if (status === 'active' || status === 'trialing') {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                stripeSubscriptionId: subscription.id,
                planExpiresAt: new Date(subscription.current_period_end * 1000),
              } as any,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId } as any,
        });

        if (user) {
          const freePerms = getPermissionsForPlan('free');
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: 'free',
              stripeSubscriptionId: null,
              planExpiresAt: null,
              permissions: freePerms,
            } as any,
          });
        }
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
