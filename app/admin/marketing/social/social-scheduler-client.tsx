'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Send, Plus, Trash2, Edit2, Instagram, Twitter, Facebook, Linkedin, Loader2, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500',
  twitter: 'bg-sky-500',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

interface SocialAccount { id: string; platform: string; accountName: string; }
interface SocialPost {
  id: string; platform: string; caption: string; hashtags: string[];
  status: string; scheduledAt: string | null; publishedAt: string | null;
  postType: string; socialAccount: SocialAccount;
}

export default function SocialSchedulerClient() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [generating, setGenerating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    socialAccountId: '', platform: '', caption: '', hashtags: '',
    scheduledAt: '', postType: 'feed', aiTopic: '',
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [postsRes, accountsRes] = await Promise.all([
      fetch('/api/social/schedule'),
      fetch('/api/social/accounts'),
    ]);
    if (postsRes.ok) { const d = await postsRes.json(); setPosts(d.posts || []); }
    if (accountsRes.ok) { const d = await accountsRes.json(); setAccounts(d.accounts || []); }
    setLoading(false);
  }

  async function generateWithAI() {
    if (!form.aiTopic) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'social_post',
          platform: form.platform || 'linkedin',
          topic: form.aiTopic,
          tone: 'professional',
        }),
      });
      const data = await res.json();
      if (data.content) {
        const lines = data.content.split('\n');
        const first = lines.findIndex((l: string) => l.match(/^1\.|^Variation 1/i));
        const end = lines.findIndex((l: string, i: number) => i > first && l.match(/^---$|^2\.|^Variation 2/i));
        const snippet = first >= 0
          ? lines.slice(first + 1, end > first ? end : first + 15).join('\n').trim()
          : data.content.split('---')[0].trim();

        const hashMatch = snippet.match(/#\w+/g);
        const cleanCaption = snippet.replace(/#\w+/g, '').trim();
        setForm(f => ({
          ...f,
          caption: cleanCaption,
          hashtags: hashMatch ? hashMatch.join(' ') : '',
        }));
      }
    } finally {
      setGenerating(false);
    }
  }

  async function savePost() {
    const selectedAccount = accounts.find(a => a.id === form.socialAccountId);
    const payload = {
      socialAccountId: form.socialAccountId,
      platform: selectedAccount?.platform || form.platform,
      caption: form.caption,
      hashtags: form.hashtags.split(' ').filter(h => h.startsWith('#')),
      scheduledAt: form.scheduledAt || null,
      postType: form.postType,
    };

    const res = editPost
      ? await fetch(`/api/social/schedule/${editPost.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/social/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    if (res.ok) { setShowDialog(false); fetchAll(); }
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/social/schedule/${id}`, { method: 'DELETE' });
    fetchAll();
  }

  function openCreate() {
    setEditPost(null);
    setForm({ socialAccountId: accounts[0]?.id || '', platform: '', caption: '', hashtags: '', scheduledAt: '', postType: 'feed', aiTopic: '' });
    setShowDialog(true);
  }

  function openEdit(post: SocialPost) {
    setEditPost(post);
    setForm({
      socialAccountId: post.socialAccount?.id || '',
      platform: post.platform,
      caption: post.caption || '',
      hashtags: post.hashtags?.join(' ') || '',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
      postType: post.postType,
      aiTopic: '',
    });
    setShowDialog(true);
  }

  const filtered = posts.filter(p =>
    (filterStatus === 'all' || p.status === filterStatus) &&
    (filterPlatform === 'all' || p.platform === filterPlatform)
  );

  const stats = {
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media Scheduler</h1>
          <p className="text-sm text-muted-foreground">Schedule and manage posts across all platforms</p>
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Posts', value: stats.total, icon: Calendar, color: 'text-blue-600' },
          { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'text-yellow-600' },
          { label: 'Published', value: stats.published, icon: Check, color: 'text-green-600' },
          { label: 'Drafts', value: stats.draft, icon: Edit2, color: 'text-gray-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="twitter">X / Twitter</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Calendar className="h-12 w-12 text-violet-300" />
            <p className="text-sm">No posts yet — create one with AI assistance</p>
            <Button onClick={openCreate} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" /> Create Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(post => {
            const Icon = PLATFORM_ICONS[post.platform] || Send;
            return (
              <Card key={post.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${PLATFORM_COLORS[post.platform] || 'bg-gray-500'}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium capitalize">{post.platform}</p>
                      <p className="text-xs text-muted-foreground">{post.socialAccount?.accountName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(post)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deletePost(post.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed line-clamp-4">{post.caption}</p>
                  {post.hashtags?.length > 0 && (
                    <p className="text-xs text-violet-600 dark:text-violet-400 line-clamp-2">
                      {post.hashtags.join(' ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status]}`}>
                      {post.status}
                    </span>
                    {post.scheduledAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {post.publishedAt && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* AI Generation */}
            {!editPost && (
              <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800 space-y-3">
                <p className="text-sm font-medium text-violet-700 dark:text-violet-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Generate with Claude AI
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder='e.g. "How Clarity & Co helps freelancers with tax"'
                    value={form.aiTopic}
                    onChange={e => setForm(f => ({ ...f, aiTopic: e.target.value }))}
                  />
                  <Button onClick={generateWithAI} disabled={generating || !form.aiTopic} variant="outline" className="shrink-0">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Social Account *</label>
                <Select value={form.socialAccountId} onValueChange={v => setForm(f => ({ ...f, socialAccountId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={accounts.length === 0 ? 'No accounts connected' : 'Select account'} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.platform} — {a.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {accounts.length === 0 && (
                  <p className="text-xs text-amber-600">Connect a social account in Settings → Integrations</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Post Type</label>
                <Select value={form.postType} onValueChange={v => setForm(f => ({ ...f, postType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">Feed Post</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="reel">Reel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Caption *</label>
              <Textarea
                placeholder="Write your caption here..."
                value={form.caption}
                onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                rows={6}
              />
              <p className="text-xs text-muted-foreground text-right">{form.caption.length} chars</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hashtags</label>
              <Input
                placeholder="#clarityco #ukfinance #hmrc #selfassessment"
                value={form.hashtags}
                onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Schedule Date & Time</label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Leave empty to save as draft</p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={savePost} disabled={!form.socialAccountId || !form.caption} className="bg-violet-600 hover:bg-violet-700 text-white">
              {editPost ? 'Update Post' : form.scheduledAt ? 'Schedule Post' : 'Save as Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
