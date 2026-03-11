'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mic, MicOff, Send, Sparkles, FileText, Users, Mail, BarChart3,
  Image as ImageIcon, Globe, Plus, Loader2, CheckCircle, ChevronRight,
  Newspaper, Megaphone, TrendingUp, BookOpen, Settings2, Instagram,
  BrainCircuit, Radio, Bot, Zap,
  Calendar, Clock, Edit2, Trash2, Facebook, Linkedin, Twitter, Copy, Check, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionItem[];
  loading?: boolean;
}

interface ActionItem {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline';
}

interface GeneratedPost {
  titleEn: string;
  titlePt: string;
  excerptEn: string;
  contentEn: string;
  contentPt: string;
  metaDescEn: string;
  keywords: string[];
  suggestedSlug: string;
  instagramCaptionEn: string;
  instagramCaptionPt: string;
  instagramHashtags: string[];
  dallePrompt: string;
}

const QUICK_COMMANDS = [
  { icon: <Newspaper className="h-4 w-4" />, label: 'Criar artigo de blog', prompt: 'Cria um artigo sobre ' },
  { icon: <Instagram className="h-4 w-4" />, label: 'Post Instagram', prompt: 'Cria conteúdo para Instagram sobre ' },
  { icon: <Mail className="h-4 w-4" />, label: 'Campanha de email', prompt: 'Cria uma campanha de email sobre ' },
  { icon: <ImageIcon className="h-4 w-4" />, label: 'Arte para redes sociais', prompt: 'Gera arte para Instagram sobre ' },
];

// ── AI Composer constants ─────────────────────────────────────────────────
const CONTENT_TYPES = [
  { value: 'social_post',      label: 'Social Post',       icon: Radio,     desc: 'LinkedIn, Instagram, X/Twitter posts' },
  { value: 'blog_article',     label: 'Blog Article',      icon: FileText,  desc: 'SEO-optimised long-form content' },
  { value: 'email_campaign',   label: 'Email Campaign',    icon: Mail,      desc: 'Multi-email nurture sequences' },
  { value: 'marketing_copy',   label: 'Marketing Copy',    icon: Megaphone, desc: 'Landing pages, ads, CTAs' },
  { value: 'campaign_insight', label: 'Campaign Insights', icon: BarChart3, desc: 'Analyse campaign performance' },
];
const TONES = ['professional','friendly','urgent','inspirational','educational','witty'];
const AUDIENCE_OPTIONS = ['UK households managing finances','Small business owners','Freelancers & sole traders','Immigrants navigating UK system','First-time homebuyers','Self-employed professionals'];
const PLATFORMS_COMPOSER = [
  { value: 'linkedin',  label: 'LinkedIn',   icon: Linkedin },
  { value: 'instagram', label: 'Instagram',  icon: Instagram },
  { value: 'twitter',   label: 'X / Twitter',icon: Twitter },
  { value: 'facebook',  label: 'Facebook',   icon: Facebook },
];

