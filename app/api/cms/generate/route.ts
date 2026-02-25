import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callAI } from '@/lib/ai-client';

// POST /api/cms/generate — Admin only: AI-generate content for a section
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sectionKey, prompt, currentContent } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = `You are a professional copywriter for HomeLedger — a UK personal and business finance management platform.
You write compelling, SEO-optimized marketing content in British English.
The platform helps users manage: bank statements, invoices, bills, tax reports (HMRC), secure vault, financial projections, property portfolio, product cost calculator, life events, and more.

You are generating content for the "${sectionKey}" section of the landing page.
${currentContent ? `Current content: ${JSON.stringify(currentContent)}` : ''}

IMPORTANT RULES:
- Write in British English
- Be concise, compelling, and action-oriented
- Focus on benefits, not just features
- Use power words that convert visitors
- Output valid JSON matching the expected structure for this section
- Do NOT wrap in markdown code blocks, return raw JSON only`;

    const sectionStructures: Record<string, string> = {
      hero: '{"headline": "...", "subheadline": "...", "ctaPrimary": "...", "ctaSecondary": "..."}',
      features: '{"items": [{"icon": "icon-name", "title": "...", "description": "..."}, ...]}  — generate 6-8 features',
      howItWorks: '{"steps": [{"step": 1, "title": "...", "description": "..."}, ...]}  — generate 3 steps',
      pricing: '{"plans": [{"name": "Free", "price": "£0", "period": "/mo", "features": ["..."], "cta": "...", "highlighted": false}, ...]}  — generate 3 plans',
      faq: '{"items": [{"question": "...", "answer": "..."}, ...]}  — generate 6-8 FAQ items',
      testimonials: '{"items": [{"name": "...", "role": "...", "quote": "...", "rating": 5}, ...]}  — generate 3-4 testimonials',
      cta: '{"headline": "...", "subheadline": "...", "buttonText": "..."}',
      footer: '{"links": [{"label": "...", "href": "..."}, ...], "copyright": "...", "tagline": "..."}',
      meta: '{"pageTitle": "...", "metaDescription": "...", "ogTitle": "...", "ogDescription": "...", "keywords": ["..."]}',
    };

    const structure = sectionStructures[sectionKey] || '{"content": "..."}';

    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${prompt}\n\nReturn JSON in this structure: ${structure}` },
    ], { maxTokens: 2000, temperature: 0.7 });

    const result = response.content;

    // Try to parse as JSON
    let parsed;
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { rawText: result };
    }

    return NextResponse.json({ generated: parsed });
  } catch (error) {
    console.error('Error generating CMS content:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
