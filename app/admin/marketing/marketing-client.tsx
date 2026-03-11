'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Mic, MicOff, Send, Sparkles, FileText, Users, Mail, BarChart3,
  Image as ImageIcon, Globe, Plus, Loader2, ChevronRight,
  Newspaper, Megaphone, TrendingUp, BookOpen, Instagram,
  BrainCircuit, Radio, Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  variant?: 'default' | 'outline' | 'ghost';
}

interface GeneratedPost {
  titleEn: string; titlePt: string;
  excerptEn: string; excerptPt: string;
  contentEn: string; contentPt: string;
  metaTitleEn: string; metaTitlePt: string;
  metaDescEn: string; metaDescPt: string;
  keywords: string[]; suggestedSlug: string; categoryId?: string;
  coverImage?: string; dallePrompt?: string;
  instagramCaptionEn?: string; instagramHashtags?: string[];
}

const QUICK_COMMANDS = [
  { icon: <Newspaper className='h-4 w-4' />, label: 'Criar artigo de blog', prompt: 'Cria um artigo sobre ' },
  { icon: <Instagram className='h-4 w-4' />, label: 'Post Instagram', prompt: 'Cria conteúdo para Instagram sobre ' },
  { icon: <Mail className='h-4 w-4' />, label: 'Campanha de email', prompt: 'Cria uma campanha de email sobre ' },
  { icon: <ImageIcon className='h-4 w-4' />, label: 'Arte para redes sociais', prompt: 'Gera arte para Instagram sobre ' },
];

