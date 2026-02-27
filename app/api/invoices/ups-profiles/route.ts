import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List user's submission profiles
export async function GET() {
  try {
    const userId = await requireUserId();

    const profiles = await (prisma as any).submissionProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    return NextResponse.json(profiles);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Profiles] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

// POST - Create a new submission profile
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    const {
      name, prefix, poNumber, siteCode, siteName,
      recipientEmail, senderEmail, senderName, companyName,
      companyLogo, emailSignature,
      smtpHost, smtpPort, smtpUser, smtpPass,
    } = body;

    if (!name || !poNumber || !siteCode || !siteName || !recipientEmail || !senderEmail) {
      return NextResponse.json(
        { error: 'name, poNumber, siteCode, siteName, recipientEmail, and senderEmail are required' },
        { status: 400 }
      );
    }

    const profile = await (prisma as any).submissionProfile.create({
      data: {
        userId,
        name,
        prefix: prefix || 'INVUK1',
        poNumber,
        siteCode,
        siteName,
        recipientEmail,
        senderEmail,
        senderName: senderName || 'T. Bruno',
        companyName: companyName || 'Molina Express',
        companyLogo: companyLogo || null,
        emailSignature: emailSignature || null,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort || null,
        smtpUser: smtpUser || null,
        smtpPass: smtpPass || null,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Profiles] Error:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
