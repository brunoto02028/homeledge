import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function estimateReadingMins(content: string) {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { type, topic, language = 'both', tone = 'professional' } = body;

    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }
    if (type !== 'save_blog_post' && !topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    let result: any = {};

    switch (type) {
      case 'blog_post': {
        const aiRes = await callAI([
          {
            role: 'system',
            content: `You are a senior bilingual (EN/PT-BR) SEO content strategist and financial journalist for Clarity & Co — a UK financial management platform for immigrants, freelancers and self-employed people.

Your articles must:
- Be LONG-FORM (minimum 2500 words in English, 2000 in Portuguese)
- Use professional journalistic tone with clear structure
- Include REAL, ACCURATE links to official sources: HMRC (gov.uk/hmrc), Companies House (gov.uk/companies-house), GOV.UK pages, ONS data, ACAS, FCA
- Cite official statistics and figures where relevant
- Include practical step-by-step guides with numbered lists
- Use proper HTML: <h2>, <h3>, <p>, <ul><li>, <ol><li>, <strong>, <em>, <blockquote>, <a href="...">
- Add callout boxes as: <div class="callout-info"><strong>💡 Key Point:</strong> ...</div>
- Add warning boxes as: <div class="callout-warning"><strong>⚠️ Important:</strong> ...</div>
- Add official reference links inline: <a href="https://www.gov.uk/..." target="_blank" rel="noopener">anchor text</a>
- Structure: Introduction → Sections with H2/H3 → Practical Steps → Official Resources → FAQ → Conclusion
- ALWAYS return valid JSON only, no markdown fences.`,
          },
          {
            role: 'user',
            content: `Generate a comprehensive, long-form, SEO-optimised blog article about: "${topic}"

The article should be authoritative, well-researched and suitable for ranking on Google for UK immigrants, freelancers and self-employed people. Include real HMRC and GOV.UK links where relevant.

Output a JSON object with these EXACT fields (no extras, no missing):
{
  "titleEn": "SEO-optimised H1 title in English (50-60 chars, include primary keyword)",
  "titlePt": "Same title in Portuguese (Brazil)",
  "excerptEn": "Compelling meta excerpt in English (150-160 chars, includes keyword, entices click)",
  "excerptPt": "Same in Portuguese (Brazil)",
  "contentEn": "FULL article HTML in English. Minimum 2500 words. Use: <h2> for major sections, <h3> for subsections, <p> for paragraphs, <ul><li> for lists, <ol><li> for steps, <strong> for emphasis, <blockquote> for quotes, <a href='URL' target='_blank' rel='noopener'>text</a> for official links (HMRC, GOV.UK, Companies House, FCA, ONS). Include at least 5 real official links. Add <div class='callout-info'> boxes for key tips. Add <div class='callout-warning'> for important warnings. Minimum 8 H2 sections. End with 'Useful Resources' section linking to official sources.",
  "contentPt": "FULL article HTML in Portuguese (Brazil). Same structure. Minimum 2000 words. Keep real links (GOV.UK links stay in English as they are official). Translate all text but keep HTML structure.",
  "metaTitleEn": "Meta title English (50-55 chars max, primary keyword first)",
  "metaTitlePt": "Meta title Portuguese (55 chars max)",
  "metaDescEn": "Meta description English (145-155 chars, includes keyword, call to action)",
  "metaDescPt": "Meta description Portuguese (155 chars max)",
  "keywords": ["primary keyword", "secondary kw", "long-tail kw 1", "long-tail kw 2", "long-tail kw 3", "long-tail kw 4", "long-tail kw 5"],
  "suggestedSlug": "url-friendly-slug-primary-keyword-english",
  "suggestedCategory": "Best category name for this article (e.g. Tax & Self-Assessment, Immigration, Freelancing, Financial Planning, Business Setup, Benefits & Credits)",
  "instagramCaptionEn": "Instagram caption English with 3-4 emojis, max 200 chars, ends with question or CTA",
  "instagramCaptionPt": "Same in Portuguese",
  "instagramHashtags": ["hashtag1","hashtag2","hashtag3","hashtag4","hashtag5","hashtag6","hashtag7","hashtag8","hashtag9","hashtag10"],
  "dallePrompt": "Abstract photorealistic scene representing the article theme. Example: Close-up of British pound coins on dark slate, amber bokeh light. NO text, NO screens, NO UI, NO signs, NO documents, NO words anywhere. Amber and dark slate colours. Editorial photography style."
}`,
          },
        ], { maxTokens: 8000 });
        try {
          const cleaned = aiRes.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          result = JSON.parse(cleaned);
        } catch {
          return NextResponse.json({ error: 'AI returned invalid JSON', raw: aiRes.content }, { status: 500 });
        }

        // Auto-create category if suggestedCategory is provided and doesn't exist
        if (result.suggestedCategory) {
          try {
            const catName = result.suggestedCategory.trim();
            const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const existing = await (prisma as any).blogCategory.findFirst({ where: { name: catName } });
            if (!existing) {
              const newCat = await (prisma as any).blogCategory.create({ data: { name: catName, slug: catSlug } });
              result.categoryId = newCat.id;
              result.categoryName = newCat.name;
            } else {
              result.categoryId = existing.id;
              result.categoryName = existing.name;
            }
          } catch { /* ignore category errors */ }
        }
        break;
      }

      case 'instagram_copy': {
        const aiRes = await callAI([
          {
            role: 'system',
            content: 'You are a bilingual social media manager for Clarity & Co. Always return valid JSON only, no markdown fences.',
          },
          {
            role: 'user',
            content: `Generate Instagram content for: "${topic}". Tone: ${tone}.

Output JSON:
{
  "captionEn": "Engaging caption English with emojis, max 200 chars, ends with question or CTA",
  "captionPt": "Same in Portuguese (Brazil)",
  "hashtags": ["8 to 12 relevant hashtags without # symbol"],
  "dallePrompt": "DALL-E 3 prompt: square 1:1 Instagram image, modern vibrant financial/UK theme, NO text in image."
}`,
          },
        ]);
        try {
          result = JSON.parse(aiRes.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        } catch {
          return NextResponse.json({ error: 'AI returned invalid JSON', raw: aiRes.content }, { status: 500 });
        }
        break;
      }

      case 'email_campaign': {
        const aiRes = await callAI([
          {
            role: 'system',
            content: 'You are a bilingual email marketing expert for Clarity & Co. Always return valid JSON only, no markdown fences.',
          },
          {
            role: 'user',
            content: `Write a marketing email for: "${topic}". Tone: ${tone}.

Output JSON:
{
  "subjectEn": "Subject line English (50 chars max, curiosity-driven)",
  "subjectPt": "Same in Portuguese",
  "bodyHtmlEn": "Full email HTML body English. Professional tone. Include greeting, value prop, [CTA_BUTTON] placeholder, sign-off. Max 300 words.",
  "bodyHtmlPt": "Same in Portuguese",
  "previewTextEn": "Preview text English (100 chars)",
  "previewTextPt": "Same in Portuguese"
}`,
          },
        ]);
        try {
          result = JSON.parse(aiRes.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        } catch {
          return NextResponse.json({ error: 'AI returned invalid JSON', raw: aiRes.content }, { status: 500 });
        }
        break;
      }

      case 'save_blog_post': {
        // Save a generated blog post directly to DB
        const {
          titleEn, titlePt, excerptEn, excerptPt, contentEn, contentPt,
          metaTitleEn, metaTitlePt, metaDescEn, metaDescPt, keywords,
          suggestedSlug, categoryId,
        } = body;

        if (!titleEn || !contentEn) {
          return NextResponse.json({ error: 'titleEn and contentEn required' }, { status: 400 });
        }

        const slug = suggestedSlug ? slugify(suggestedSlug) : slugify(titleEn);
        const post = await (prisma as any).blogPost.create({
          data: {
            titleEn, titlePt, slug, excerptEn, excerptPt,
            contentEn, contentPt,
            metaTitleEn, metaTitlePt, metaDescEn, metaDescPt,
            keywords: keywords || [],
            status: 'draft',
            readingMins: estimateReadingMins(contentEn),
            categoryId: categoryId || null,
            authorId: userId,
          },
        });
        result = { post };
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[AI Generate]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
