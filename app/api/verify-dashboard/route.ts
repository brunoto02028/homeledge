import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/verify-dashboard?email=xxx — Public endpoint for buyers to check their verification links
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find all verification links for this buyer email
    const links = await (prisma as any).verificationLink.findMany({
      where: { clientEmail: email.toLowerCase() },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        clientName: true,
        clientEmail: true,
        companyName: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        completedAt: true,
        subjectName: true,
      },
    });

    if (links.length === 0) {
      return NextResponse.json({ links: [], message: 'No verification links found for this email' });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://Clarity & Co.co.uk';

    const formatted = links.map((l: any) => ({
      id: l.id,
      url: `${baseUrl}/verify/${l.token}`,
      token: l.token,
      status: l.status,
      isExpired: l.expiresAt && new Date(l.expiresAt) < new Date(),
      subjectName: l.subjectName || null,
      companyName: l.companyName || null,
      expiresAt: l.expiresAt,
      createdAt: l.createdAt,
      completedAt: l.completedAt,
    }));

    const stats = {
      total: formatted.length,
      pending: formatted.filter((l: any) => l.status === 'pending' && !l.isExpired).length,
      completed: formatted.filter((l: any) => l.status === 'completed').length,
      expired: formatted.filter((l: any) => l.isExpired && l.status !== 'completed').length,
      failed: formatted.filter((l: any) => l.status === 'failed').length,
    };

    return NextResponse.json({ links: formatted, stats, clientName: links[0]?.clientName });
  } catch (error: any) {
    console.error('[Verify Dashboard API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch verification data' }, { status: 500 });
  }
}