// ── Scheduler constants ────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string,any> = { instagram: Instagram, twitter: Twitter, facebook: Facebook, linkedin: Linkedin };
const PLATFORM_COLORS: Record<string,string> = { instagram:'bg-pink-500', twitter:'bg-sky-500', facebook:'bg-blue-600', linkedin:'bg-blue-700' };
const STATUS_COLORS: Record<string,string> = { draft:'bg-gray-100 text-gray-700', scheduled:'bg-yellow-100 text-yellow-700', published:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-700' };

interface SocialAccount { id:string; platform:string; accountName:string; }
interface SocialPost { id:string; platform:string; caption:string; hashtags:string[]; status:string; scheduledAt:string|null; publishedAt:string|null; postType:string; socialAccount:SocialAccount; }

export default function MarketingClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // ── Main tab ───────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<'chat'|'composer'|'scheduler'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Sou o seu assistente de marketing da Clarity & Co.\n\nPosso criar artigos de blog bilíngues, conteúdo para Instagram, campanhas de email e muito mais — por texto ou voz.\n\n**Como posso ajudar hoje?**',
    },
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingPost, setPendingPost] = useState<GeneratedPost | null>(null);
  const [stats, setStats] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── AI Composer state ──────────────────────────────────────────────────────
  const [cType, setCType] = useState('social_post');
  const [cPlatform, setCPlatform] = useState('linkedin');
  const [cTopic, setCTopic] = useState('');
  const [cTone, setCTone] = useState('professional');
  const [cAudience, setCAudience] = useState('UK households managing finances');
  const [cKeywords, setCKeywords] = useState('');
  const [cContext, setCContext] = useState('');
  const [cLength, setCLength] = useState('');
  const [cResult, setCResult] = useState('');
  const [cLoading, setCLoading] = useState(false);
  const [cCopied, setCCopied] = useState(false);
  const [cModel, setCModel] = useState('');
  const [cHistory, setCHistory] = useState<{type:string;topic:string;content:string;model:string}[]>([]);

  // ── Scheduler state ────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [sLoading, setSLoading] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [editPost, setEditPost] = useState<SocialPost|null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [sForm, setSForm] = useState({ socialAccountId:'', platform:'', caption:'', hashtags:'', scheduledAt:'', postType:'feed', aiTopic:'' });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetch('/api/marketing/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (mainTab === 'scheduler') fetchScheduler();
  }, [mainTab]);

  // ── AI Composer functions ──────────────────────────────────────────────────
  async function composerGenerate() {
    if (!cTopic.trim()) return;
    setCLoading(true); setCResult('');
    try {
      const res = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: cType, platform: cPlatform, topic: cTopic, tone: cTone, audience: cAudience, keywords: cKeywords, context: cContext, length: cLength }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setCResult(data.content); setCModel(data.model || data.provider || '');
      setCHistory(h => [{ type: cType, topic: cTopic, content: data.content, model: data.model || data.provider }, ...h.slice(0, 9)]);
    } catch (e: any) { setCResult(`Error: ${e.message}`); }
    finally { setCLoading(false); }
  }

  async function composerCopy() {
    await navigator.clipboard.writeText(cResult);
    setCCopied(true); setTimeout(() => setCCopied(false), 2000);
  }

  // ── Scheduler functions ────────────────────────────────────────────────────
  async function fetchScheduler() {
    setSLoading(true);
    const [pr, ar] = await Promise.all([fetch('/api/social/schedule'), fetch('/api/social/accounts')]);
    if (pr.ok) { const d = await pr.json(); setPosts(d.posts || []); }
    if (ar.ok) { const d = await ar.json(); setAccounts(d.accounts || []); }
    setSLoading(false);
  }

  async function schedGenerateAI() {
    if (!sForm.aiTopic) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/marketing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'social_post', platform: sForm.platform || 'linkedin', topic: sForm.aiTopic, tone: 'professional' }),
      });
      const data = await res.json();
      if (data.content) {
        const lines = data.content.split('\n');
        const first = lines.findIndex((l: string) => l.match(/^1\.|^Variation 1/i));
        const end = lines.findIndex((l: string, i: number) => i > first && l.match(/^---$|^2\.|^Variation 2/i));
        const snippet = first >= 0 ? lines.slice(first + 1, end > first ? end : first + 15).join('\n').trim() : data.content.split('---')[0].trim();
        const hashMatch = snippet.match(/#\w+/g);
        setSForm(f => ({ ...f, caption: snippet.replace(/#\w+/g, '').trim(), hashtags: hashMatch ? hashMatch.join(' ') : '' }));
      }
    } finally { setGenerating(false); }
  }

  async function schedSavePost() {
    const selectedAccount = accounts.find(a => a.id === sForm.socialAccountId);
    const payload = { socialAccountId: sForm.socialAccountId, platform: selectedAccount?.platform || sForm.platform, caption: sForm.caption, hashtags: sForm.hashtags.split(' ').filter((h: string) => h.startsWith('#')), scheduledAt: sForm.scheduledAt || null, postType: sForm.postType };
    const res = editPost
      ? await fetch(`/api/social/schedule/${editPost.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/social/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setShowPostDialog(false); fetchScheduler(); }
  }

  async function schedDeletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/social/schedule/${id}`, { method: 'DELETE' });
    fetchScheduler();
  }

  function schedOpenCreate() {
    setEditPost(null);
    setSForm({ socialAccountId: accounts[0]?.id || '', platform: '', caption: '', hashtags: '', scheduledAt: '', postType: 'feed', aiTopic: '' });
    setShowPostDialog(true);
  }

  function schedOpenEdit(post: SocialPost) {
    setEditPost(post);
    setSForm({ socialAccountId: post.socialAccount?.id || '', platform: post.platform, caption: post.caption || '', hashtags: post.hashtags?.join(' ') || '', scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '', postType: post.postType, aiTopic: '' });
    setShowPostDialog(true);
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Voice not supported', description: 'Use Chrome or Edge for voice input.', variant: 'destructive' });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: msg };
    const loadingMsg: ChatMessage = { role: 'assistant', content: '', loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      // Detect intent
      const lower = msg.toLowerCase();

      if (lower.includes('artigo') || lower.includes('blog') || lower.includes('article')) {
        // Extract topic
        const topic = msg.replace(/cria?r?\s+(um\s+)?artigo\s+(de\s+blog\s+)?sobre\s+/i, '').trim() || msg;
        await generateBlogPost(topic);
      } else if (lower.includes('instagram') || lower.includes('post') || lower.includes('arte')) {
        const topic = msg.replace(/cria?\s+(um?\s+)?(post|arte|conteúdo)\s+(para\s+instagram\s+)?sobre\s+/i, '').trim() || msg;
        await generateInstagram(topic);
      } else if (lower.includes('email') || lower.includes('campanha') || lower.includes('campaign')) {
        const topic = msg.replace(/cria?\s+(uma?\s+)?campanha\s+(de\s+email\s+)?sobre\s+/i, '').trim() || msg;
        await generateEmail(topic);
      } else if (lower.includes('estatística') || lower.includes('analytics') || lower.includes('performance')) {
        await showAnalytics();
      } else {
        // General chat
        await generalChat(msg);
      }
    } catch {
      setMessages(prev => prev.slice(0, -1).concat({
        role: 'assistant',
        content: '❌ Algo deu errado. Tente novamente.',
      }));
    } finally {
      setLoading(false);
    }
  }

  async function generateBlogPost(topic: string) {
    const res = await fetch('/api/marketing/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'blog_post', topic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setPendingPost(data);

    // Store in sessionStorage so the editor can pick it up immediately
    try {
      sessionStorage.setItem('homeledger-chat-draft', JSON.stringify({
        titleEn: data.titleEn,
        titlePt: data.titlePt,
        excerptEn: data.excerptEn,
        excerptPt: data.excerptPt,
        contentEn: data.contentEn,
        contentPt: data.contentPt,
        metaTitleEn: data.metaTitleEn,
        metaTitlePt: data.metaTitlePt,
        metaDescEn: data.metaDescEn,
        metaDescPt: data.metaDescPt,
        keywords: data.keywords,
        suggestedSlug: data.suggestedSlug,
        categoryId: data.categoryId,
        coverImage: data.coverImage || '',
        dallePrompt: data.dallePrompt,
        savedAt: new Date().toISOString(),
      }));
    } catch { /* sessionStorage unavailable */ }

    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: `✅ **Artigo gerado com sucesso!**\n\n**Título (EN):** ${data.titleEn}\n**Título (PT):** ${data.titlePt}\n\n**Keywords:** ${data.keywords?.join(', ')}\n\n**Instagram Caption (EN):** ${data.instagramCaptionEn}\n\nO que deseja fazer?`,
      actions: [
        { label: '📝 Revisar e editar', href: `/admin/marketing/blog/new?from=chat` },
        { label: '🚀 Publicar agora', onClick: () => saveBlogPost(data, 'published') },
        { label: '💾 Salvar rascunho', onClick: () => saveBlogPost(data, 'draft') },
        { label: '🎨 Gerar arte Instagram', onClick: () => generateCreativeFromPost(data) },
      ],
    }));
  }

  async function generateInstagram(topic: string) {
    const res = await fetch('/api/marketing/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'instagram_copy', topic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: `✅ **Conteúdo Instagram gerado!**\n\n**Caption (EN):**\n${data.captionEn}\n\n**Caption (PT):**\n${data.captionPt}\n\n**Hashtags:** ${data.hashtags?.map((h: string) => `#${h}`).join(' ')}`,
      actions: [
        { label: '🎨 Criar arte com IA', href: `/admin/marketing/creatives/new?topic=${encodeURIComponent(topic)}&captionEn=${encodeURIComponent(data.captionEn)}&hashtags=${encodeURIComponent(data.hashtags?.join(','))}` },
        { label: '📱 Ver Creative Studio', href: '/admin/marketing/creatives' },
      ],
    }));
  }

  async function generateEmail(topic: string) {
    const res = await fetch('/api/marketing/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email_campaign', topic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: `✅ **Campanha de email gerada!**\n\n**Assunto (EN):** ${data.subjectEn}\n**Assunto (PT):** ${data.subjectPt}\n\n**Preview:** ${data.previewTextEn}`,
      actions: [
        { label: '📧 Editar e enviar', href: `/admin/marketing/campaigns/new?subject=${encodeURIComponent(data.subjectEn)}&body=${encodeURIComponent(data.bodyHtmlEn)}` },
        { label: '💾 Salvar template', onClick: () => saveEmailTemplate(data) },
      ],
    }));
  }

  async function showAnalytics() {
    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: `📊 **Dashboard de Analytics**\n\n${stats ? `• **Blog posts:** ${stats.totalPosts} publicados\n• **Leads:** ${stats.totalLeads} capturados\n• **Hot leads:** ${stats.hotLeads}\n• **Campanhas enviadas:** ${stats.sentCampaigns}` : 'Carregando dados...'}`,
      actions: [
        { label: '📊 Ver analytics completo', href: '/admin/marketing/analytics' },
        { label: '👥 Ver leads', href: '/admin/marketing/leads' },
      ],
    }));
  }

  async function generalChat(msg: string) {
    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: `Entendi! Para me ajudar melhor, diz-me o que precisas:\n\n• **"Cria um artigo sobre [tema]"** — Gero artigo bilíngue completo\n• **"Post Instagram sobre [tema]"** — Caption, hashtags e prompt para imagem\n• **"Campanha de email sobre [tema]"** — Email completo PT/EN\n• **"Ver analytics"** — Performance do blog e leads`,
      actions: [
        { label: '📝 Novo artigo', onClick: () => setInput('Cria um artigo sobre ') },
        { label: '📱 Post Instagram', onClick: () => setInput('Post Instagram sobre ') },
        { label: '📧 Nova campanha', onClick: () => setInput('Campanha de email sobre ') },
      ],
    }));
  }

  async function saveBlogPost(post: GeneratedPost, status: string) {
    try {
      const res = await fetch('/api/marketing/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleEn: post.titleEn,
          titlePt: post.titlePt,
          excerptEn: post.excerptEn,
          contentEn: post.contentEn,
          contentPt: post.contentPt,
          metaDescEn: post.metaDescEn,
          keywords: post.keywords,
          slug: post.suggestedSlug,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: status === 'published' ? 'Artigo publicado! 🎉' : 'Rascunho salvo!' });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: status === 'published'
          ? `🎉 **Artigo publicado!** Disponível em:\n[/blog/${data.slug}](/blog/${data.slug})`
          : `💾 **Rascunho salvo!** Podes editar em:\n[/admin/marketing/blog](/admin/marketing/blog)`,
        actions: [{ label: '✏️ Editar artigo', href: `/admin/marketing/blog/${data.id}/edit` }],
      }]);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    }
  }

  async function saveEmailTemplate(data: any) {
    try {
      await fetch('/api/marketing/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.subjectEn,
          subject: data.subjectEn,
          subjectPt: data.subjectPt,
          bodyHtml: data.bodyHtmlEn,
          bodyHtmlPt: data.bodyHtmlPt,
          type: 'campaign',
        }),
      });
      toast({ title: 'Template salvo!' });
    } catch {
      toast({ title: 'Erro ao salvar template', variant: 'destructive' });
    }
  }

  function generateCreativeFromPost(post: GeneratedPost) {
    const params = new URLSearchParams({
      caption: post.instagramCaptionEn || '',
      hashtags: (post.instagramHashtags || []).join(','),
      prompt: post.dallePrompt || '',
    });
    router.push(`/admin/marketing/creatives/new?${params.toString()}`);
  }

  const navItems = [
    { href: '/admin/marketing/blog', icon: <BookOpen className="h-4 w-4" />, label: 'Blog', count: stats?.totalPosts },
    { href: '/admin/marketing/leads', icon: <Users className="h-4 w-4" />, label: 'Leads', count: stats?.totalLeads },
    { href: '/admin/marketing/campaigns', icon: <Mail className="h-4 w-4" />, label: 'Campanhas', count: stats?.sentCampaigns },
    { href: '/admin/marketing/creatives', icon: <ImageIcon className="h-4 w-4" />, label: 'Criativos', count: stats?.totalCreatives },
    { href: '/admin/marketing/social', icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
    { href: '/admin/marketing/analytics', icon: <BarChart3 className="h-4 w-4" />, label: 'Analytics' },
    { href: '/admin/marketing/resources', icon: <Globe className="h-4 w-4" />, label: 'Recursos' },
    { href: '/admin/marketing/popups', icon: <Megaphone className="h-4 w-4" />, label: 'Pop-ups' },
  ];

  const aiToolItems = [
    { href: '/admin/marketing/ai', icon: <BrainCircuit className="h-4 w-4 text-violet-500" />, label: 'AI Composer' },
    { href: '/admin/marketing/scheduler', icon: <Radio className="h-4 w-4 text-pink-500" />, label: 'Scheduler' },
    { href: '/admin/cowork', icon: <Bot className="h-4 w-4 text-blue-500" />, label: 'Co-Work' },
  ];

  return (
    <>
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 border-r flex flex-col bg-card shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Marketing Hub</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.count !== undefined && (
                <Badge variant="secondary" className="text-xs h-5 min-w-5 flex items-center justify-center">
                  {item.count}
                </Badge>
              )}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase tracking-wide">AI Tools</p>
            {aiToolItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        <div className="p-3 border-t">
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <ChevronRight className="h-3 w-3 rotate-180" />
            Voltar ao Admin
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
        <div className="border-b bg-card shrink-0 flex items-center justify-between px-4">
          <div className="flex">
            {([
              { key: 'chat',      label: 'AI Chat',      icon: Sparkles },
              { key: 'composer',  label: 'AI Composer',  icon: BrainCircuit },
              { key: 'scheduler', label: 'Scheduler',    icon: Calendar },
            ] as { key: typeof mainTab; label: string; icon: any }[]).map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setMainTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    mainTab === t.key
                      ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
          {stats && (
            <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {stats.totalPosts} posts</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {stats.totalLeads} leads</span>
              <span className="flex items-center gap-1 text-red-500"><TrendingUp className="h-3 w-3" /> {stats.hotLeads} hot</span>
            </div>
          )}
        </div>

        {/* ── AI CHAT TAB ───────────────────────────────────────────────────── */}
        {mainTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-2 border-b flex gap-2 overflow-x-auto shrink-0 bg-muted/20">
              {QUICK_COMMANDS.map(cmd => (
                <button key={cmd.label} onClick={() => setInput(cmd.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap hover:bg-muted transition-colors bg-background">
                  {cmd.icon}{cmd.label}
                </button>
              ))}
              <Link href="/admin/marketing/blog/new" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap hover:bg-muted transition-colors bg-background">
                <Plus className="h-3.5 w-3.5" /> Novo Artigo
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                          <Sparkles className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground">Marketing AI</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border rounded-tl-sm'}`}>
                      {msg.loading ? (
                        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Gerando conteúdo...</span></div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="underline text-primary hover:opacity-80">$1</a>').replace(/\n/g, '<br>') }} />
                      )}
                    </div>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-1">
                        {msg.actions.map((action, ai) => (
                          action.href ? <Link key={ai} href={action.href}><Button size="sm" variant={action.variant || 'outline'} className="h-7 text-xs">{action.label}</Button></Link>
                          : <Button key={ai} size="sm" variant={action.variant || 'outline'} className="h-7 text-xs" onClick={action.onClick}>{action.label}</Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t p-4 bg-card shrink-0">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <button onClick={listening ? stopListening : startListening}
                  className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-colors ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                  title={listening ? 'Parar gravação' : 'Falar comando'}>
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={listening ? '🎙️ Ouvindo...' : 'Cria um artigo sobre impostos no UK...'} className="flex-1" disabled={loading} />
                <Button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="shrink-0 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">Comandos de voz disponíveis • Conteúdo gerado por IA • PT/EN bilíngue</p>
            </div>
          </div>
        )}

        {/* ── AI COMPOSER TAB ───────────────────────────────────────────────── */}
        {mainTab === 'composer' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content type */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Content Type</CardTitle></CardHeader>
                  <CardContent className="grid gap-2">
                    {CONTENT_TYPES.map(ct => {
                      const Icon = ct.icon;
                      return (
                        <button key={ct.value} onClick={() => setCType(ct.value)}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${cType === ct.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40' : 'border-border hover:bg-muted/50'}`}>
                          <Icon className={`h-4 w-4 shrink-0 ${cType === ct.value ? 'text-violet-600' : 'text-muted-foreground'}`} />
                          <div><p className="text-sm font-medium">{ct.label}</p><p className="text-xs text-muted-foreground">{ct.desc}</p></div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
                {cType === 'social_post' && (
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Platform</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      {PLATFORMS_COMPOSER.map(p => {
                        const Icon = p.icon;
                        return (
                          <button key={p.value} onClick={() => setCPlatform(p.value)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${cPlatform === p.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-600' : 'border-border hover:bg-muted/50'}`}>
                            <Icon className="h-4 w-4" />{p.label}
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>
              {/* Form */}
              <div>
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Content Details</CardTitle><CardDescription>Tell Claude what to create</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{cType === 'campaign_insight' ? 'Data / Context' : 'Topic / Subject *'}</label>
                      <Textarea placeholder="e.g. How Clarity & Co saved our household £2,000/year" value={cTopic} onChange={e => setCTopic(e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tone</label>
                      <Select value={cTone} onValueChange={setCTone}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TONES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target Audience</label>
                      <Select value={cAudience} onValueChange={setCAudience}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUDIENCE_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Keywords</label>
                      <Input placeholder="e.g. HMRC, Self Assessment, tax return" value={cKeywords} onChange={e => setCKeywords(e.target.value)} />
                    </div>
                    {(cType === 'blog_article' || cType === 'email_campaign') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{cType === 'blog_article' ? 'Target Length' : 'Number of Emails'}</label>
                        <Input placeholder={cType === 'blog_article' ? 'e.g. 1000-1500 words' : 'e.g. 3 emails'} value={cLength} onChange={e => setCLength(e.target.value)} />
                      </div>
                    )}
                    {cType !== 'campaign_insight' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Context</label>
                        <Textarea placeholder="Any extra details..." value={cContext} onChange={e => setCContext(e.target.value)} rows={2} />
                      </div>
                    )}
                    <Button onClick={composerGenerate} disabled={cLoading || !cTopic.trim()} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                      {cLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate with Claude</>}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              {/* Result */}
              <div>
                <Card className="h-full">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div><CardTitle className="text-sm font-medium">Generated Content</CardTitle>{cModel && <Badge variant="secondary" className="mt-1 text-xs">{cModel}</Badge>}</div>
                    {cResult && <Button size="sm" variant="ghost" onClick={composerCopy}>{cCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button>}
                  </CardHeader>
                  <CardContent>
                    {cLoading && <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /><p className="text-sm">Claude is writing...</p></div>}
                    {!cLoading && !cResult && <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground"><Sparkles className="h-8 w-8 text-violet-300" /><p className="text-sm">Your generated content will appear here</p></div>}
                    {!cLoading && cResult && <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-[500px] overflow-y-auto bg-muted/30 rounded-lg p-4 font-mono">{cResult}</div>}
                  </CardContent>
                </Card>
              </div>
            </div>
            {cHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Recent Generations</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {cHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setCResult(h.content)}>
                      <Badge variant="outline" className="text-xs shrink-0">{h.type.replace('_',' ')}</Badge>
                      <p className="text-sm text-muted-foreground truncate flex-1">{h.topic}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{h.model}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── SCHEDULER TAB ─────────────────────────────────────────────────── */}
        {mainTab === 'scheduler' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Social Media Scheduler</h2>
                <p className="text-sm text-muted-foreground">Schedule and manage posts across all platforms</p>
              </div>
              <Button onClick={schedOpenCreate} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> New Post
              </Button>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label:'Total Posts', value: posts.length, icon: Calendar, color:'text-blue-600' },
                { label:'Scheduled', value: posts.filter(p=>p.status==='scheduled').length, icon: Clock, color:'text-yellow-600' },
                { label:'Published', value: posts.filter(p=>p.status==='published').length, icon: Check, color:'text-green-600' },
                { label:'Drafts', value: posts.filter(p=>p.status==='draft').length, icon: Edit2, color:'text-gray-600' },
              ].map(s => { const Icon = s.icon; return (
                <Card key={s.label}><CardContent className="p-4 flex items-center gap-3"><Icon className={`h-8 w-8 ${s.color}`} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
              ); })}
            </div>
            {/* Filters */}
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent>
              </Select>
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Platforms</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="twitter">X / Twitter</SelectItem><SelectItem value="facebook">Facebook</SelectItem></SelectContent>
              </Select>
            </div>
            {/* Posts grid */}
            {sLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
            ) : posts.filter(p => (filterStatus==='all'||p.status===filterStatus) && (filterPlatform==='all'||p.platform===filterPlatform)).length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Calendar className="h-12 w-12 text-violet-300" />
                <p className="text-sm">No posts yet — create one with AI assistance</p>
                <Button onClick={schedOpenCreate} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Create Post</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {posts.filter(p => (filterStatus==='all'||p.status===filterStatus) && (filterPlatform==='all'||p.platform===filterPlatform)).map(post => {
                  const Icon = PLATFORM_ICONS[post.platform] || Send;
                  return (
                    <Card key={post.id} className="group hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 flex flex-row items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${PLATFORM_COLORS[post.platform]||'bg-gray-500'}`}><Icon className="h-4 w-4 text-white" /></div>
                          <div><p className="text-xs font-medium capitalize">{post.platform}</p><p className="text-xs text-muted-foreground">{post.socialAccount?.accountName}</p></div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => schedOpenEdit(post)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => schedDeletePost(post.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm leading-relaxed line-clamp-4">{post.caption}</p>
                        {post.hashtags?.length > 0 && <p className="text-xs text-violet-600 dark:text-violet-400 line-clamp-2">{post.hashtags.join(' ')}</p>}
                        <div className="flex items-center justify-between pt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status]}`}>{post.status}</span>
                          {post.scheduledAt && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(post.scheduledAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>}
                          {post.publishedAt && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" />{new Date(post.publishedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>

    {/* ── Scheduler Post Dialog ─────────────────────────────────────────────── */}
    <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editPost ? 'Edit Post' : 'Create New Post'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {!editPost && (
            <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800 space-y-3">
              <p className="text-sm font-medium text-violet-700 dark:text-violet-400 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Generate with Claude AI</p>
              <div className="flex gap-2">
                <Input placeholder='e.g. "How Clarity & Co helps freelancers with tax"' value={sForm.aiTopic} onChange={e => setSForm(f => ({ ...f, aiTopic: e.target.value }))} />
                <Button onClick={schedGenerateAI} disabled={generating || !sForm.aiTopic} variant="outline" className="shrink-0">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Social Account *</label>
              <Select value={sForm.socialAccountId} onValueChange={v => setSForm(f => ({ ...f, socialAccountId: v }))}>
                <SelectTrigger><SelectValue placeholder={accounts.length === 0 ? 'No accounts connected' : 'Select account'} /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.platform} — {a.accountName}</SelectItem>)}</SelectContent>
              </Select>
              {accounts.length === 0 && <p className="text-xs text-amber-600">Connect a social account in Settings → Integrations</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Post Type</label>
              <Select value={sForm.postType} onValueChange={v => setSForm(f => ({ ...f, postType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="feed">Feed Post</SelectItem><SelectItem value="story">Story</SelectItem><SelectItem value="carousel">Carousel</SelectItem><SelectItem value="reel">Reel</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Caption *</label>
            <Textarea placeholder="Write your caption here..." value={sForm.caption} onChange={e => setSForm(f => ({ ...f, caption: e.target.value }))} rows={5} />
            <p className="text-xs text-muted-foreground text-right">{sForm.caption.length} chars</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hashtags</label>
            <Input placeholder="#clarityco #ukfinance #hmrc" value={sForm.hashtags} onChange={e => setSForm(f => ({ ...f, hashtags: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Schedule Date & Time</label>
            <Input type="datetime-local" value={sForm.scheduledAt} onChange={e => setSForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            <p className="text-xs text-muted-foreground">Leave empty to save as draft</p>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setShowPostDialog(false)}>Cancel</Button>
          <Button onClick={schedSavePost} disabled={!sForm.socialAccountId || !sForm.caption} className="bg-violet-600 hover:bg-violet-700 text-white">
            {editPost ? 'Update Post' : sForm.scheduledAt ? 'Schedule Post' : 'Save as Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
