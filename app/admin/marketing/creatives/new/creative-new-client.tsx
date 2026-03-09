'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wand2, Loader2, Download, Copy, CheckCircle, RefreshCw, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  initialCaption: string;
  initialPrompt: string;
  initialHashtags: string;
  initialTopic: string;
}

const FORMAT_OPTIONS = [
  { id: 'blog_cover', label: 'Blog Cover', ratio: '16:9', desc: 'Wide banner for articles' },
  { id: 'feed_1x1',  label: 'Instagram Feed', ratio: '1:1', desc: 'Square post' },
  { id: 'story_9x16', label: 'Story / Reel', ratio: '9:16', desc: 'Vertical full-screen' },
  { id: 'banner',    label: 'Banner', ratio: '16:9', desc: 'Wide promotional banner' },
];

export default function CreativeNewClient({ initialCaption, initialPrompt, initialHashtags, initialTopic }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState(
    initialPrompt ||
    (initialTopic ? `Professional editorial illustration for a UK financial article about: ${initialTopic}. Modern, clean design.` : '')
  );
  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags);
  const [format, setFormat] = useState('feed_1x1');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!prompt.trim()) {
      toast({ title: 'Descreve a imagem primeiro', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    setGeneratedUrl('');
    try {
      const res = await fetch('/api/marketing/creatives/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), type: format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGeneratedUrl(data.url || data.imageUrl || '');
      toast({ title: '🎨 Imagem gerada!' });
    } catch (e: any) {
      toast({ title: 'Erro na geração', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  async function saveCreative() {
    if (!generatedUrl) return;
    try {
      await fetch('/api/marketing/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: format,
          prompt,
          imageUrl: generatedUrl,
          caption,
          hashtags: hashtags.split(',').map(h => h.trim()).filter(Boolean),
        }),
      });
      toast({ title: '💾 Guardado nos Criativos!' });
      router.push('/admin/marketing/creatives');
    } catch {
      toast({ title: 'Erro ao guardar', variant: 'destructive' });
    }
  }

  function copyCaption() {
    navigator.clipboard.writeText(`${caption}\n\n${hashtags.split(',').map(h => `#${h.trim()}`).join(' ')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedFormat = FORMAT_OPTIONS.find(f => f.id === format)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center gap-3 bg-card">
        <Link href="/admin/marketing/creatives">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-sm font-semibold">Gerar Arte com IA</h1>
          <p className="text-xs text-muted-foreground">Google Imagen 4.0 — sem limites de uso</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 grid lg:grid-cols-[1fr_420px] gap-6">
        {/* LEFT — Controls */}
        <div className="space-y-5">
          {/* Format selector */}
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Formato</Label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    format === f.id
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`rounded border border-current shrink-0 ${
                      f.id === 'story_9x16' ? 'h-8 w-5' : f.id === 'feed_1x1' ? 'h-6 w-6' : 'h-4 w-7'
                    }`} />
                    <div>
                      <p className="text-xs font-medium">{f.label}</p>
                      <p className="text-xs opacity-60">{f.ratio} · {f.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
              Descrição da Imagem (Prompt)
            </Label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={5}
              placeholder="Ex: Professional UK financial advisor working at a modern desk, amber and dark slate colours, no text in image, editorial style..."
              className="w-full text-sm border rounded-xl px-3 py-2.5 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quanto mais detalhado, melhor o resultado. A IA adiciona automaticamente o estilo da marca.
            </p>
          </div>

          {/* Caption */}
          {caption && (
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                Caption Instagram
              </Label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={3}
                className="w-full text-sm border rounded-xl px-3 py-2.5 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {/* Hashtags */}
          {hashtags && (
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                Hashtags (separadas por vírgula)
              </Label>
              <Input
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando com Imagen 4.0...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Gerar Imagem com IA
              </>
            )}
          </Button>
        </div>

        {/* RIGHT — Preview */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase text-muted-foreground block">Preview</Label>

          {/* Image preview area */}
          <div className={`relative rounded-2xl overflow-hidden border bg-muted/30 flex items-center justify-center ${
            selectedFormat.id === 'story_9x16' ? 'aspect-[9/16]' :
            selectedFormat.id === 'feed_1x1' ? 'aspect-square' : 'aspect-video'
          }`}>
            {generating ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="text-xs text-center px-4">
                  Gerando imagem com<br />Google Imagen 4.0...
                </p>
                <p className="text-xs text-muted-foreground/60">Pode demorar 15–30 segundos</p>
              </div>
            ) : generatedUrl ? (
              <img
                src={generatedUrl}
                alt="Generated creative"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-8 text-center">
                <ImageIcon className="h-10 w-10 opacity-20" />
                <p className="text-xs">A imagem gerada aparecerá aqui</p>
              </div>
            )}
          </div>

          {/* Actions after generation */}
          {generatedUrl && !generating && (
            <div className="space-y-2">
              <Button onClick={generate} variant="outline" className="w-full h-9 text-sm">
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Gerar outra versão
              </Button>
              <Button onClick={saveCreative} className="w-full h-9 text-sm bg-primary">
                💾 Guardar nos Criativos
              </Button>
              {caption && (
                <Button onClick={copyCaption} variant="outline" className="w-full h-9 text-sm">
                  {copied ? <CheckCircle className="h-3.5 w-3.5 mr-2 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-2" />}
                  {copied ? 'Copiado!' : 'Copiar Caption + Hashtags'}
                </Button>
              )}
              <a
                href={generatedUrl}
                download="clarity-creative.jpg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full h-9 text-sm">
                  <Download className="h-3.5 w-3.5 mr-2" /> Descarregar imagem
                </Button>
              </a>
            </div>
          )}

          {/* Instagram preview mockup */}
          {generatedUrl && caption && (
            <div className="border rounded-xl overflow-hidden bg-card mt-4">
              <div className="flex items-center gap-2 px-3 py-2 border-b">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white">C</div>
                <span className="text-xs font-medium">clarityco.uk</span>
              </div>
              <img src={generatedUrl} alt="IG preview" className="w-full aspect-square object-cover" />
              <div className="px-3 py-2">
                <p className="text-xs leading-relaxed line-clamp-3">{caption}</p>
                <p className="text-xs text-blue-500 mt-1 line-clamp-1">
                  {hashtags.split(',').map(h => `#${h.trim()}`).join(' ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
