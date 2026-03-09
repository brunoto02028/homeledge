'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, Globe, FileText,
  Clock, CheckCircle, ArrowLeft, Loader2, Calendar, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Post {
  id: string;
  titleEn: string;
  titlePt: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  readingMins: number;
  viewCount: number;
  category: { name: string } | null;
  tags: { tag: { name: string } }[];
  author: { fullName: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  published: { label: 'Published', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  draft: { label: 'Draft', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: FileText },
  scheduled: { label: 'Scheduled', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
};

export default function BlogAdminClient() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => { loadPosts(); }, [search, statusFilter]);

  async function loadPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/marketing/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch(`/api/marketing/blog/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ title: 'Post deleted' });
      loadPosts();
    } else {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  }

  async function toggleStatus(post: Post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/marketing/blog/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast({ title: newStatus === 'published' ? '🎉 Published!' : 'Set to draft' });
      loadPosts();
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Blog Management</h1>
            <p className="text-sm text-muted-foreground">{total} articles total</p>
          </div>
        </div>
        <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90">
          <Link href="/admin/marketing/blog/new">
            <Plus className="h-4 w-4 mr-2" /> New Article
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['', 'published', 'draft', 'scheduled'].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s || 'All'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border rounded-xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No articles yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first article using the AI Assistant or manually.</p>
          <Button asChild>
            <Link href="/admin/marketing/blog/new"><Plus className="h-4 w-4 mr-2" /> Create Article</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Article</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Views</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map(post => {
                const cfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                const Icon = cfg.icon;
                return (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{post.titleEn}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{post.titlePt}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">/{post.slug}</span>
                          <span className="text-xs text-muted-foreground">• {post.readingMins}m read</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {post.category ? (
                        <Badge variant="outline" className="text-xs">{post.category.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{post.viewCount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : new Date(post.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {post.status === 'published' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/admin/marketing/blog/${post.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleStatus(post)}
                          title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deletePost(post.id, post.titleEn)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