export default function MarketingClient() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: '👋 Olá! Sou o seu assistente de marketing da Clarity & Co.\n\nPosso criar artigos de blog bilíngues, conteúdo para Instagram, campanhas de email e muito mais — por texto ou voz.\n\n**Como posso ajudar hoje?**',
  }]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingPost, setPendingPost] = useState<GeneratedPost | null>(null);
  const [stats, setStats] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetch('/api/marketing/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Voz não suportada', description: 'Use Chrome ou Edge para entrada de voz.', variant: 'destructive' });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
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
      const lower = msg.toLowerCase();
      if (lower.includes('artigo') || lower.includes('blog') || lower.includes('article')) {
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
        await generalChat(msg);
      }
    } catch {
      setMessages(prev => prev.slice(0, -1).concat({ role: 'assistant', content: '❌ Algo deu errado. Tente novamente.' }));
    } finally {
      setLoading(false);
    }
  }

  async function generateBlogPost(topic: string) {
    const res = await fetch('/api/marketing/ai-generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'blog_post', topic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setPendingPost(data);
    try {
      sessionStorage.setItem('homeledger-chat-draft', JSON.stringify({
        titleEn: data.titleEn, titlePt: data.titlePt,
        excerptEn: data.excerptEn, excerptPt: data.excerptPt,
        contentEn: data.contentEn, contentPt: data.contentPt,
        metaTitleEn: data.metaTitleEn, metaTitlePt: data.metaTitlePt,
        metaDescEn: data.metaDescEn, metaDescPt: data.metaDescPt,
        keywords: data.keywords, suggestedSlug: data.suggestedSlug,
        categoryId: data.categoryId, coverImage: data.coverImage || '',
        dallePrompt: data.dallePrompt, savedAt: new Date().toISOString(),
      }));
    } catch { /* sessionStorage unavailable */ }
    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: '✅ **Artigo gerado com sucesso!**\n\n**Título (EN):** ' + data.titleEn + '\n**Título (PT):** ' + data.titlePt + '\n\n**Keywords:** ' + data.keywords?.join(', ') + '\n\nO que deseja fazer?',
      actions: [
        { label: '📝 Revisar e editar', href: '/admin/marketing/blog/new?from=chat' },
        { label: '🚀 Publicar agora', onClick: () => saveBlogPost(data, 'published') },
        { label: '💾 Salvar rascunho', onClick: () => saveBlogPost(data, 'draft') },
      ],
    }));
  }

  async function generateInstagram(topic: string) {
    const res = await fetch('/api/marketing/ai-generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'instagram_copy', topic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: '✅ **Conteúdo Instagram gerado!**\n\n**Caption (EN):**\n' + data.captionEn + '\n\n**Caption (PT):**\n' + data.captionPt,
      actions: [
        { label: '🎨 Criar arte com IA', href: '/admin/marketing/creatives/new' },
        { label: '📱 Ver Creative Studio', href: '/admin/marketing/creatives' },
      ],
    }));
  }

  async function generateEmail(topic: string) {
    const res = await fetch('/api/marketing/ai-generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email_campaign', topic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: '✅ **Campanha de email gerada!**\n\n**Assunto (EN):** ' + data.subjectEn + '\n**Assunto (PT):** ' + data.subjectPt,
      actions: [{ label: '📧 Editar e enviar', href: '/admin/marketing/campaigns/new' }],
    }));
  }

  async function showAnalytics() {
    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: '📊 **Dashboard de Analytics**\n\n' + (stats ? '• **Blog posts:** ' + stats.totalPosts + ' publicados\n• **Leads:** ' + stats.totalLeads + ' capturados\n• **Hot leads:** ' + stats.hotLeads : 'Carregando dados...'),
      actions: [
        { label: '📊 Ver analytics', href: '/admin/marketing/analytics' },
        { label: '👥 Ver leads', href: '/admin/marketing/leads' },
      ],
    }));
  }

  async function generalChat(msg: string) {
    setMessages(prev => prev.slice(0, -1).concat({
      role: 'assistant',
      content: 'Entendi! Para me ajudar melhor, diz-me o que precisas:\n\n• ** Cria um artigo sobre [tema]** — Gero artigo bilíngue completo\n• **Post Instagram sobre [tema]** — Caption, hashtags e prompt para imagem\n• **Campanha de email sobre [tema]** — Email completo PT/EN\n• **Ver analytics** — Performance do blog e leads',
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleEn: post.titleEn, titlePt: post.titlePt,
          excerptEn: post.excerptEn, contentEn: post.contentEn,
          contentPt: post.contentPt, metaDescEn: post.metaDescEn,
          keywords: post.keywords, slug: post.suggestedSlug, status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: status === 'published' ? 'Artigo publicado! 🎉' : 'Rascunho salvo!' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    }
  }

  const navItems = [
    { href: '/admin/marketing/blog', icon: <BookOpen className='h-4 w-4' />, label: 'Blog', count: stats?.totalPosts },
    { href: '/admin/marketing/leads', icon: <Users className='h-4 w-4' />, label: 'Leads', count: stats?.totalLeads },
    { href: '/admin/marketing/campaigns', icon: <Mail className='h-4 w-4' />, label: 'Campanhas', count: stats?.sentCampaigns },
    { href: '/admin/marketing/creatives', icon: <ImageIcon className='h-4 w-4' />, label: 'Criativos', count: stats?.totalCreatives },
    { href: '/admin/marketing/social', icon: <Instagram className='h-4 w-4' />, label: 'Instagram' },
    { href: '/admin/marketing/analytics', icon: <BarChart3 className='h-4 w-4' />, label: 'Analytics' },
    { href: '/admin/marketing/resources', icon: <Globe className='h-4 w-4' />, label: 'Recursos' },
    { href: '/admin/marketing/popups', icon: <Megaphone className='h-4 w-4' />, label: 'Pop-ups' },
  ];

  const aiToolItems = [
    { href: '/admin/marketing/ai', icon: <BrainCircuit className='h-4 w-4 text-violet-500' />, label: 'AI Composer' },
    { href: '/admin/marketing/scheduler', icon: <Radio className='h-4 w-4 text-pink-500' />, label: 'Scheduler' },
    { href: '/admin/cowork', icon: <Bot className='h-4 w-4 text-blue-500' />, label: 'Co-Work' },
  ];

  return (
    <div className='flex h-screen bg-background overflow-hidden'>
      <div className='w-56 border-r flex flex-col bg-card shrink-0'>
        <div className='p-4 border-b'>
          <div className='flex items-center gap-2'>
            <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center'>
              <Megaphone className='h-4 w-4 text-white' />
            </div>
            <span className='font-semibold text-sm'>Marketing Hub</span>
          </div>
        </div>
        <nav className='flex-1 p-3 space-y-1 overflow-y-auto'>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'>
              {item.icon}
              <span className='flex-1'>{item.label}</span>
              {item.count !== undefined && (
                <Badge variant='secondary' className='text-xs h-5 min-w-5 flex items-center justify-center'>
                  {item.count}
                </Badge>
              )}
            </Link>
          ))}
          <div className='pt-3 mt-2 border-t'>
            <p className='text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase tracking-wide'>AI Tools</p>
            {aiToolItems.map(item => (
              <Link key={item.href} href={item.href}
                className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        <div className='p-3 border-t'>
          <Link href='/admin' className='flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'>
            <ChevronRight className='h-3 w-3 rotate-180' />
            Voltar ao Admin
          </Link>
        </div>
      </div>

      <div className='flex-1 flex flex-col overflow-hidden'>
        <div className='border-b px-6 py-3 flex items-center justify-between shrink-0 bg-card'>
          <div className='flex items-center gap-3'>
            <div className='h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center'>
              <Sparkles className='h-4 w-4 text-white' />
            </div>
            <div>
              <h1 className='text-sm font-semibold'>AI Marketing Assistant</h1>
              <p className='text-xs text-muted-foreground'>Comandos por texto ou voz</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {stats && (
              <div className='hidden md:flex items-center gap-4 text-xs text-muted-foreground mr-4'>
                <span className='flex items-center gap-1'><FileText className='h-3 w-3' /> {stats.totalPosts} posts</span>
                <span className='flex items-center gap-1'><Users className='h-3 w-3' /> {stats.totalLeads} leads</span>
                <span className='flex items-center gap-1 text-red-500'><TrendingUp className='h-3 w-3' /> {stats.hotLeads} hot</span>
              </div>
            )}
            <Button variant='outline' size='sm' asChild>
              <Link href='/admin/marketing/blog/new'>
                <Plus className='h-4 w-4 mr-1' /> Novo Artigo
              </Link>
            </Button>
          </div>
        </div>

        <div className='px-6 py-2 border-b flex gap-2 overflow-x-auto shrink-0 bg-muted/20'>
          {QUICK_COMMANDS.map(cmd => (
            <button key={cmd.label} onClick={() => setInput(cmd.prompt)}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap hover:bg-muted transition-colors bg-background'>
              {cmd.icon}{cmd.label}
            </button>
          ))}
        </div>

        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
          {messages.map((msg, i) => (
            <div key={i} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={'max-w-2xl ' + (msg.role === 'user' ? 'order-2' : 'order-1')}>
                {msg.role === 'assistant' && (
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='h-6 w-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0'>
                      <Sparkles className='h-3 w-3 text-white' />
                    </div>
                    <span className='text-xs text-muted-foreground'>Marketing AI</span>
                  </div>
                )}
                <div className={'rounded-2xl px-4 py-3 ' + (msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border rounded-tl-sm')}>
                  {msg.loading ? (
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      <span className='text-sm'>Gerando conteúdo...</span>
                    </div>
                  ) : (
                    <div className='text-sm whitespace-pre-wrap leading-relaxed'
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="underline text-primary hover:opacity-80">$1</a>')
                          .replace(/\n/g, '<br>'),
                      }}
                    />
                  )}
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className='flex flex-wrap gap-2 mt-2 ml-1'>
                    {msg.actions.map((action, ai) => (
                      action.href ? (
                        <Link key={ai} href={action.href}>
                          <Button size='sm' variant={action.variant || 'outline'} className='h-7 text-xs'>{action.label}</Button>
                        </Link>
                      ) : (
                        <Button key={ai} size='sm' variant={action.variant || 'outline'} className='h-7 text-xs' onClick={action.onClick}>{action.label}</Button>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className='border-t p-4 bg-card shrink-0'>
          <div className='flex gap-2 max-w-3xl mx-auto'>
            <button onClick={listening ? stopListening : startListening}
              className={'shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-colors ' + (listening ? 'bg-red-500 text-white animate-pulse' : 'bg-muted hover:bg-muted/80 text-muted-foreground')}
              title={listening ? 'Parar gravação' : 'Falar comando'}>
              {listening ? <MicOff className='h-4 w-4' /> : <Mic className='h-4 w-4' />}
            </button>
            <Input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={listening ? '🎙️ Ouvindo...' : 'Cria um artigo sobre impostos no UK...'}
              className='flex-1' disabled={loading} />
            <Button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className='shrink-0 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'>
              {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
            </Button>
          </div>
          <p className='text-center text-xs text-muted-foreground mt-2'>
            Comandos de voz disponíveis • Conteúdo gerado por IA • PT/EN bilíngue
          </p>
        </div>
      </div>
    </div>
  );
}
