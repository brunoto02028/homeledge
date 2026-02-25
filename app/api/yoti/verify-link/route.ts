import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST - Create a verification link for a client
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { clientName, clientEmail, companyName, expiryDays } = await request.json();

    if (!clientName) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + (expiryDays || 7) * 24 * 60 * 60 * 1000);

    const link = await (prisma as any).verificationLink.create({
      data: {
        token,
        createdById: userId,
        clientName,
        clientEmail: clientEmail || null,
        companyName: companyName || null,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://homeledger.co.uk';
    const verifyUrl = `${baseUrl}/verify/${token}`;

    return NextResponse.json({
      id: link.id,
      token,
      url: verifyUrl,
      expiresAt,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Verify Link] Error:', error);
    return NextResponse.json({ error: 'Failed to create verification link' }, { status: 500 });
  }
}

// GET - List verification links created by user
export async function GET() {
  try {
    const userId = await requireUserId();

    const links = await (prisma as any).verificationLink.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(links);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
