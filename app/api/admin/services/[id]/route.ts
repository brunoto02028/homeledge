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

// PUT - Update service package + sync Stripe
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id } = params;

    const existing = await (prisma as any).servicePackage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const {
      title, slug, description, shortDescription, priceGbp, originalPriceGbp,
      currency, deliverables, requirements, estimatedDays,
      category, iconEmoji, isFeatured, sortOrder, isActive,
    } = body;

    const stripe = getStripe();
    let stripePriceId = existing.stripePriceId;

    if (stripe && existing.stripeProductId) {
      // Update product name/description
      await stripe.products.update(existing.stripeProductId, {
        name: title ?? existing.title,
        description: shortDescription ?? existing.shortDescription ?? undefined,
        metadata: { slug: slug ?? existing.slug, category: category ?? existing.category ?? '' },
      });

      // If price changed, create new Stripe price (old prices are immutable)
      const newPrice = priceGbp !== undefined ? parseFloat(priceGbp) : existing.priceGbp;
      const newCurrency = currency ?? existing.currency;
      if (newPrice !== existing.priceGbp || newCurrency !== existing.currency) {
        const price = await stripe.prices.create({
          product: existing.stripeProductId,
          unit_amount: Math.round(newPrice * 100),
          currency: newCurrency.toLowerCase(),
        });
        stripePriceId = price.id;
        // Archive old price
        if (existing.stripePriceId) {
          await stripe.prices.update(existing.stripePriceId, { active: false }).catch(() => {});
        }
      }
    }

    const updateData: Record<string, any> = { stripePriceId };
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (priceGbp !== undefined) updateData.priceGbp = parseFloat(priceGbp);
    if (originalPriceGbp !== undefined) updateData.originalPriceGbp = originalPriceGbp ? parseFloat(originalPriceGbp) : null;
    if (currency !== undefined) updateData.currency = currency;
    if (deliverables !== undefined) updateData.deliverables = deliverables;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (estimatedDays !== undefined) updateData.estimatedDays = estimatedDays ? parseInt(estimatedDays) : null;
    if (category !== undefined) updateData.category = category;
    if (iconEmoji !== undefined) updateData.iconEmoji = iconEmoji;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
    if (isActive !== undefined) updateData.isActive = isActive;

    const pkg = await (prisma as any).servicePackage.update({ where: { id }, data: updateData });
    return NextResponse.json({ package: pkg, stripeSync: !!stripe });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    console.error('[Admin Services PUT]', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}

// DELETE - Hard delete from DB + delete from Stripe
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { id } = params;

    const existing = await (prisma as any).servicePackage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const stripe = getStripe();
    if (stripe) {
      // Archive prices first (required before deleting product)
      if (existing.stripePriceId) {
        await stripe.prices.update(existing.stripePriceId, { active: false }).catch(() => {});
      }
      if (existing.stripeProductId) {
        // Try hard delete first, fall back to archive if product has charges
        await stripe.products.del(existing.stripeProductId).catch(async () => {
          await stripe.products.update(existing.stripeProductId, { active: false }).catch(() => {});
        });
      }
    }

    // Hard delete from DB
    await (prisma as any).servicePackage.delete({ where: { id } });

    return NextResponse.json({ success: true, stripeSync: !!stripe });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    console.error('[Admin Services DELETE]', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
