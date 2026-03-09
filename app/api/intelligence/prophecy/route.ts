import { NextResponse } from 'next/server';
import { analyzeArticle, generateProphecyReport, PROPHECY_THEMES, type ProphecyMatch } from '@/app/lib/prophecy-engine';

// ─── Cache ───────────────────────────────────────────────────────────────────
let cachedReport: { data: any; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  // Return cached if fresh
  if (cachedReport && Date.now() - cachedReport.ts < CACHE_TTL) {
    return NextResponse.json(cachedReport.data);
  }

  try {
    // Fetch latest news from our own news API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const newsRes = await fetch(`${baseUrl}/api/news`, {
      signal: AbortSignal.timeout(15000),
      headers: { 'Cookie': '' }, // internal call
    });

    if (!newsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch news for analysis' }, { status: 502 });
    }

    const newsData = await newsRes.json();
    const articles = (newsData.articles || []).map((a: any) => ({
      title: a.title || '',
      description: a.description || '',
      url: a.url || '',
      source: a.source || '',
      publishedAt: a.publishedAt || '',
      country: a.country || '',
      sentiment: a.sentiment || 'neutral',
      imageUrl: a.imageUrl || null,
    }));

    // Generate prophecy report
    const report = generateProphecyReport(articles);

    // Enrich with per-article prophecy analysis for top articles
    const enrichedArticles = articles
      .map((article: any) => {
        const matches = analyzeArticle(article.title, article.description);
        if (matches.length === 0) return null;
        return {
          ...article,
          prophecyMatches: matches.slice(0, 3), // top 3 prophecy matches
          topMatch: matches[0],
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.topMatch.relevanceScore - a.topMatch.relevanceScore)
      .slice(0, 50); // top 50 prophecy-related articles

    // Build category summary
    const categoryCounts: Record<string, number> = {};
    for (const summary of report.themeSummaries) {
      const cat = summary.theme.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + summary.articleCount;
    }

    const result = {
      report: {
        totalProphecyArticles: report.totalProphecyArticles,
        highRelevanceCount: report.highRelevanceCount,
        activeThemes: report.activeThemes,
        totalArticlesAnalyzed: articles.length,
      },
      themeSummaries: report.themeSummaries.map(s => ({
        id: s.theme.id,
        theme: s.theme.theme,
        category: s.theme.category,
        description: s.theme.description,
        articleCount: s.articleCount,
        averageRelevance: s.averageRelevance,
        topArticles: s.topArticles.slice(0, 3),
        scriptures: s.theme.scriptures.slice(0, 2),
      })),
      articles: enrichedArticles,
      topScriptures: report.topScriptures,
      categoryCounts,
      themes: PROPHECY_THEMES.map(t => ({
        id: t.id,
        theme: t.theme,
        category: t.category,
        description: t.description,
        scriptureCount: t.scriptures.length,
        keywordCount: t.keywords.length,
      })),
      fetchedAt: new Date().toISOString(),
    };

    cachedReport = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Prophecy API]', error.message);
    return NextResponse.json({ error: 'Prophecy analysis failed', details: error.message }, { status: 500 });
  }
}
