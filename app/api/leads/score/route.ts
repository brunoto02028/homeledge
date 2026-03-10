import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { routeAI } from '@/lib/ai-router';

const SCORING_SYSTEM = `You are a lead scoring AI for Clarity & Co (clarityco.co.uk), a UK household finance SaaS.
Score leads based on their likelihood to convert to a paid subscriber.

Scoring criteria:
- Business type: company/sole trader/freelancer = higher value (score boost +20)
- Source: landing page/referral = hot; blog/popup = warm; unknown = cold
- Engagement: actions (page_view, download, login) increase score
- Email quality: gmail/hotmail = consumer; business domain = professional
- Completeness: phone + business type = more serious lead

Return ONLY valid JSON, no markdown.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { leadId, force } = body;

  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  const lead = await (prisma as any).lead.findUnique({
    where: { id: leadId },
    include: { actions: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const leadSummary = `
Lead email: ${lead.email}
Name: ${lead.fullName || 'unknown'}
Phone: ${lead.phone || 'none'}
Business type: ${lead.businessType || 'unknown'}
Source: ${lead.source || 'unknown'} (${lead.sourceSlug || 'n/a'})
Notes: ${lead.notes || 'none'}
Actions (${lead.actions.length}): ${lead.actions.map((a: any) => `${a.action}(+${a.points})`).join(', ') || 'none'}
Current score: ${lead.score}
Current tag: ${lead.tag}
Subscribed: ${lead.subscribed}
Created: ${new Date(lead.createdAt).toLocaleDateString('en-GB')}
`.trim();

  const userPrompt = `Score this lead for Clarity & Co:

${leadSummary}

Return JSON:
{
  "score": <0-100>,
  "tag": "<hot|warm|cold>",
  "reasoning": "<2-3 sentences why>",
  "recommended_action": "<specific outreach suggestion>",
  "priority": "<high|medium|low>",
  "best_feature_to_pitch": "<one Clarity & Co feature most relevant to this lead>"
}`;

  const result = await routeAI('lead_score', [
    { role: 'system', content: SCORING_SYSTEM },
    { role: 'user', content: userPrompt },
  ]);

  let parsed: any;
  try {
    let content = result.content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    parsed = JSON.parse(content.trim());
  } catch {
    return NextResponse.json({ error: 'AI parsing failed', raw: result.content }, { status: 500 });
  }

  const newScore = Math.max(0, Math.min(100, parsed.score || lead.score));
  const newTag = ['hot', 'warm', 'cold'].includes(parsed.tag) ? parsed.tag : lead.tag;

  const updated = await (prisma as any).lead.update({
    where: { id: leadId },
    data: {
      score: newScore,
      tag: newTag,
      notes: lead.notes
        ? `${lead.notes}\n[AI ${new Date().toLocaleDateString('en-GB')}] ${parsed.reasoning}`
        : `[AI ${new Date().toLocaleDateString('en-GB')}] ${parsed.reasoning}`,
    },
  });

  return NextResponse.json({
    lead: updated,
    analysis: {
      score: newScore,
      tag: newTag,
      reasoning: parsed.reasoning,
      recommended_action: parsed.recommended_action,
      priority: parsed.priority,
      best_feature_to_pitch: parsed.best_feature_to_pitch,
    },
    model: result.model || result.provider,
  });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const tag = searchParams.get('tag');
  const limit = parseInt(searchParams.get('limit') || '50');

  const leads = await (prisma as any).lead.findMany({
    where: { ...(tag ? { tag } : {}) },
    include: {
      actions: { orderBy: { createdAt: 'desc' }, take: 5 },
      _count: { select: { actions: true } },
    },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });

  const stats = await (prisma as any).lead.groupBy({
    by: ['tag'],
    _count: { _all: true },
    _avg: { score: true },
  });

  return NextResponse.json({ leads, stats });
}
