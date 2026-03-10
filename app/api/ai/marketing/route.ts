import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { routeAI, type AITask } from '@/lib/ai-router';

const BRAND_VOICE = `
You are the marketing AI for Clarity & Co (clarityco.co.uk) — a comprehensive UK household finance management platform.

Brand voice: Professional yet approachable. Empowering. UK-focused. Uses £ not $. 
Target audience: UK households, small business owners, freelancers, immigrants navigating UK finances.
Key USPs:
- AI-powered financial management (statements, invoices, bills, tax)
- 36+ modules in one platform (identity verification, Companies House, HMRC, insurance, vault, projections)
- UK-specific: SA100/CT600 tax returns, HMRC deadlines, Life in the UK support
- Privacy-first, built for real UK families and businesses
- Affordable alternative to expensive accountants

Always write in British English. Never use American spellings (e.g. "organise" not "organize").
Always be specific — mention real features like "bank statement categorisation", "HMRC Self Assessment", "Companies House integration".
`;

const PLATFORM_FEATURES = `
Core features to highlight: AI bank statement categorisation, HMRC tax returns (SA100/CT600), invoice management, bill tracking, secure vault for credentials, identity verification (Yoti), Companies House integration, financial health score, budget alerts, open banking (TrueLayer), insurance tracker, property portfolio, projections & goals, accountant portal with shared links, life events guidance, UK citizenship test, PDF editor, automation hub.
`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { type, topic, platform, tone, audience, keywords, length, context } = body;

  if (!type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 });
  }

  let task: AITask;
  let systemPrompt: string;
  let userPrompt: string;

  switch (type) {
    case 'social_post': {
      task = 'social_post';
      const platforms: Record<string, string> = {
        linkedin: 'LinkedIn (professional tone, 1300 chars max, use line breaks, 3-5 hashtags)',
        instagram: 'Instagram (engaging, emojis welcome, 2200 chars max, 10-15 hashtags)',
        twitter: 'X/Twitter (punchy, 280 chars max, 2-3 hashtags)',
        facebook: 'Facebook (conversational, 500 chars, 2-3 hashtags)',
      };
      const platformGuide = platforms[platform] || platforms.linkedin;
      systemPrompt = `${BRAND_VOICE}\n${PLATFORM_FEATURES}\nWrite social media posts for ${platformGuide}.`;
      userPrompt = `Create a ${platform || 'LinkedIn'} post about: "${topic}"
Tone: ${tone || 'professional and helpful'}
Target audience: ${audience || 'UK households and small business owners'}
${keywords ? `Keywords to include: ${keywords}` : ''}
${context ? `Additional context: ${context}` : ''}

Write 3 variations of the post, numbered 1, 2, 3. Separate each with ---`;
      break;
    }

    case 'blog_article': {
      task = 'blog_article';
      systemPrompt = `${BRAND_VOICE}\n${PLATFORM_FEATURES}\nYou are writing SEO-optimised blog articles for clarityco.co.uk. Articles should be helpful, informative, and naturally mention Clarity & Co features where relevant. Format with H2/H3 headings using markdown.`;
      userPrompt = `Write a comprehensive blog article about: "${topic}"
Target length: ${length || '800-1200 words'}
Tone: ${tone || 'informative and helpful'}
Target reader: ${audience || 'UK households managing their finances'}
${keywords ? `SEO keywords to include naturally: ${keywords}` : ''}
${context ? `Additional context: ${context}` : ''}

Include: title, introduction, main sections with H2 headings, practical tips, and a conclusion with CTA to try Clarity & Co.`;
      break;
    }

    case 'email_campaign': {
      task = 'email_campaign';
      systemPrompt = `${BRAND_VOICE}\n${PLATFORM_FEATURES}\nYou write high-converting email marketing campaigns. Use clear subject lines, personalisation tokens like {{first_name}}, and strong CTAs.`;
      userPrompt = `Write an email campaign sequence for: "${topic}"
Campaign goal: ${context || 'drive sign-ups to Clarity & Co'}
Target audience: ${audience || 'UK households'}
Number of emails: ${length || '3 emails (welcome, value, CTA)'}
Tone: ${tone || 'friendly and professional'}
${keywords ? `Key points to cover: ${keywords}` : ''}

For each email provide: Subject line, Preview text, Full email body with {{first_name}} personalisation. Separate emails with ---`;
      break;
    }

    case 'marketing_copy': {
      task = 'marketing_copy';
      systemPrompt = `${BRAND_VOICE}\n${PLATFORM_FEATURES}\nYou write compelling marketing copy for landing pages, ads, and promotional materials.`;
      userPrompt = `Write marketing copy for: "${topic}"
Format/placement: ${context || 'landing page hero section'}
Tone: ${tone || 'confident and benefit-focused'}
Target audience: ${audience || 'UK households and small businesses'}
${keywords ? `Key benefits/keywords: ${keywords}` : ''}
${length ? `Length: ${length}` : ''}

Include: headline, subheadline, 3-5 bullet points of key benefits, and a CTA button text.`;
      break;
    }

    case 'campaign_insight': {
      task = 'campaign_insight';
      systemPrompt = `${BRAND_VOICE}\nYou are a digital marketing analyst specialising in SaaS and fintech. Analyse campaign data and provide actionable insights.`;
      userPrompt = `Analyse this marketing data and provide insights:
${context || topic}
${keywords ? `Metrics: ${keywords}` : ''}

Provide:
1. Key findings (what's working, what isn't)
2. Top 3 recommendations to improve performance
3. Suggested A/B tests
4. Content ideas based on the data`;
      break;
    }

    case 'lead_analysis': {
      task = 'lead_score';
      systemPrompt = `${BRAND_VOICE}\nYou analyse potential customer leads for a UK fintech SaaS. Score leads 1-10 and provide qualification notes.`;
      userPrompt = `Analyse this lead for Clarity & Co:
${context || topic}

Provide:
- Score: X/10
- Fit: (High/Medium/Low)
- Reasoning: why this score
- Recommended approach: personalised outreach message
- Key pain points to address`;
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }

  const result = await routeAI(task, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  return NextResponse.json({
    content: result.content,
    provider: result.provider,
    model: result.model,
    type,
    task,
  });
}
