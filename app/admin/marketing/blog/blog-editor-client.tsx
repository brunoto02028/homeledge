'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  ArrowLeft, Save, Globe, Eye, Loader2, Sparkles, X, Plus,
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Link2,
  Image as ImageIcon, Quote, Code, Undo, Redo, ChevronDown,
  Upload, Wand2, CloudOff, CheckCircle2, RotateCcw, Mic, MicOff, Send, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Category { id: string; name: string; }
interface Tag { id: string; name: string; }

interface EditorProps {
  postId?: string;
  initialData?: any;
}

export default function BlogEditorClient({ postId, initialData }: EditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'en' | 'pt'>('en');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(!postId);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Voice input for AI prompt
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Image chat modal
  const [showImageChat, setShowImageChat] = useState(false);
  const [imageChatInput, setImageChatInput] = useState('');
  const [imageChatMessages, setImageChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [imageChatLoading, setImageChatLoading] = useState(false);
  const [currentImagePrompt, setCurrentImagePrompt] = useState('');

  // Auto-save state
  const [isDirty, setIsDirty] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState<any>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const DRAFT_KEY = `homeledger-blog-draft-${postId || 'new'}`;

  // Form state
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || '');
  const [titlePt, setTitlePt] = useState(initialData?.titlePt || '');
  const [excerptEn, setExcerptEn] = useState(initialData?.excerptEn || '');
  const [excerptPt, setExcerptPt] = useState(initialData?.excerptPt || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [metaTitleEn, setMetaTitleEn] = useState(initialData?.metaTitleEn || '');
  const [metaDescEn, setMetaDescEn] = useState(initialData?.metaDescEn || '');
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags?.map((t: any) => t.tag.id) || []
  );
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [scheduledAt, setScheduledAt] = useState(initialData?.scheduledAt || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');

  // ── Editors (declared before auto-save helpers to avoid 'used before declaration') ──
  const editorEn = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your article content in English...' }),
    ],
    content: initialData?.contentEn || '',
    editorProps: { attributes: { class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-96 px-1' } },
  });

  const editorPt = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do artigo em Português...' }),
    ],
    content: initialData?.contentPt || '',
    editorProps: { attributes: { class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-96 px-1' } },
  });

  const activeEditor = activeTab === 'en' ? editorEn : editorPt;

  // ── Auto-save helpers ──────────────────────────────────────────────
  const collectDraft = useCallback(() => ({
    titleEn, titlePt, excerptEn, excerptPt, slug,
    metaTitleEn, metaDescEn, keywords, categoryId,
    selectedTagIds, status, scheduledAt, coverImage,
    contentEn: editorEn?.getHTML() || '',
    contentPt: editorPt?.getHTML() || '',
    savedAt: new Date().toISOString(),
  }), [titleEn, titlePt, excerptEn, excerptPt, slug, metaTitleEn, metaDescEn,
       keywords, categoryId, selectedTagIds, status, scheduledAt, coverImage,
       editorEn, editorPt]);

  const saveLocalDraft = useCallback(() => {
    try {
      const draft = collectDraft();
      const hasContent = draft.titleEn || draft.contentEn !== '<p></p>' && draft.contentEn;
      if (!hasContent) return;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setLastAutoSave(new Date());
      setIsDirty(false);
    } catch { /* storage full or unavailable */ }
  }, [collectDraft, DRAFT_KEY]);

  const clearLocalDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }, [DRAFT_KEY]);

  const applyDraft = useCallback((draft: any) => {
    setTitleEn(draft.titleEn || '');
    setTitlePt(draft.titlePt || '');
    setExcerptEn(draft.excerptEn || '');
    setExcerptPt(draft.excerptPt || '');
    setSlug(draft.slug || '');
    setMetaTitleEn(draft.metaTitleEn || '');
    setMetaDescEn(draft.metaDescEn || '');
    setKeywords(draft.keywords || []);
    setCategoryId(draft.categoryId || '');
    setSelectedTagIds(draft.selectedTagIds || []);
    setStatus(draft.status || 'draft');
    setScheduledAt(draft.scheduledAt || '');
    setCoverImage(draft.coverImage || '');
    if (draft.contentEn) editorEn?.commands.setContent(draft.contentEn);
    if (draft.contentPt) editorPt?.commands.setContent(draft.contentPt);
  }, [editorEn, editorPt]);

  // Check for existing draft on mount
  useEffect(() => {
    if (initialData) return;

    // ── If coming from the Marketing Hub chat, load article from sessionStorage ──
    const fromChat = searchParams.get('from') === 'chat';
    if (fromChat) {
      try {
        const raw = sessionStorage.getItem('homeledger-chat-draft');
        if (raw) {
          const draft = JSON.parse(raw);
          // Apply after a short delay to let editors initialise
          setTimeout(() => {
            setTitleEn(draft.titleEn || '');
            setTitlePt(draft.titlePt || '');
            setExcerptEn(draft.excerptEn || '');
            setExcerptPt(draft.excerptPt || '');
            setSlug(draft.suggestedSlug || draft.slug || '');
            setMetaTitleEn(draft.metaTitleEn || '');
            setMetaDescEn(draft.metaDescEn || '');
            setKeywords(draft.keywords || []);
            if (draft.categoryId) setCategoryId(draft.categoryId);
            if (draft.coverImage) setCoverImage(draft.coverImage);
            if (draft.contentEn) editorEn?.commands.setContent(draft.contentEn);
            if (draft.contentPt) editorPt?.commands.setContent(draft.contentPt);
            setShowAiPanel(false);
            setIsDirty(false);
            sessionStorage.removeItem('homeledger-chat-draft');
            toast({ title: '📋 Artigo carregado do Marketing Hub!' });
          }, 300);
          return;
        }
      } catch { /* ignore */ }
    }

    // ── Otherwise check localStorage for auto-saved draft ──
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.titleEn || draft.contentEn) {
        setRestoredDraft(draft);
        setShowRestoreBanner(true);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DRAFT_KEY, initialData, searchParams]);

  // Auto-save every 30 seconds when dirty
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      if (isDirty) saveLocalDraft();
    }, 30_000);
    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, [isDirty, saveLocalDraft]);

  // Mark dirty on any field change
  useEffect(() => { setIsDirty(true); },
    [titleEn, titlePt, excerptEn, excerptPt, slug, metaTitleEn, metaDescEn,
     keywords, categoryId, selectedTagIds, status, scheduledAt, coverImage]);

  // Also save draft whenever the editor content changes (debounced via interval)
  useEffect(() => {
    const handler = () => setIsDirty(true);
    editorEn?.on('update', handler);
    editorPt?.on('update', handler);
    return () => {
      editorEn?.off('update', handler);
      editorPt?.off('update', handler);
    };
  }, [editorEn, editorPt]);

  // beforeunload — warn if unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      saveLocalDraft(); // flush one last time
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, saveLocalDraft]);

  useEffect(() => {
    Promise.all([
      fetch('/api/marketing/blog/categories').then(r => r.json()),
      fetch('/api/marketing/blog/tags').then(r => r.json()),
    ]).then(([cats, tgs]) => {
      setCategories(cats);
      setTags(tgs);
    });
  }, []);

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function generateWithAI() {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    setShowAiPanel(false);
    try {
      // Step 1 — Generate article text
      toast({ title: '✍️ Generating long-form article...', description: 'This takes 30–60 seconds. Please wait.' });
      const res = await fetch('/api/marketing/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'blog_post', topic: aiTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTitleEn(data.titleEn || '');
      setTitlePt(data.titlePt || '');
      setExcerptEn(data.excerptEn || '');
      setExcerptPt(data.excerptPt || '');
      setSlug(data.suggestedSlug || autoSlug(data.titleEn || ''));
      setMetaTitleEn(data.metaTitleEn || '');
      setMetaDescEn(data.metaDescEn || '');
      setKeywords(data.keywords || []);
      editorEn?.commands.setContent(data.contentEn || '');
      editorPt?.commands.setContent(data.contentPt || '');

      // Apply auto-created category
      if (data.categoryId) {
        setCategoryId(data.categoryId);
        // Refresh categories list so the new one shows in the dropdown
        fetch('/api/marketing/blog/categories').then(r => r.json()).then(setCategories).catch(() => {});
      }

      toast({ title: '✅ Article ready!', description: `${data.categoryName ? `Category: ${data.categoryName}. ` : ''}Now generating cover image...` });

      // Step 2 — Auto-generate cover image using DALL-E prompt from AI
      if (data.dallePrompt) {
        setGeneratingCover(true);
        try {
          const imgRes = await fetch('/api/marketing/creatives/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: data.dallePrompt,
              type: 'blog_cover',
              style: 'natural',
            }),
          });
          const imgData = await imgRes.json();
          if (imgRes.ok && imgData.url) {
            setCoverImage(imgData.url);
            toast({ title: '🎨 Cover image generated!', description: 'Your article is complete and ready to publish.' });
          }
        } catch { /* cover image failure is non-fatal */ }
        finally { setGeneratingCover(false); }
      }

    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
      setShowAiPanel(true);
    } finally {
      setGenerating(false);
    }
  }

  // Voice input for AI topic
  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast({ title: 'Voice not supported', description: 'Use Chrome or Edge.', variant: 'destructive' }); return; }
    const r = new SR();
    r.lang = 'pt-BR';
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => { setAiTopic(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    r.start();
    setListening(true);
  }
  function stopVoice() { recognitionRef.current?.stop(); setListening(false); }

  // Image chat: send a refinement message and generate
  async function sendImageChatMessage(msg?: string) {
    const text = (msg || imageChatInput).trim();
    if (!text) return;
    setImageChatInput('');
    const newPrompt = currentImagePrompt
      ? `${currentImagePrompt}. Also: ${text}`
      : `Professional editorial blog cover image. ${text}. Article title: "${titleEn || aiTopic}". No text or words in the image.`;
    setCurrentImagePrompt(newPrompt);
    setImageChatMessages(prev => [...prev, { role: 'user', text }]);
    setImageChatLoading(true);
    try {
      const res = await fetch('/api/marketing/creatives/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newPrompt, type: 'blog_cover', style: 'natural' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const url = data.url || data.imageUrl || '';
      setCoverImage(url);
      setImageChatMessages(prev => [...prev, { role: 'ai', text: '🎨 Image generated! You can keep refining or close.' }]);
      toast({ title: '🎨 Cover image generated!' });
    } catch (e: any) {
      setImageChatMessages(prev => [...prev, { role: 'ai', text: `❌ Failed: ${e.message}` }]);
    } finally {
      setImageChatLoading(false);
    }
  }

  async function generateCoverImage() {
    const title = titleEn || aiTopic;
    if (!title.trim()) {
      setShowImageChat(true);
      setImageChatMessages([{ role: 'ai', text: '💬 Describe the cover image you want. I\'ll generate it for you.' }]);
      return;
    }
    // Open chat pre-loaded with title context
    setCurrentImagePrompt('');
    setImageChatMessages([{ role: 'ai', text: `💬 I'll generate a cover for "${title}". Describe any specific style, colours, or elements — or just click Generate.` }]);
    setShowImageChat(true);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/local', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoverImage(data.url);
      toast({ title: '✅ Image uploaded!' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  }

  async function handleSave(saveStatus?: string) {
    const contentEn = editorEn?.getHTML() || '';
    const contentPt = editorPt?.getHTML() || '';
    if (!titleEn || !contentEn) {
      toast({ title: 'Title and content (EN) are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titleEn, titlePt, slug: slug || autoSlug(titleEn),
        excerptEn, excerptPt, contentEn, contentPt,
        metaTitleEn, metaDescEn, keywords, categoryId: categoryId || null,
        tagIds: selectedTagIds, coverImage,
        status: saveStatus || status,
        scheduledAt: scheduledAt || null,
      };

      const url = postId ? `/api/marketing/blog/${postId}` : '/api/marketing/blog';
      const method = postId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      clearLocalDraft(); // ✅ server saved — clear local draft
      setIsDirty(false);
      setLastAutoSave(new Date());
      toast({ title: saveStatus === 'published' ? '🎉 Article published!' : '💾 Saved!' });
      if (!postId) router.push(`/admin/marketing/blog/${data.id}/edit`);
    } catch (e: any) {
      saveLocalDraft(); // 🛡️ server failed — save locally
      toast({ title: 'Save failed', description: e.message + ' — draft saved locally.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }

  function addKeyword() {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords(prev => [...prev, kw]);
      setNewKeyword('');
    }
  }

  const ToolbarButton = ({ onClick, active, title, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b px-6 py-3 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing/blog">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{postId ? 'Edit Article' : 'New Article'}</span>
            <Badge variant={status === 'published' ? 'default' : 'secondary'} className="text-xs capitalize">
              {status}
            </Badge>
            {/* Auto-save indicator */}
            {isDirty ? (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <CloudOff className="h-3 w-3" /> Unsaved changes
              </span>
            ) : lastAutoSave ? (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 className="h-3 w-3" /> Saved locally
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'published' && slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-1" /> Preview
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
          >
            <Globe className="h-4 w-4 mr-1" /> Publish
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Main editor */}
        <div className="flex-1 p-6 max-w-4xl">

          {/* Restore draft banner */}
          {showRestoreBanner && restoredDraft && (
            <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  Unsaved draft found
                </span>
                <span className="text-amber-600 dark:text-amber-400 text-xs">
                  from {new Date(restoredDraft.savedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-amber-400 text-amber-700 hover:bg-amber-100"
                  onClick={() => {
                    applyDraft(restoredDraft);
                    setShowRestoreBanner(false);
                    toast({ title: '✅ Draft restored!' });
                  }}
                >
                  Restore draft
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-muted-foreground"
                  onClick={() => { clearLocalDraft(); setShowRestoreBanner(false); }}
                >
                  Discard
                </Button>
              </div>
            </div>
          )}

          {/* AI Generation Panel */}
          {showAiPanel && !generating && (
            <div className="mb-6 p-5 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-sm">Generate with AI</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={listening ? stopVoice : startVoice}
                  className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                    listening ? 'bg-red-500 text-white animate-pulse' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                  title={listening ? 'Stop recording' : 'Speak your topic'}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <Input
                  placeholder={listening ? '🎤 Listening...' : "Article topic... e.g. 'How to register as self-employed in the UK'"}
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateWithAI()}
                  className="flex-1"
                />
                <Button onClick={generateWithAI} disabled={!aiTopic.trim()} className="bg-purple-600 text-white hover:bg-purple-700">
                  <Sparkles className="h-4 w-4 mr-1" /> Generate
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Generates bilingual (EN + PT) article, SEO fields, Instagram caption, and DALL-E prompt.</p>
            </div>
          )}

          {(generating || generatingCover) && (
            <div className="mb-6 p-8 rounded-xl border bg-muted/30 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              {generating ? (
                <>
                  <p className="text-sm font-medium">Step 1/2 — Generating long-form article with AI...</p>
                  <p className="text-xs text-muted-foreground">Writing 2500+ words, SEO, official links, bilingual content. Takes 30–60s.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Step 2/2 — Generating cover image with DALL-E 3...</p>
                  <p className="text-xs text-muted-foreground">Creating a professional widescreen cover image for the article.</p>
                </>
              )}
              <div className="flex gap-2 mt-1">
                <span className={`h-2 w-8 rounded-full ${generating ? 'bg-purple-500 animate-pulse' : 'bg-purple-300'}`} />
                <span className={`h-2 w-8 rounded-full ${generatingCover ? 'bg-purple-500 animate-pulse' : 'bg-muted'}`} />
              </div>
            </div>
          )}

          {!showAiPanel && !generating && !postId && (
            <div className="mb-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAiPanel(true)}>
                <Sparkles className="h-4 w-4 mr-1" /> Generate with AI
              </Button>
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <Input
              value={activeTab === 'en' ? titleEn : titlePt}
              onChange={e => activeTab === 'en'
                ? (setTitleEn(e.target.value), !slug && setSlug(autoSlug(e.target.value)))
                : setTitlePt(e.target.value)
              }
              placeholder={activeTab === 'en' ? 'Article title in English...' : 'Título do artigo em Português...'}
              className="text-2xl font-bold border-0 border-b rounded-none px-0 h-auto py-2 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Excerpt */}
          <div className="mb-4">
            <Input
              value={activeTab === 'en' ? excerptEn : excerptPt}
              onChange={e => activeTab === 'en' ? setExcerptEn(e.target.value) : setExcerptPt(e.target.value)}
              placeholder={activeTab === 'en' ? 'Short excerpt (shown on blog listing)...' : 'Resumo curto (mostrado na listagem)...'}
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0 text-muted-foreground"
            />
          </div>

          {/* Language tabs */}
          <div className="flex gap-2 mb-4 border-b pb-0">
            <button
              onClick={() => setActiveTab('en')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === 'en' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setActiveTab('pt')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === 'pt' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              🇧🇷 Português
            </button>
          </div>

          {/* Toolbar */}
          {activeEditor && (
            <div className="flex items-center gap-0.5 flex-wrap p-2 border rounded-t-lg bg-muted/30 mb-0">
              <ToolbarButton onClick={() => activeEditor.chain().focus().undo().run()} title="Undo"><Undo className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => activeEditor.chain().focus().redo().run()} title="Redo"><Redo className="h-4 w-4" /></ToolbarButton>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolbarButton onClick={() => activeEditor.chain().focus().toggleBold().run()} active={activeEditor.isActive('bold')} title="Bold"><Bold className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => activeEditor.chain().focus().toggleItalic().run()} active={activeEditor.isActive('italic')} title="Italic"><Italic className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => activeEditor.chain().focus().toggleCode().run()} active={activeEditor.isActive('code')} title="Code"><Code className="h-4 w-4" /></ToolbarButton>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolbarButton onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()} active={activeEditor.isActive('heading', { level: 2 })} title="H2"><Heading2 className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => activeEditor.chain().focus().toggleHeading({ level: 3 }).run()} active={activeEditor.isActive('heading', { level: 3 })} title="H3"><Heading3 className="h-4 w-4" /></ToolbarButton>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolbarButton onClick={() => activeEditor.chain().focus().toggleBulletList().run()} active={activeEditor.isActive('bulletList')} title="Bullet list"><List className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => activeEditor.chain().focus().toggleOrderedList().run()} active={activeEditor.isActive('orderedList')} title="Numbered list"><ListOrdered className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => activeEditor.chain().focus().toggleBlockquote().run()} active={activeEditor.isActive('blockquote')} title="Quote"><Quote className="h-4 w-4" /></ToolbarButton>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolbarButton
                onClick={() => {
                  const url = window.prompt('Enter URL');
                  if (url) activeEditor.chain().focus().setLink({ href: url }).run();
                }}
                active={activeEditor.isActive('link')}
                title="Link"
              >
                <Link2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  const url = window.prompt('Enter image URL');
                  if (url) activeEditor.chain().focus().setImage({ src: url }).run();
                }}
                title="Image"
              >
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
            </div>
          )}

          {/* Editor Content */}
          <div className="border border-t-0 rounded-b-lg p-4 min-h-96 bg-background">
            {activeTab === 'en' ? (
              <EditorContent editor={editorEn} />
            ) : (
              <EditorContent editor={editorPt} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l p-4 space-y-5 shrink-0 overflow-y-auto max-h-[calc(100vh-57px)] sticky top-14">
          {/* Publish */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Publish</h3>
            <div className="space-y-2">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
              {status === 'scheduled' && (
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="text-sm"
                />
              )}
            </div>
          </div>

          {/* Slug */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">URL Slug</Label>
            <Input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="article-url-slug"
              className="mt-1 text-sm font-mono"
            />
            {slug && <p className="text-xs text-muted-foreground mt-1">/blog/{slug}</p>}
          </div>

          {/* Cover image */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Cover Image</Label>

            {/* Preview */}
            {coverImage ? (
              <div className="mt-2 relative group">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="rounded-lg w-full h-32 object-cover bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                  }}
                />
                <div hidden className="rounded-lg border border-destructive/30 bg-destructive/5 h-32 flex flex-col items-center justify-center gap-1">
                  <p className="text-xs text-destructive">⚠️ Image not loading</p>
                  <p className="text-xs text-muted-foreground px-2 text-center truncate max-w-full">{coverImage}</p>
                </div>
                <button
                  onClick={() => setCoverImage('')}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="mt-2 rounded-lg border-2 border-dashed border-border h-24 flex items-center justify-center text-xs text-muted-foreground">
                No cover image
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-2 flex gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={generateCoverImage}
                disabled={generatingCover || uploadingCover}
              >
                {generatingCover
                  ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  : <MessageSquare className="h-3 w-3 mr-1" />
                }
                AI Generate
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={() => coverInputRef.current?.click()}
                disabled={generatingCover || uploadingCover}
              >
                {uploadingCover
                  ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  : <Upload className="h-3 w-3 mr-1" />
                }
                Upload
              </Button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            {/* Manual URL fallback */}
            <Input
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              placeholder="Or paste URL..."
              className="mt-1.5 text-xs h-8"
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Category</Label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background"
            >
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Tags</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div>
            <button
              onClick={() => setShowSeoPanel(!showSeoPanel)}
              className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase"
            >
              SEO Settings <ChevronDown className={`h-3 w-3 transition-transform ${showSeoPanel ? 'rotate-180' : ''}`} />
            </button>
            {showSeoPanel && (
              <div className="mt-2 space-y-2">
                <div>
                  <Label className="text-xs">Meta Title (EN)</Label>
                  <Input value={metaTitleEn} onChange={e => setMetaTitleEn(e.target.value)} placeholder="SEO title..." className="mt-0.5 text-sm" />
                  <p className="text-xs text-muted-foreground mt-0.5">{metaTitleEn.length}/55</p>
                </div>
                <div>
                  <Label className="text-xs">Meta Description (EN)</Label>
                  <textarea
                    value={metaDescEn}
                    onChange={e => setMetaDescEn(e.target.value)}
                    placeholder="SEO description..."
                    rows={3}
                    className="mt-0.5 w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">{metaDescEn.length}/155</p>
                </div>
                <div>
                  <Label className="text-xs">Keywords</Label>
                  <div className="flex gap-1 mt-0.5">
                    <Input
                      value={newKeyword}
                      onChange={e => setNewKeyword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addKeyword()}
                      placeholder="Add keyword"
                      className="text-sm flex-1"
                    />
                    <Button type="button" size="icon" variant="outline" onClick={addKeyword} className="h-8 w-8 shrink-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {keywords.map(kw => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs">
                        {kw}
                        <button onClick={() => setKeywords(prev => prev.filter(k => k !== kw))}>
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Chat Modal */}
      {showImageChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Wand2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Cover Image Generator</h3>
                  <p className="text-xs text-muted-foreground">Chat to refine your image prompt</p>
                </div>
              </div>
              <button onClick={() => setShowImageChat(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview */}
            {coverImage && (
              <div className="px-5 pt-4">
                <img src={coverImage} alt="Cover preview" className="w-full h-36 object-cover rounded-xl border" />
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-32">
              {imageChatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                    m.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {imageChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-3 py-2 rounded-xl rounded-tl-sm flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Generating image...
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="px-5 pb-2 flex flex-wrap gap-1.5">
              {['Dark background, minimal', 'Bright and modern', 'UK flag colours', 'Abstract finance theme', 'Professional photo style'].map(s => (
                <button
                  key={s}
                  onClick={() => sendImageChatMessage(s)}
                  disabled={imageChatLoading}
                  className="px-2.5 py-1 rounded-full border text-xs hover:bg-muted transition-colors disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-5 pb-5 pt-2 border-t flex gap-2">
              <Input
                value={imageChatInput}
                onChange={e => setImageChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendImageChatMessage()}
                placeholder="Describe style, colours, mood..."
                className="flex-1 text-sm"
                disabled={imageChatLoading}
              />
              <Button
                onClick={() => sendImageChatMessage()}
                disabled={!imageChatInput.trim() || imageChatLoading}
                size="sm"
                className="bg-purple-600 text-white hover:bg-purple-700 shrink-0"
              >
                {imageChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
