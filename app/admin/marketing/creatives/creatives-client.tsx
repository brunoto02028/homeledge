'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Sparkles, Download, Instagram, Send, Loader2, Plus,
  Image as ImageIcon, RefreshCw, Save, Trash2, Eye, Copy, Check,
  AlignLeft, AlignCenter, Type, Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

type CreativeType = 'feed_1x1' | 'story_9x16' | 'carousel' | 'banner';

const TYPE_CONFIG: Record<CreativeType, { label: string; width: number; height: number; icon: string }> = {
  feed_1x1: { label: 'Feed (1:1)', width: 400, height: 400, icon: '⬛' },
  story_9x16: { label: 'Story (9:16)', width: 225, height: 400, icon: '📱' },
  banner: { label: 'Banner (16:9)', width: 400, height: 225, icon: '🖥️' },
  carousel: { label: 'Carousel', width: 400, height: 400, icon: '🎠' },
};

interface Creative {
  id: string;
  title: string;
  type: string;
  imageUrl: string | null;
  captionEn: string | null;
  captionPt: string | null;
  hashtags: string[];
  status: string;
  createdAt: string;
}

export default function CreativesClient() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Studio state
  const [activeType, setActiveType] = useState<CreativeType>('feed_1x1');
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [captionEn, setCaptionEn] = useState('');
  const [captionPt, setCaptionPt] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [overlayText, setOverlayText] = useState('');
  const [overlayColor, setOverlayColor] = useState('#FFFFFF');
  const [copied, setCopied] = useState<string | null>(null);

  // Library state
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [activeView, setActiveView] = useState<'studio' | 'library'>('studio');

  useEffect(() => { loadCreatives(); }, []);

  async function loadCreatives() {
    setLoadingLibrary(true);
    try {
      const res = await fetch('/api/marketing/creatives');
      const data = await res.json();
      setCreatives(data.creatives || []);
    } finally {
      setLoadingLibrary(false);
    }
  }

  async function generateImage() {
    if (!prompt.trim()) return;
    setGeneratingImage(true);
    setGeneratedImage(null);
    try {
      const res = await fetch('/api/marketing/creatives/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: activeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedImage(data.imageUrl);
      toast({ title: '🎨 Image generated!' });
    } catch (e: any) {
      toast({ title: 'Image generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingImage(false);
    }
  }

  async function generateCopyFromTopic() {
    if (!topic.trim()) return;
    setGeneratingCopy(true);
    try {
      const res = await fetch('/api/marketing/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'instagram_copy', topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCaptionEn(data.captionEn || '');
      setCaptionPt(data.captionPt || '');
      setHashtags(data.hashtags || []);
      if (data.dallePrompt) setPrompt(data.dallePrompt);
      toast({ title: '✅ Copy generated!' });
    } catch (e: any) {
      toast({ title: 'Copy generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingCopy(false);
    }
  }

  async function saveCreative() {
    if (!generatedImage && !captionEn) {
      toast({ title: 'Nothing to save', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/marketing/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic || 'Untitled creative',
          type: activeType,
          imageUrl: generatedImage,
          captionEn, captionPt,
          hashtags,
          prompt,
          status: 'ready',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: '💾 Creative saved to library!' });
      loadCreatives();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  }

  function downloadImage() {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `clarity-creative-${activeType}-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  }

  function copyCaption(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyHashtags() {
    const text = hashtags.map(h => `#${h}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied('hashtags');
    setTimeout(() => setCopied(null), 2000);
  }

  const cfg = TYPE_CONFIG[activeType];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">AI Creative Studio</h1>
            <p className="text-sm text-muted-foreground">Generate images and copy for Instagram with AI</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'studio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('studio')}
          >
            <Sparkles className="h-4 w-4 mr-1" /> Studio
          </Button>
          <Button
            variant={activeView === 'library' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('library')}
          >
            <ImageIcon className="h-4 w-4 mr-1" /> Library ({creatives.length})
          </Button>
        </div>
      </div>

      {activeView === 'studio' ? (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: Canvas Preview */}
          <div className="space-y-4">
            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TYPE_CONFIG) as CreativeType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    activeType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                >
                  {TYPE_CONFIG[type].icon} {TYPE_CONFIG[type].label}
                </button>
              ))}
            </div>

            {/* Canvas area */}
            <div
              className="relative border-2 border-dashed border-muted rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center mx-auto"
              style={{
                width: `${cfg.width}px`,
                height: `${cfg.height}px`,
                maxWidth: '100%',
              }}
            >
              {generatingImage ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
                  <p className="text-sm">Generating with DALL-E 3...</p>
                  <p className="text-xs text-slate-500">~20 seconds</p>
                </div>
              ) : generatedImage ? (
                <>
                  <img
                    src={generatedImage}
                    alt="Generated creative"
                    className="w-full h-full object-cover"
                  />
                  {/* Text overlay */}
                  {overlayText && (
                    <div className="absolute inset-0 flex items-end p-6">
                      <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3">
                        <p className="font-bold text-lg leading-snug" style={{ color: overlayColor }}>
                          {overlayText}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Logo overlay */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <div className="h-6 w-6 rounded overflow-hidden">
                      <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-white text-xs font-bold">Clarity & Co</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <ImageIcon className="h-12 w-12" />
                  <p className="text-sm">Enter a prompt to generate an image</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {generatedImage && (
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={downloadImage}>
                  <Download className="h-4 w-4 mr-1" /> Download PNG
                </Button>
                <Button variant="outline" size="sm" onClick={generateImage} disabled={generatingImage}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                </Button>
                <Button size="sm" onClick={saveCreative} className="bg-purple-600 text-white hover:bg-purple-700">
                  <Save className="h-4 w-4 mr-1" /> Save to Library
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/marketing/social">
                    <Instagram className="h-4 w-4 mr-1" /> Post to Instagram
                  </Link>
                </Button>
              </div>
            )}

            {/* Caption & Hashtags */}
            {(captionEn || hashtags.length > 0) && (
              <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                <h3 className="font-semibold text-sm">Generated Copy</h3>
                {captionEn && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Caption (EN) 🇬🇧</Label>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => copyCaption(captionEn, 'en')}>
                        {copied === 'en' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <textarea
                      value={captionEn}
                      onChange={e => setCaptionEn(e.target.value)}
                      className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                      rows={3}
                    />
                  </div>
                )}
                {captionPt && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Caption (PT) 🇧🇷</Label>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => copyCaption(captionPt, 'pt')}>
                        {copied === 'pt' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <textarea
                      value={captionPt}
                      onChange={e => setCaptionPt(e.target.value)}
                      className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                      rows={3}
                    />
                  </div>
                )}
                {hashtags.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Hashtags</Label>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={copyHashtags}>
                        {copied === 'hashtags' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hashtags.map(h => (
                        <span key={h} className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                          #{h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="space-y-5">
            {/* Generate Copy with AI */}
            <div className="p-4 rounded-xl border space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" /> Step 1: Generate Copy with AI
              </h3>
              <div>
                <Label className="text-xs text-muted-foreground">Topic / Theme</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. 'HMRC self-assessment deadline'"
                    className="text-sm"
                    onKeyDown={e => e.key === 'Enter' && generateCopyFromTopic()}
                  />
                  <Button
                    onClick={generateCopyFromTopic}
                    disabled={!topic.trim() || generatingCopy}
                    size="sm"
                    className="shrink-0 bg-purple-600 text-white hover:bg-purple-700"
                  >
                    {generatingCopy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Generates captions, hashtags, and DALL-E prompt automatically.</p>
              </div>
            </div>

            {/* Generate Image */}
            <div className="p-4 rounded-xl border space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-pink-500" /> Step 2: Generate Image with DALL-E 3
              </h3>
              <div>
                <Label className="text-xs text-muted-foreground">Image Prompt</Label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the image you want... (auto-filled when generating copy)"
                  rows={4}
                  className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button
                onClick={generateImage}
                disabled={!prompt.trim() || generatingImage}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
              >
                {generatingImage ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating (~20s)...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate Image</>
                )}
              </Button>
            </div>

            {/* Text Overlay */}
            {generatedImage && (
              <div className="p-4 rounded-xl border space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Type className="h-4 w-4" /> Step 3: Add Text Overlay (optional)
                </h3>
                <Input
                  value={overlayText}
                  onChange={e => setOverlayText(e.target.value)}
                  placeholder="Overlay text on image..."
                  className="text-sm"
                />
                <div>
                  <Label className="text-xs text-muted-foreground">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    {['#FFFFFF', '#F59E0B', '#1E293B', '#000000', '#FF6B6B'].map(c => (
                      <button
                        key={c}
                        onClick={() => setOverlayColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${overlayColor === c ? 'scale-110 border-ring' : 'border-border'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={overlayColor}
                      onChange={e => setOverlayColor(e.target.value)}
                      className="w-7 h-7 rounded-full border-2 border-border cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Library View */
        <div>
          {loadingLibrary ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : creatives.length === 0 ? (
            <div className="text-center py-16 border rounded-xl">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No creatives yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Generate and save creatives in the Studio tab.</p>
              <Button onClick={() => setActiveView('studio')}>
                <Sparkles className="h-4 w-4 mr-2" /> Open Studio
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {creatives.map(creative => (
                <div key={creative.id} className="border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group">
                  {creative.imageUrl ? (
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={creative.imageUrl}
                        alt={creative.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-1">{creative.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{creative.type.replace('_', ' ')}</Badge>
                      <Badge variant={creative.status === 'ready' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {creative.status}
                      </Badge>
                    </div>
                    {creative.imageUrl && (
                      <div className="flex gap-1 mt-2">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" asChild>
                          <a href={creative.imageUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" /> Save
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" asChild>
                          <Link href={`/admin/marketing/social?creativeId=${creative.id}`}>
                            <Instagram className="h-3 w-3 mr-1" /> Post
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
