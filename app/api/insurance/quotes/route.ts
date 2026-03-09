import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/insurance/quotes — list user's saved quotes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const type = req.nextUrl.searchParams.get('type');
    const policyId = req.nextUrl.searchParams.get('policyId');
    const where: any = { userId };
    if (type) where.type = type;
    if (policyId) where.policyId = policyId;

    const quotes = await (prisma as any).insuranceQuote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { policy: { select: { providerName: true, type: true, premiumAmount: true, premiumFrequency: true } } },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Insurance quotes GET error:', error);
    return NextResponse.json({ error: 'Failed to load quotes' }, { status: 500 });
  }
}

// POST /api/insurance/quotes — save a new quote
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, providerName, premiumAmount, premiumFrequency, coverageAmount, excessAmount,
            coverType, features, quoteReference, expiryDate, source, notes, policyId } = body;

    if (!type || !providerName || !premiumAmount) {
      return NextResponse.json({ error: 'Missing required fields: type, providerName, premiumAmount' }, { status: 400 });
    }

    const quote = await (prisma as any).insuranceQuote.create({
      data: {
        userId,
        policyId: policyId || null,
        type,
        providerName,
        premiumAmount: parseFloat(premiumAmount),
        premiumFrequency: premiumFrequency || 'monthly',
        coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null,
        excessAmount: excessAmount ? parseFloat(excessAmount) : null,
        coverType: coverType || null,
        features: features || null,
        quoteReference: quoteReference || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        source: source || 'manual',
        notes: notes || null,
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Insurance quote POST error:', error);
    return NextResponse.json({ error: 'Failed to save quote' }, { status: 500 });
  }
}

// DELETE /api/insurance/quotes — delete a quote
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing quote id' }, { status: 400 });

    await (prisma as any).insuranceQuote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Insurance quote DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
