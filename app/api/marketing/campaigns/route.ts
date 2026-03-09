import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const campaigns = await (prisma as any).emailCampaign.findMany({
      include: { template: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(campaigns);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { name, subject, bodyHtml, segment, templateId, scheduledAt, status } = await req.json();
    if (!name || !subject) return NextResponse.json({ error: 'name and subject required' }, { status: 400 });

    const campaign = await (prisma as any).emailCampaign.create({
      data: {
        name, subject, bodyHtml, segment: segment || 'all',
        templateId: templateId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: status || 'draft',
        createdBy: userId,
      },
    });

    // Send immediately if status is 'sending'
    if (status === 'sending') {
      sendCampaignNow(campaign.id, segment, subject, bodyHtml).catch(console.error);
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function sendCampaignNow(campaignId: string, segment: string, subject: string, bodyHtml: string) {
  try {
    // Build recipient list from leads
    const where: any = { subscribed: true };
    if (segment === 'hot') where.tag = 'hot';
    else if (segment === 'warm') where.tag = 'warm';
    else if (segment === 'cold') where.tag = 'cold';

    const leads = await (prisma as any).lead.findMany({
      where,
      select: { email: true, fullName: true },
    });

    let sent = 0;
    for (const lead of leads) {
      const personalised = bodyHtml.replace(/\{\{name\}\}/g, lead.fullName || 'there');
      try {
        await sendEmail(lead.email, subject, personalised);
        sent++;
      } catch { /* skip failed individual sends */ }
    }

    await (prisma as any).emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'sent', sentAt: new Date(), totalSent: sent },
    });
  } catch (err) {
    await (prisma as any).emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'failed' },
    });
  }
}
