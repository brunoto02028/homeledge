import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { callAI } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';

// POST - Ask an educational question about UK finance/tax
export async function POST(request: Request) {
  try {
    await requireUserId();
    const { question, topic } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const systemPrompt = `You are a UK financial education assistant for HomeLedger. Your role is to explain UK tax, finance, and business concepts clearly and accurately.

Context: The user is learning about the UK financial system. They may be an immigrant, a first-time business owner, or simply looking to understand their finances better.

Topic area: ${topic || 'general UK finance'}

Guidelines:
- Always reference current UK tax years and thresholds
- Mention relevant HMRC forms, deadlines, and online services
- Include gov.uk links where helpful
- Use simple language, avoid jargon unless explaining it
- Give practical step-by-step advice when applicable
- Mention common mistakes people make
- If discussing tax rates, state the current bands clearly
- Be encouraging and supportive

Format your response in clear sections with headings if the answer is long.`;

    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ], { maxTokens: 2000, temperature: 0.3 });

    return NextResponse.json({ answer: response });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Learn] Error:', error);
    return NextResponse.json({ error: 'Failed to get answer' }, { status: 500 });
  }
}
