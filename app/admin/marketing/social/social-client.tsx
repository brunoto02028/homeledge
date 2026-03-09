'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Instagram, Plus, Loader2, CheckCircle, AlertCircle,
  ExternalLink, Send, Calendar, Image as ImageIcon, RefreshCw,
  Clock, Globe, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  tokenExpiresAt: string | null;
  _count: { posts: number };
}

interface Creative {
  id: string;
  title: string;
  imageUrl: string | null;
  captionEn: string | null;
  hashtags: string[];
  type: string;
}

interface SocialPost {
  id: string;
  postType: string;
  status: string;
  caption: string | null;
  mediaUrls: string[];
  scheduledAt: string | null;
  publishedAt: string | null;
  externalId: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  published: 'text-green-600 bg-green-500/10 border-green-500/20',
  scheduled: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  draft: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  failed: 'text-red-600 bg-red-500/10 border-red-500/20',
};

export default function SocialClient() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Compose form
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCreativeId, setSelectedCreativeId] = useState(searchParams.get('creativeId') || '');
  const [postType, setPostType] = useState('feed');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) toast({ title: '✅ Instagram connected successfully!' });
    if (error) {
      const msgs: Record<string, string> = {
        meta_denied: 'Meta authorization was denied.',
        no_pages: 'No Facebook Pages found on your account.',
        no_instagram: 'No Instagram Business account linked to your pages.',
        token_failed: 'Failed to exchange authorization code.',
        server_error: 'Server error during connection.',
      };
      toast({ title: msgs[error] || 'Connection failed', variant: 'destructive' });
    }
  }, []);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    // Pre-fill compose from selected creative
    if (selectedCreativeId && creatives.length) {
      const creative = creatives.find(c => c.id === selectedCreativeId);
      if (creative) {
        setCaption(creative.captionEn || '');
        setHashtags(creative.hashtags?.join(', ') || '');
        setMediaUrl(creative.imageUrl || '');
        setShowCompose(true);
      }
    }
  }, [selectedCreativeId, creatives]);

  async function loadAll() {
    setLoading(true);
    try {
      const [accsRes, creativesRes] = await Promise.all([
        fetch('/api/marketing/social/accounts'),
        fetch('/api/marketing/creatives?limit=50'),
      ]);
      const [accsData, creativesData] = await Promise.all([accsRes.json(), creativesRes.json()]);
      const accs = Array.isArray(accsData) ? accsData : [];
      setAccounts(accs);
      setCreatives(creativesData.creatives || []);
      if (accs.length > 0) {
        setSelectedAccountId(accs[0].id);
        // Load posts for first account
        loadPosts(accs[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPosts(accountId: string) {
    const res = await fetch(`/api/marketing/social/posts?accountId=${accountId}`);
    const data = await res.json();
    setPosts(data.posts || []);
  }

  async function connectMeta() {
    setConnecting(true);
    try {
      const res = await fetch('/api/marketing/social/meta-oauth');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.authUrl;
    } catch (e: any) {
      toast({ title: 'Failed to start OAuth', description: e.message, variant: 'destructive' });
      setConnecting(false);
    }
  }

  async function handlePublish() {
    if (!selectedAccountId) {
      toast({ title: 'Select an Instagram account', variant: 'destructive' });
      return;
    }
    const urls = mediaUrl.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      toast({ title: 'Add at least one image URL', variant: 'destructive' });
      return;
    }

    setPublishing(true);
    try {
      const hashtagArr = hashtags.split(/[,\s]+/).map(h => h.replace('#', '').trim()).filter(Boolean);
      const res = await fetch('/api/marketing/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialAccountId: selectedAccountId,
          creativeId: selectedCreativeId || null,
          postType,
          caption,
          hashtags: hashtagArr,
          mediaUrls: urls,
          scheduledAt: scheduledAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: scheduledAt ? '📅 Post scheduled!' : '🎉 Published to Instagram!' });
      setCaption(''); setHashtags(''); setMediaUrl(''); setScheduledAt('');
      setSelectedCreativeId(''); setShowCompose(false);
      loadPosts(selectedAccountId);
    } catch (e: any) {
      toast({ title: 'Publish failed', description: e.message, variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Instagram className="h-6 w-6 text-pink-500" /> Instagram Publishing
            </h1>
            <p className="text-sm text-muted-foreground">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={connectMeta} disabled={connecting}>
            {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {accounts.length > 0 ? 'Reconnect' : 'Connect Instagram'}
          </Button>
          {accounts.length > 0 && (
            <Button size="sm" onClick={() => setShowCompose(true)} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              <Send className="h-4 w-4 mr-1" /> New Post
            </Button>
          )}
        </div>
      </div>

      {accounts.length === 0 ? (
        /* No accounts connected */
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Instagram className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Connect your Instagram</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Connect your Instagram Business account to publish posts, stories, and carousels directly from Clarity & Co.
          </p>
          <div className="text-left max-w-md mx-auto mb-6 p-4 rounded-xl bg-muted/30 border text-sm space-y-2">
            <p className="font-semibold text-xs text-muted-foreground uppercase mb-2">Requirements:</p>
            <p>✅ Instagram <strong>Business</strong> or <strong>Creator</strong> account</p>
            <p>✅ Account linked to a <strong>Facebook Page</strong></p>
            <p>✅ META_APP_ID and META_APP_SECRET in .env.production</p>
            <p>✅ Valid redirect URI: <code className="text-xs bg-muted px-1 rounded">/api/marketing/social/meta-callback</code></p>
          </div>
          <Button onClick={connectMeta} disabled={connecting} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Instagram className="h-4 w-4 mr-2" />}
            Connect with Meta
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Accounts sidebar */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Connected Accounts</h3>
            {accounts.map(acc => {
              const expired = acc.tokenExpiresAt && new Date(acc.tokenExpiresAt) < new Date();
              return (
                <button
                  key={acc.id}
                  onClick={() => { setSelectedAccountId(acc.id); loadPosts(acc.id); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedAccountId === acc.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Instagram className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">@{acc.accountName}</p>
                      <p className="text-xs text-muted-foreground">{acc._count.posts} posts</p>
                    </div>
                    {expired ? (
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                  </div>
                  {expired && (
                    <p className="text-xs text-amber-500 mt-1">Token expired — reconnect</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="space-y-4">
            {/* Compose panel */}
            {showCompose && (
              <div className="p-5 rounded-xl border bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Compose Post</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                {/* Post type */}
                <div className="flex gap-2">
                  {['feed', 'story', 'carousel'].map(t => (
                    <button
                      key={t}
                      onClick={() => setPostType(t)}
                      className={`px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors ${postType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* From creative */}
                {creatives.filter(c => c.imageUrl).length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">From Creative Library (optional)</Label>
                    <select
                      value={selectedCreativeId}
                      onChange={e => setSelectedCreativeId(e.target.value)}
                      className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background"
                    >
                      <option value="">— Select a creative —</option>
                      {creatives.filter(c => c.imageUrl).map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Image URLs */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Image URL{postType === 'carousel' ? 's (one per line)' : ''}
                  </Label>
                  <textarea
                    value={mediaUrl}
                    onChange={e => setMediaUrl(e.target.value)}
                    placeholder={postType === 'carousel' ? 'https://...\nhttps://...\nhttps://...' : 'https://...'}
                    rows={postType === 'carousel' ? 4 : 2}
                    className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Image must be publicly accessible via HTTPS</p>
                </div>

                {/* Caption */}
                <div>
                  <Label className="text-xs text-muted-foreground">Caption</Label>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Write your caption..."
                    rows={4}
                    className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-0.5">{caption.length}/2200</p>
                </div>

                {/* Hashtags */}
                <div>
                  <Label className="text-xs text-muted-foreground">Hashtags (comma or space separated)</Label>
                  <Input
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    placeholder="ukfinance, selfemployed, hmrc..."
                    className="mt-1 text-sm"
                  />
                </div>

                {/* Schedule */}
                <div>
                  <Label className="text-xs text-muted-foreground">Schedule (optional — leave blank to publish now)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  >
                    {publishing ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publishing...</>
                    ) : scheduledAt ? (
                      <><Calendar className="h-4 w-4 mr-2" /> Schedule Post</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Publish Now</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Posts history */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Post History</h3>
                <Button variant="ghost" size="sm" onClick={() => selectedAccountId && loadPosts(selectedAccountId)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {posts.length === 0 ? (
                <div className="text-center py-10 border rounded-xl text-muted-foreground text-sm">
                  No posts yet. Create your first post above.
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map(post => (
                    <div key={post.id} className="flex gap-3 p-3 rounded-xl border hover:bg-muted/20 transition-colors">
                      {post.mediaUrls[0] ? (
                        <img src={post.mediaUrls[0]} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[post.status] || STATUS_COLORS.draft}`}>
                            {post.status === 'published' && <CheckCircle className="h-3 w-3" />}
                            {post.status === 'scheduled' && <Clock className="h-3 w-3" />}
                            {post.status === 'failed' && <XCircle className="h-3 w-3" />}
                            {post.status}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">{post.postType}</span>
                        </div>
                        <p className="text-sm line-clamp-2 text-muted-foreground">{post.caption || 'No caption'}</p>
                        {post.errorMessage && (
                          <p className="text-xs text-red-500 mt-1">{post.errorMessage}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {post.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {post.scheduledAt && post.status === 'scheduled' && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {post.externalId && (
                            <a
                              href={`https://www.instagram.com/p/${post.externalId}/`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-pink-500 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" /> View on Instagram
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
