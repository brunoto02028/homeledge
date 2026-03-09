import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { PublicHeader, PublicFooter } from '@/components/public-header';
import { Clock, Calendar, Tag, Share2, ChevronRight, ArrowLeft } from 'lucide-react';

interface Props {
  params: { slug: string };
}

async function getPost(slug: string) {
  const post = await (prisma as any).blogPost.findUnique({
    where: { slug, status: 'published' },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { fullName: true } },
    },
  });
  return post;
}

async function getRelated(postId: string, categoryId: string | null) {
  return (prisma as any).blogPost.findMany({
    where: {
      status: 'published',
      id: { not: postId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: true },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Article not found' };

  const title = post.metaTitleEn || post.titleEn;
  const description = post.metaDescEn || post.excerptEn || '';
  const url = `https://clarityco.co.uk/blog/${post.slug}`;

  return {
    title: `${title} — Clarity & Co Blog`,
    description,
    keywords: post.keywords?.join(', '),
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author?.fullName || 'Clarity & Co'],
      images: post.coverImage ? [{ url: post.coverImage }] : [{ url: 'https://clarityco.co.uk/site-logo.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : ['https://clarityco.co.uk/site-logo.png'],
    },
    alternates: { canonical: url },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  // Increment view count (fire and forget)
  (prisma as any).blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  const related = await getRelated(post.id, post.categoryId);

  // Build table of contents from H2/H3 headings + bold numbered sections
  const toc: { level: number; text: string; id: string }[] = [];
  // Real headings
  const tocRegex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = tocRegex.exec(post.contentEn)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '');
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    toc.push({ level: parseInt(match[1]), text, id });
  }
  // Bold numbered section headings (e.g. <p><strong>1. Tax Registration</strong></p>)
  const boldSectionRegex = /<p><strong>(\d+\.\s[^<]{3,80})<\/strong><\/p>/g;
  let boldMatch;
  while ((boldMatch = boldSectionRegex.exec(post.contentEn)) !== null) {
    const text = boldMatch[1];
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    // Only add if not already in TOC
    if (!toc.find(t => t.id === id)) {
      toc.push({ level: 3, text, id });
    }
  }
  // Sort by position in document
  toc.sort((a, b) => {
    const posA = post.contentEn.indexOf(a.text);
    const posB = post.contentEn.indexOf(b.text);
    return posA - posB;
  });

  // Post-process content for better rendering
  let contentWithIds = post.contentEn

    // 1. Add IDs to existing h2/h3 headings
    .replace(
      /<h([23])([^>]*)>(.*?)<\/h[23]>/gi,
      (_: string, level: string, attrs: string, text: string) => {
        const cleanText = text.replace(/<[^>]+>/g, '');
        const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
      }
    )

    // 2. Convert <p><strong>N. Section Title</strong> into proper <h3> headings
    .replace(
      /<p><strong>(\d+\.\s[^<]{3,80})<\/strong><\/p>/g,
      (_: string, title: string) => {
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `<h3 id="${id}">${title}</h3>`;
      }
    )

    // 3. Convert <p><strong>Q: question text</strong> into <h4> FAQ headings
    .replace(
      /<p><strong>(Q:\s[^<]{3,120})<\/strong><\/p>/g,
      (_: string, title: string) => {
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `<h4 id="${id}">${title}</h4>`;
      }
    )

    // 4. Ensure double line-break between adjacent paragraphs (br tags → paragraph breaks)
    .replace(/<\/p>\s*<p>/g, '</p>\n<p>')

    // 5. Wrap bare <br><br> separated blocks into paragraphs
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '</p><p>');
  

  // JSON-LD schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.titleEn,
    description: post.excerptEn || post.metaDescEn || '',
    image: post.coverImage || 'https://clarityco.co.uk/site-logo.png',
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    author: { '@type': 'Person', name: post.author?.fullName || 'Clarity & Co' },
    publisher: {
      '@type': 'Organization',
      name: 'Clarity & Co',
      logo: { '@type': 'ImageObject', url: 'https://clarityco.co.uk/site-logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://clarityco.co.uk/blog/${post.slug}` },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/blog" className="hover:text-amber-400 transition-colors">Blog</Link>
          {post.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/blog?category=${post.category.slug}`} className="hover:text-amber-400 transition-colors">
                {post.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-400 truncate max-w-xs">{post.titleEn}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_280px] gap-10 items-start">
          {/* Article */}
          <article>
            {/* Category */}
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 hover:bg-amber-500/20 transition-colors"
              >
                {post.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {post.titleEn}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-white/5">
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readingMins} min read
              </span>
              {post.author && (
                <span>By {post.author.fullName}</span>
              )}
              {/* Share */}
              <div className="ml-auto flex items-center gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://clarityco.co.uk/blog/${post.slug}`)}&text=${encodeURIComponent(post.titleEn)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-white/10 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Share on Twitter/X"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://clarityco.co.uk/blog/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-white/10 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Share on LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Cover image */}
            {post.coverImage && (
              <div className="mb-8 rounded-2xl overflow-hidden">
                <img src={post.coverImage} alt={post.titleEn} className="w-full h-64 md:h-96 object-cover" />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-slate dark:prose-invert prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-a:text-amber-400 hover:prose-a:text-amber-300 prose-blockquote:border-amber-500 prose-blockquote:text-slate-400 max-w-none"
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-2">
                <Tag className="h-4 w-4 text-slate-500 mt-0.5" />
                {post.tags.map((pt: any) => (
                  <Link
                    key={pt.tag.id}
                    href={`/blog?tag=${pt.tag.slug}`}
                    className="px-3 py-1 rounded-full text-xs border border-white/10 text-slate-400 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
                  >
                    {pt.tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* CTA Banner */}
            <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20">
              <h3 className="font-bold text-white mb-2">Ready to take control of your UK finances?</h3>
              <p className="text-slate-400 text-sm mb-4">Join thousands of immigrants and self-employed professionals using Clarity & Co.</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold text-sm hover:from-amber-300 hover:to-amber-400 transition-all"
              >
                Start Free — No credit card required <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-20">
            {/* Table of Contents */}
            {toc.length > 2 && (
              <div className="p-5 rounded-xl border border-white/10 bg-slate-900/50">
                <h4 className="font-semibold text-sm text-white mb-3">Table of Contents</h4>
                <nav className="space-y-1">
                  {toc.map((item, i) => (
                    <a
                      key={i}
                      href={`#${item.id}`}
                      className={`block text-xs text-slate-400 hover:text-amber-400 transition-colors py-0.5 ${item.level === 3 ? 'pl-3' : ''}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* CTA box */}
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div className="h-10 w-10 rounded-xl overflow-hidden mb-3">
                <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
              </div>
              <h4 className="font-bold text-white text-sm mb-2">Try Clarity & Co free</h4>
              <p className="text-xs text-slate-400 mb-4">Smart financial management for the UK. 14-day free trial.</p>
              <Link
                href="/register"
                className="block text-center px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Newsletter */}
            <div className="p-5 rounded-xl border border-white/10 bg-slate-900/50">
              <h4 className="font-semibold text-white text-sm mb-2">Weekly UK Finance Tips</h4>
              <p className="text-xs text-slate-400 mb-3">No spam. Unsubscribe anytime.</p>
              <form action="/api/marketing/leads" method="POST" className="space-y-2">
                <input type="hidden" name="source" value="blog_sidebar" />
                <input type="hidden" name="sourceSlug" value={post.slug} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel: any) => (
                <Link key={rel.id} href={`/blog/${rel.slug}`} className="group">
                  <article className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 hover:border-amber-500/30 transition-all">
                    {rel.coverImage ? (
                      <div className="h-40 overflow-hidden">
                        <img src={rel.coverImage} alt={rel.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <span className="text-3xl">📝</span>
                      </div>
                    )}
                    <div className="p-4">
                      {rel.category && <span className="text-xs text-amber-400 font-semibold">{rel.category.name}</span>}
                      <h3 className="font-bold text-white text-sm mt-1 line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {rel.titleEn}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-medium mt-2">
                        Read more <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
