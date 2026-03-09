import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function computeTag(score: number): string {
  if (score >= 50) return 'hot';
  if (score >= 20) return 'warm';
  return 'cold';
}

// GET - list leads (admin)
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (tag) where.tag = tag;
    if (search) where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];

    const [leads, total] = await Promise.all([
      (prisma as any).lead.findMany({
        where,
        include: { _count: { select: { actions: true } } },
        orderBy: { score: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).lead.count({ where }),
    ]);

    const stats = await (prisma as any).lead.groupBy({
      by: ['tag'],
      _count: { id: true },
    });

    return NextResponse.json({ leads, total, page, pages: Math.ceil(total / limit), stats });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - capture a new lead (public endpoint — no auth required)
export async function POST(req: Request) {
  try {
    const { email, fullName, phone, businessType, source, sourceSlug } = await req.json();
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();

    // Upsert lead (if already exists, update and add points)
    let lead = await (prisma as any).lead.findUnique({ where: { email: normalizedEmail } });

    if (lead) {
      // Add form_submit action if not subscribed yet
      const newScore = Math.min(lead.score + 10, 100);
      lead = await (prisma as any).lead.update({
        where: { email: normalizedEmail },
        data: {
          fullName: fullName || lead.fullName,
          phone: phone || lead.phone,
          businessType: businessType || lead.businessType,
          subscribed: true,
          score: newScore,
          tag: computeTag(newScore),
        },
      });
    } else {
      lead = await (prisma as any).lead.create({
        data: {
          email: normalizedEmail,
          fullName,
          phone,
          businessType,
          source: source || 'website',
          sourceSlug,
          score: 10,
          tag: 'cold',
        },
      });
    }

    // Log action
    await (prisma as any).leadAction.create({
      data: {
        leadId: lead.id,
        action: 'form_submit',
        points: 10,
        meta: { source, sourceSlug },
      },
    });

    // Notify admin if lead turned hot
    if (lead.tag === 'hot') {
      try {
        const { sendEmail } = await import('@/lib/email');
        const adminUsers = await (prisma as any).user.findMany({
          where: { role: 'admin' },
          select: { email: true },
        });
        for (const admin of adminUsers) {
          await sendEmail(
            admin.email,
            `🔥 Hot Lead: ${lead.email}`,
            `<p>Lead <strong>${lead.email}</strong> (${lead.fullName || 'Unknown'}) just reached <strong>hot</strong> status with score ${lead.score}.</p><p>Source: ${lead.source}</p>`
          );
        }
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error: any) {
    console.error('[Leads POST]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
