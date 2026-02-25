'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  Sparkles, Mic, MicOff, Save, Eye, EyeOff, Loader2, RefreshCw,
  Globe, FileText, HelpCircle, Star, Megaphone, Layout, Settings2,
  ChevronDown, ChevronUp, ExternalLink, Wand2,
} from 'lucide-react';

interface Section {
  id: string;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  imageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
}

const SECTION_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  meta: { label: 'SEO / Meta Tags', icon: Globe, description: 'Page title, meta description, Open Graph tags, and keywords' },
  hero: { label: 'Hero Section', icon: Megaphone, description: 'Headline, sub-headline, and CTA buttons' },
  stats: { label: 'Stats Bar', icon: Layout, description: 'Key numbers shown below the hero (e.g. 16+ Modules, AI, HMRC, 256-bit)' },
  features: { label: 'Features Grid', icon: Layout, description: '16 feature cards with icons, titles and descriptions' },
  business: { label: 'For Business', icon: Settings2, description: 'Business section — headline, bullet points, entity mockup' },
  howItWorks: { label: 'How It Works', icon: Settings2, description: 'Step-by-step guide (3 steps)' },
  testimonials: { label: 'Testimonials', icon: Star, description: 'Customer quotes — name, role, avatar initials and testimonial text' },
  accountants: { label: 'For Accountants', icon: Star, description: 'Accountant section — headline, bullet points, dashboard mockup' },
  pricing: { label: 'Pricing Plans', icon: FileText, description: 'Pricing tiers with features and CTAs' },
  faq: { label: 'FAQ', icon: HelpCircle, description: 'Frequently asked questions and answers' },
  cta: { label: 'Final CTA', icon: Megaphone, description: 'Final conversion section with headline and button' },
  footer: { label: 'Footer', icon: Layout, description: 'Footer columns, links, copyright' },
};

export default function AdminCmsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [editData, setEditData] = useState<Record<string, { title: string; subtitle: string; content: string; isPublished: boolean }>>({});

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') router.replace('/dashboard');
  }, [status, session, router]);

  // Fetch sections
  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch('/api/cms?all=true');
      const data = await res.json();
      setSections(data);
      // Initialize edit data — include ALL section keys, even those not yet created
      const ed: Record<string, any> = {};
      for (const key of Object.keys(SECTION_META)) {
        const existing = data.find((s: Section) => s.sectionKey === key);
        ed[key] = {
          title: existing?.title || '',
          subtitle: existing?.subtitle || '',
          content: JSON.stringify(existing?.content || {}, null, 2),
          isPublished: existing?.isPublished ?? true,
        };
      }
      setEditData(ed);
    } catch {
      toast({ title: 'Error', description: 'Failed to load CMS sections', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  // Save section
  const handleSave = async (sectionKey: string) => {
    const data = editData[sectionKey];
    if (!data) return;
    setSaving(sectionKey);

    let parsedContent;
    try {
      parsedContent = JSON.parse(data.content);
    } catch {
      toast({ title: 'Invalid JSON', description: 'The content field must be valid JSON.', variant: 'destructive' });
      setSaving(null);
      return;
    }

    try {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey,
          title: data.title,
          subtitle: data.subtitle,
          content: parsedContent,
          isPublished: data.isPublished,
        }),
      });

      if (res.ok) {
        toast({ title: 'Saved', description: `"${SECTION_META[sectionKey]?.label || sectionKey}" updated successfully.` });
        fetchSections();
      } else {
        throw new Error('Failed');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save section', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  // AI Generate
  const handleGenerate = async (sectionKey: string) => {
    if (!aiPrompt.trim()) {
      toast({ title: 'Enter a prompt', description: 'Describe what content you want the AI to generate.', variant: 'destructive' });
      return;
    }
    setGenerating(sectionKey);

    try {
      const currentContent = editData[sectionKey]?.content;
      const res = await fetch('/api/cms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey,
          prompt: aiPrompt,
          currentContent: currentContent ? JSON.parse(currentContent) : null,
        }),
      });

      const data = await res.json();
      if (data.generated) {
        setEditData(prev => ({
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            content: JSON.stringify(data.generated, null, 2),
          },
        }));
        setAiPrompt('');
        toast({ title: 'AI Content Generated', description: 'Review the generated content and click Save to publish.' });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message || 'Could not generate content', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  // Voice Input (Web Speech API)
  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Not Supported', description: 'Voice input is not supported in this browser.', variant: 'destructive' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAiPrompt(prev => {
        // Replace interim with final
        const base = prev.replace(/\s*\[listening\.\.\.\]$/, '');
        return base + (base ? ' ' : '') + transcript;
      });
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (loading || status === 'loading') return <LoadingSpinner />;

  const isAdmin = (session?.user as any)?.role === 'admin';
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Landing Page CMS</h1>
          <p className="text-muted-foreground mt-1">Edit your public website content. Use AI to generate or refine copy.</p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" /> Preview Site
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={fetchSections}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-3">
        {Object.entries(SECTION_META).map(([key, meta]) => {
          const section = sections.find(s => s.sectionKey === key);
          const isExpanded = expandedSection === key;
          const Icon = meta.icon;
          const data = editData[key];

          return (
            <Card key={key} className={isExpanded ? 'ring-2 ring-primary/20' : ''}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : key)}
                className="w-full"
              >
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">{meta.label}</CardTitle>
                      <CardDescription className="text-xs">{meta.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {section ? (
                      <Badge variant={section.isPublished ? 'default' : 'secondary'}>
                        {section.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Created</Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </button>

              {isExpanded && data && (
                <CardContent className="pt-0 space-y-5">
                  {/* Published Toggle */}
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={data.isPublished}
                      onCheckedChange={(v) => setEditData(prev => ({
                        ...prev,
                        [key]: { ...prev[key], isPublished: v },
                      }))}
                    />
                    <Label className="text-sm">Published</Label>
                  </div>

                  {/* Title / Subtitle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={data.title}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          [key]: { ...prev[key], title: e.target.value },
                        }))}
                        placeholder="Section title..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input
                        value={data.subtitle}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          [key]: { ...prev[key], subtitle: e.target.value },
                        }))}
                        placeholder="Section subtitle..."
                      />
                    </div>
                  </div>

                  {/* Content JSON */}
                  <div className="space-y-2">
                    <Label>Content (JSON)</Label>
                    <Textarea
                      value={data.content}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        [key]: { ...prev[key], content: e.target.value },
                      }))}
                      rows={12}
                      className="font-mono text-xs"
                      placeholder="{}"
                    />
                  </div>

                  {/* AI Generation */}
                  <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-semibold">AI Content Generator</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Describe what you want... e.g. 'Write a compelling hero section for a UK finance app targeting freelancers'"
                          rows={2}
                          className="text-sm pr-12"
                        />
                        <button
                          onClick={toggleVoice}
                          className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${
                            listening
                              ? 'bg-red-100 text-red-600 animate-pulse'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                          }`}
                          title={listening ? 'Stop listening' : 'Voice input'}
                        >
                          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerate(key)}
                      disabled={generating === key || !aiPrompt.trim()}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {generating === key ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Wand2 className="h-4 w-4 mr-2" /> Generate with AI</>
                      )}
                    </Button>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={() => handleSave(key)} disabled={saving === key}>
                      {saving === key ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="h-4 w-4 mr-2" /> Save Section</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
