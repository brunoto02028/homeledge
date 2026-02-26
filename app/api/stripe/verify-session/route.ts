import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ success: false, error: 'Payment not completed' }, { status: 400 });
    }

    const metadata = session.metadata || {};
    if (metadata.type !== 'idv_purchase') {
      return NextResponse.json({ success: false, error: 'Invalid session type' }, { status: 400 });
    }

    const checks = parseInt(metadata.checks || '1');
    const validityDays = parseInt(metadata.validityDays || '30');
    const customerName = metadata.customerName || 'Customer';
    const customerEmail = metadata.customerEmail || '';
    const companyName = metadata.companyName || null;

    // Check if links already generated for this session (idempotency)
    const existing = await (prisma as any).verificationLink.findMany({
      where: { createdById: `stripe_${sessionId}` },
    });

    if (existing.length > 0) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://homeledger.co.uk';
      return NextResponse.json({
        success: true,
        email: customerEmail,
        links: existing.map((l: any) => ({
          url: `${baseUrl}/verify/${l.token}`,
          token: l.token,
          expiresAt: l.expiresAt,
        })),
      });
    }

    // Generate verification links
    const links = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    for (let i = 0; i < checks; i++) {
      const token = crypto.randomBytes(24).toString('hex');
      const link = await (prisma as any).verificationLink.create({
        data: {
          token,
          createdById: `stripe_${sessionId}`,
          clientName: customerName,
          clientEmail: customerEmail,
          companyName,
          status: 'pending',
          expiresAt,
        },
      });
      const baseUrl = process.env.NEXTAUTH_URL || 'https://homeledger.co.uk';
      links.push({
        url: `${baseUrl}/verify/${link.token}`,
        token: link.token,
        expiresAt: link.expiresAt,
      });
    }

    // TODO: Send email with links to customerEmail (integrate with email service)

    return NextResponse.json({
      success: true,
      email: customerEmail,
      planName: metadata.planId,
      checks,
      links,
    });
  } catch (error: any) {
    console.error('[Stripe Verify Session] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to verify session' }, { status: 500 });
  }
}
