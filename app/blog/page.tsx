import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { PublicHeader, PublicFooter } from '@/components/public-header';
import { Clock, Tag, ChevronRight, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — Clarity & Co | UK Finance Tips for Immigrants & Self-Employed',
  description: 'Practical guides on UK taxes, self-assessment, VAT, company registration, and financial management for immigrants and self-employed professionals.',
  openGraph: {
    title: 'Blog — Clarity & Co',
    description: 'UK Finance Tips for Immigrants & Self-Employed',
    url: 'https://clarityco.co.uk/blog',
    siteName: 'Clarity & Co',
    images: [{ url: 'https://clarityco.co.uk/site-logo.png', width: 512, height: 512 }],
  },
};

async function getPosts(page = 1, categorySlug?: string, tagSlug?: string) {
  const limit = 12;
  const where: any = { status: 'published' };
  if (categorySlug) where.category = { slug: categorySlug };
  if (tagSlug) where.tags = { some: { tag: { slug: tagSlug } } };

  const [posts, total] = await Promise.all([
    (prisma as any).blogPost.findMany({
      where,
      include: {
        category: true,
        tags: { include: { tag: true }, take: 3 },
        author: { select: { fullName: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).blogPost.count({ where }),
  ]);

  return { posts, total, pages: Math.ceil(total / limit) };
}

async function getCategories() {
  return (prisma as any).blogCategory.findMany({
    include: { _count: { select: { posts: { where: { status: 'published' } } } } },
    orderBy: { name: 'asc' },
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; tag?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const [{ posts, total, pages }, categories] = await Promise.all([
    getPosts(page, searchParams.category, searchParams.tag),
    getCategories(),
  ]);

  const featuredPost = page === 1 && !searchParams.category && !searchParams.tag ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">Blog</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Practical guides on UK taxes, self-assessment, company registration and financial management.
          </p>
        </div>

        {/* Categories filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            <Link
              href="/blog"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                !searchParams.category
                  ? 'bg-amber-500 text-slate-900 border-amber-500'
                  : 'border-white/10 text-slate-400 hover:border-amber-500/50 hover:text-amber-400'
              }`}
            >
              All
            </Link>
            {categories.filter((c: any) => c._count.posts > 0).map((cat: any) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  searchParams.category === cat.slug
                    ? 'bg-amber-500 text-slate-900 border-amber-500'
                    : 'border-white/10 text-slate-400 hover:border-amber-500/50 hover:text-amber-400'
                }`}
              >
                {cat.name}
                <span className="ml-1.5 text-xs opacity-60">({cat._count.posts})</span>
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-xl mb-2">No articles yet</p>
            <p className="text-sm">Check back soon for new content.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`} className="block group mb-10">
                <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 hover:border-amber-500/30 transition-all duration-300">
                  <div className="grid md:grid-cols-2 gap-0">
                    {featuredPost.coverImage ? (
                      <div className="h-64 md:h-auto">
                        <img
                          src={featuredPost.coverImage}
                          alt={featuredPost.titleEn}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-64 md:h-auto bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center">
                        <span className="text-6xl">📰</span>
                      </div>
                    )}
                    <div className="p-8 flex flex-col justify-center">
                      {featuredPost.category && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 w-fit">
                          {featuredPost.category.name}
                        </span>
                      )}
                      <h2 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors mb-3 line-clamp-2">
                        {featuredPost.titleEn}
                      </h2>
                      {featuredPost.excerptEn && (
                        <p className="text-slate-400 line-clamp-3 mb-4">{featuredPost.excerptEn}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {featuredPost.readingMins} min read
                        </span>
                        {featuredPost.publishedAt && (
                          <span>{new Date(featuredPost.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-amber-400 text-sm font-medium group-hover:gap-2 transition-all">
                        Read article <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                  <article className="h-full flex flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 hover:border-amber-500/30 transition-all duration-300">
                    {post.coverImage ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.titleEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <span className="text-4xl">📝</span>
                      </div>
                    )}
                    <div className="flex-1 p-5 flex flex-col">
                      {post.category && (
                        <span className="text-xs font-semibold text-amber-400 mb-2">{post.category.name}</span>
                      )}
                      <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors mb-2 line-clamp-2 flex-1">
                        {post.titleEn}
                      </h3>
                      {post.excerptEn && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">{post.excerptEn}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-3 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {post.readingMins} min
                        </span>
                        {post.publishedAt && (
                          <span>{new Date(post.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <Link
                    key={p}
                    href={`/blog?page=${p}${searchParams.category ? `&category=${searchParams.category}` : ''}`}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-amber-500 text-slate-900'
                        : 'border border-white/10 text-slate-400 hover:border-amber-500/50 hover:text-amber-400'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Newsletter CTA */}
        <div className="mt-16 p-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
          <h3 className="text-xl font-bold mb-2">Get weekly UK finance tips</h3>
          <p className="text-slate-400 text-sm mb-5">Join 2,000+ immigrants and self-employed professionals</p>
          <form action="/api/marketing/leads" method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold text-sm hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
