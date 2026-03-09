import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai-client';
import { UK_PRICE_RANGES, COMPARISON_LINKS } from '@/lib/insurance-data';

// POST /api/insurance/advisor — AI-powered insurance quote advisor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, details } = body;

    if (!type) {
      return NextResponse.json({ error: 'Insurance type is required' }, { status: 400 });
    }

    // Fetch user's existing policies for context
    const existingPolicies = await (prisma as any).insurancePolicy.findMany({
      where: { userId, type },
      select: {
        providerName: true, premiumAmount: true, premiumFrequency: true,
        coverageAmount: true, excessAmount: true, coverType: true,
        ncdYears: true, startDate: true, endDate: true, isActive: true,
      },
    });

    // Fetch saved quotes for this type
    const savedQuotes = await (prisma as any).insuranceQuote.findMany({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { providerName: true, premiumAmount: true, premiumFrequency: true, coverageAmount: true, excessAmount: true },
    });

    // Get market data
    const priceRange = UK_PRICE_RANGES[type];
    const comparisonSites = COMPARISON_LINKS.filter(l => l.types.includes(type));

    // Build the AI prompt
    const systemPrompt = `You are an expert UK insurance advisor for Clarity & Co. You help users understand insurance pricing, find the best deals, and make informed decisions. You are NOT an FCA-regulated adviser — always include a disclaimer that this is general guidance only.

IMPORTANT RULES:
- Always use £ for amounts
- Respond in the same language the user writes in (English or Portuguese)
- Give specific, actionable advice based on the user's situation
- Reference UK market averages when available
- Never guarantee specific prices — always say "estimated" or "typical"
- Include comparison site recommendations
- Be direct and practical`;

    const userPrompt = `The user wants advice on ${type} insurance in the UK.

${priceRange ? `UK Market Data for ${type} insurance:
- Typical monthly range: £${priceRange.monthlyLow} - £${priceRange.monthlyHigh}/month
- Key pricing factors: ${priceRange.factors.join(', ')}` : ''}

${existingPolicies.length > 0 ? `User's existing ${type} policies:
${JSON.stringify(existingPolicies.map((p: any) => ({
  provider: p.providerName,
  premium: `£${p.premiumAmount}/${p.premiumFrequency}`,
  cover: p.coverageAmount ? `£${p.coverageAmount}` : 'N/A',
  excess: p.excessAmount ? `£${p.excessAmount}` : 'N/A',
  coverType: p.coverType,
  ncd: p.ncdYears ? `${p.ncdYears} years` : 'N/A',
  renewal: p.endDate ? new Date(p.endDate).toLocaleDateString('en-GB') : 'N/A',
  active: p.isActive,
})))}` : 'User has no existing policies of this type.'}

${savedQuotes.length > 0 ? `User's saved quotes for comparison:
${JSON.stringify(savedQuotes.map((q: any) => ({
  provider: q.providerName,
  premium: `£${q.premiumAmount}/${q.premiumFrequency}`,
  cover: q.coverageAmount ? `£${q.coverageAmount}` : 'N/A',
  excess: q.excessAmount ? `£${q.excessAmount}` : 'N/A',
})))}` : ''}

User's additional details/question:
${details || 'General advice on finding the best deal'}

Comparison sites available: ${comparisonSites.map(s => s.name).join(', ')}

Please provide:
1. **Estimated Price Range** — based on their details and UK market data
2. **Key Recommendations** — specific to their situation (2-4 bullet points)
3. **Money-Saving Tips** — actionable steps to reduce premiums (3-5 tips)
4. **Where to Compare** — recommend specific comparison sites with brief description
5. **⚠️ Disclaimer** — that this is general guidance, not regulated financial advice

Format your response with clear headings and be concise but thorough.`;

    const result = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { maxTokens: 1500, temperature: 0.6 });

    const advice = result.content || 'Sorry, I could not generate advice at this time.';

    return NextResponse.json({
      advice,
      marketData: priceRange ? {
        monthlyLow: priceRange.monthlyLow,
        monthlyHigh: priceRange.monthlyHigh,
        factors: priceRange.factors,
      } : null,
      comparisonLinks: comparisonSites.map(s => ({ name: s.name, url: s.url })),
      existingPoliciesCount: existingPolicies.length,
      savedQuotesCount: savedQuotes.length,
    });
  } catch (error) {
    console.error('Insurance advisor error:', error);
    return NextResponse.json({ error: 'Failed to get insurance advice' }, { status: 500 });
  }
}
