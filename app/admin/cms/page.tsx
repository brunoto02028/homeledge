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
  Sparkles, Mic, MicOff, Save, Loader2, RefreshCw,
  Globe, FileText, HelpCircle, Star, Megaphone, Layout, Settings2,
  ChevronDown, ChevronUp, ExternalLink, Wand2, Check, X, Plus, Trash2,
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
  features: { label: 'Features Grid', icon: Layout, description: 'Feature cards with icons, titles and descriptions' },
  business: { label: 'For Business', icon: Settings2, description: 'Business section — headline, bullet points, entity mockup' },
  howItWorks: { label: 'How It Works', icon: Settings2, description: 'Step-by-step guide (3 steps)' },
  testimonials: { label: 'Testimonials', icon: Star, description: 'Customer quotes — name, role, avatar initials and testimonial text' },
  accountants: { label: 'For Accountants', icon: Star, description: 'Accountant section — headline, bullet points, dashboard mockup' },
  pricing: { label: 'Pricing Plans', icon: FileText, description: 'Pricing tiers with features and CTAs' },
  faq: { label: 'FAQ', icon: HelpCircle, description: 'Frequently asked questions and answers' },
  cta: { label: 'Final CTA', icon: Megaphone, description: 'Final conversion section with headline and button' },
  footer: { label: 'Footer', icon: Layout, description: 'Footer columns, links, copyright' },
};

// Human-readable labels for known content keys
const FIELD_LABELS: Record<string, string> = {
  headline: 'Headline',
  subheadline: 'Sub-headline',
  ctaPrimary: 'Primary Button Text',
  ctaSecondary: 'Secondary Button Text',
  buttonText: 'Button Text',
  description: 'Description',
  descriptionDetail: 'Detailed Description',
  tagline: 'Tagline',
  copyright: 'Copyright',
  pageTitle: 'Page Title',
  metaDescription: 'Meta Description',
  ogTitle: 'Open Graph Title',
  ogDescription: 'Open Graph Description',
  keywords: 'Keywords (comma-separated)',
  complianceBanner: 'Compliance Banner',
  noAccountBanner: 'No Account Banner',
  question: 'Question',
  answer: 'Answer',
  name: 'Name',
  role: 'Role',
  quote: 'Quote',
  title: 'Title',
  icon: 'Icon Name',
  step: 'Step Number',
  price: 'Price',
  period: 'Period',
  cta: 'CTA Button',
  per: 'Per',
  checks: 'Number of Checks',
  validityDays: 'Validity (days)',
  badge: 'Badge Text',
  label: 'Label',
  href: 'Link URL',
  law: 'Law Reference',
  penalty: 'Penalty',
  people: 'Target Audience',
  rating: 'Rating',
  highlighted: 'Highlighted',
  features: 'Features',
  id: 'ID',
};

// Check if a value is a simple string/number/boolean (editable as text)
function isSimpleValue(val: any): boolean {
  return typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
}

// Check if an array contains simple strings (like features list or keywords)
function isStringArray(val: any): boolean {
  return Array.isArray(val) && val.length > 0 && val.every((v: any) => typeof v === 'string');
}

// Check if an array contains objects (like items, steps, plans)
function isObjectArray(val: any): boolean {
  return Array.isArray(val) && val.length > 0 && val.every((v: any) => typeof v === 'object' && v !== null && !Array.isArray(v));
}

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
  const [editData, setEditData] = useState<Record<string, { title: string; subtitle: string; content: any; isPublished: boolean }>>({});
  const [aiPreview, setAiPreview] = useState<{ sectionKey: string; generated: any } | null>(null);

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
      const ed: Record<string, any> = {};
      for (const key of Object.keys(SECTION_META)) {
        const existing = data.find((s: Section) => s.sectionKey === key);
        ed[key] = {
          title: existing?.title || '',
          subtitle: existing?.subtitle || '',
          content: existing?.content || {},
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

  // Update a content field value
  const updateContentField = (sectionKey: string, path: (string | number)[], value: any) => {
    setEditData(prev => {
      const section = { ...prev[sectionKey] };
      const content = JSON.parse(JSON.stringify(section.content || {}));
      let obj = content;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return { ...prev, [sectionKey]: { ...section, content } };
    });
  };

  // Add item to an array
  const addArrayItem = (sectionKey: string, path: (string | number)[], template: any) => {
    setEditData(prev => {
      const section = { ...prev[sectionKey] };
      const content = JSON.parse(JSON.stringify(section.content || {}));
      let obj = content;
      for (const p of path) obj = obj[p];
      if (Array.isArray(obj)) obj.push(template);
      return { ...prev, [sectionKey]: { ...section, content } };
    });
  };

  // Remove item from an array
  const removeArrayItem = (sectionKey: string, path: (string | number)[], index: number) => {
    setEditData(prev => {
      const section = { ...prev[sectionKey] };
      const content = JSON.parse(JSON.stringify(section.content || {}));
      let obj = content;
      for (const p of path) obj = obj[p];
      if (Array.isArray(obj)) obj.splice(index, 1);
      return { ...prev, [sectionKey]: { ...section, content } };
    });
  };

  // Save section
  const handleSave = async (sectionKey: string) => {
    const data = editData[sectionKey];
    if (!data) return;
    setSaving(sectionKey);

    try {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey,
          title: data.title,
          subtitle: data.subtitle,
          content: data.content,
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

  // AI Generate — now shows preview for approval
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
          currentContent: currentContent || null,
        }),
      });

      const data = await res.json();
      if (data.generated) {
        setAiPreview({ sectionKey, generated: data.generated });
        setAiPrompt('');
        toast({ title: 'AI Content Ready', description: 'Review the generated text below. Click "Apply" to use it or "Discard" to cancel.' });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message || 'Could not generate content', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  // Accept AI-generated content
  const acceptAiContent = () => {
    if (!aiPreview) return;
    setEditData(prev => ({
      ...prev,
      [aiPreview.sectionKey]: {
        ...prev[aiPreview.sectionKey],
        content: aiPreview.generated,
      },
    }));
    toast({ title: 'Applied', description: 'AI content applied. Review the fields and click Save to publish.' });
    setAiPreview(null);
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

  // Render friendly text fields for content object
  const renderContentFields = (sectionKey: string, content: any, parentPath: (string | number)[] = []) => {
    if (!content || typeof content !== 'object') return null;

    const entries = Object.entries(content);

    return entries.map(([fieldKey, value]) => {
      const currentPath = [...parentPath, fieldKey];
      const label = FIELD_LABELS[fieldKey] || fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

      // Simple string value — render as Input or Textarea
      if (typeof value === 'string') {
        const isLong = value.length > 100;
        return (
          <div key={currentPath.join('.')} className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
            {isLong ? (
              <Textarea
                value={value}
                onChange={(e) => updateContentField(sectionKey, currentPath, e.target.value)}
                rows={3}
                className="text-sm"
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => updateContentField(sectionKey, currentPath, e.target.value)}
                className="text-sm"
              />
            )}
          </div>
        );
      }

      // Number value
      if (typeof value === 'number') {
        return (
          <div key={currentPath.join('.')} className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => updateContentField(sectionKey, currentPath, Number(e.target.value))}
              className="text-sm w-32"
            />
          </div>
        );
      }

      // Boolean value
      if (typeof value === 'boolean') {
        return (
          <div key={currentPath.join('.')} className="flex items-center gap-2">
            <Switch
              checked={value}
              onCheckedChange={(v) => updateContentField(sectionKey, currentPath, v)}
            />
            <Label className="text-sm text-muted-foreground">{label}</Label>
          </div>
        );
      }

      // Array of strings (features list, keywords, etc.)
      if (isStringArray(value)) {
        return (
          <div key={currentPath.join('.')} className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
            <div className="space-y-1.5">
              {(value as string[]).map((item: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={item}
                    onChange={(e) => updateContentField(sectionKey, [...currentPath, idx], e.target.value)}
                    className="text-sm flex-1"
                  />
                  <button
                    onClick={() => removeArrayItem(sectionKey, currentPath, idx)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(sectionKey, currentPath, '')}
                className="text-xs h-7"
                type="button"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Item
              </Button>
            </div>
          </div>
        );
      }

      // Array of objects (items, steps, plans, etc.)
      if (isObjectArray(value)) {
        return (
          <div key={currentPath.join('.')} className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">{label} ({(value as any[]).length} items)</Label>
            <div className="space-y-3">
              {(value as any[]).map((item: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {item.title || item.name || item.question || `Item ${idx + 1}`}
                    </span>
                    <button
                      onClick={() => removeArrayItem(sectionKey, currentPath, idx)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(item).map(([itemKey, itemVal]) => {
                      const itemLabel = FIELD_LABELS[itemKey] || itemKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                      const itemPath = [...currentPath, idx, itemKey];

                      if (typeof itemVal === 'string') {
                        const isLongText = itemVal.length > 80;
                        return (
                          <div key={itemKey} className={`space-y-1 ${isLongText ? 'md:col-span-2' : ''}`}>
                            <Label className="text-xs text-muted-foreground">{itemLabel}</Label>
                            {isLongText ? (
                              <Textarea
                                value={itemVal}
                                onChange={(e) => updateContentField(sectionKey, itemPath, e.target.value)}
                                rows={2}
                                className="text-xs"
                              />
                            ) : (
                              <Input
                                value={itemVal}
                                onChange={(e) => updateContentField(sectionKey, itemPath, e.target.value)}
                                className="text-xs h-8"
                              />
                            )}
                          </div>
                        );
                      }

                      if (typeof itemVal === 'number') {
                        return (
                          <div key={itemKey} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{itemLabel}</Label>
                            <Input
                              type="number"
                              value={itemVal}
                              onChange={(e) => updateContentField(sectionKey, itemPath, Number(e.target.value))}
                              className="text-xs h-8 w-24"
                            />
                          </div>
                        );
                      }

                      if (typeof itemVal === 'boolean') {
                        return (
                          <div key={itemKey} className="flex items-center gap-2 py-1">
                            <Switch
                              checked={itemVal}
                              onCheckedChange={(v) => updateContentField(sectionKey, itemPath, v)}
                            />
                            <Label className="text-xs text-muted-foreground">{itemLabel}</Label>
                          </div>
                        );
                      }

                      // Nested string array inside item (e.g. plan features)
                      if (isStringArray(itemVal)) {
                        return (
                          <div key={itemKey} className="md:col-span-2 space-y-1">
                            <Label className="text-xs text-muted-foreground">{itemLabel}</Label>
                            <Textarea
                              value={(itemVal as string[]).join('\n')}
                              onChange={(e) => updateContentField(sectionKey, itemPath, e.target.value.split('\n'))}
                              rows={Math.min((itemVal as string[]).length + 1, 6)}
                              className="text-xs"
                              placeholder="One item per line"
                            />
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const template = { ...((value as any[])[0] || {}) };
                  for (const k of Object.keys(template)) {
                    if (typeof template[k] === 'string') template[k] = '';
                    else if (typeof template[k] === 'number') template[k] = 0;
                    else if (typeof template[k] === 'boolean') template[k] = false;
                    else if (Array.isArray(template[k])) template[k] = [];
                  }
                  addArrayItem(sectionKey, currentPath, template);
                }}
                className="text-xs h-7"
                type="button"
              >
                <Plus className="h-3 w-3 mr-1" /> Add {fieldKey === 'items' ? 'Item' : fieldKey === 'steps' ? 'Step' : fieldKey === 'plans' ? 'Plan' : 'Entry'}
              </Button>
            </div>
          </div>
        );
      }

      // Nested object (like mockup, phoneMockup, etc.)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <div key={currentPath.join('.')} className="space-y-2 rounded-lg border border-border/30 p-3">
            <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
            <div className="space-y-3 pl-2">
              {renderContentFields(sectionKey, value, currentPath)}
            </div>
          </div>
        );
      }

      return null;
    });
  };

  // Render AI preview as readable text
  const renderAiPreview = (content: any, indent: number = 0) => {
    if (!content || typeof content !== 'object') return null;
    const pad = 'pl-' + (indent * 3);

    return Object.entries(content).map(([key, value]) => {
      const label = FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return (
          <div key={key} className={`${pad} py-1`}>
            <span className="text-xs font-semibold text-purple-400">{label}:</span>
            <span className="text-sm text-foreground ml-2">{String(value)}</span>
          </div>
        );
      }

      if (isStringArray(value)) {
        return (
          <div key={key} className={`${pad} py-1`}>
            <span className="text-xs font-semibold text-purple-400">{label}:</span>
            <ul className="ml-4 mt-0.5">
              {(value as string[]).map((item: string, i: number) => (
                <li key={i} className="text-sm text-foreground">• {item}</li>
              ))}
            </ul>
          </div>
        );
      }

      if (isObjectArray(value)) {
        return (
          <div key={key} className={`${pad} py-1`}>
            <span className="text-xs font-semibold text-purple-400">{label} ({(value as any[]).length} items):</span>
            {(value as any[]).map((item: any, i: number) => (
              <div key={i} className="ml-3 mt-1 p-2 rounded border border-purple-500/20 bg-purple-500/5">
                <span className="text-xs font-medium text-purple-300">{item.title || item.name || item.question || `Item ${i + 1}`}</span>
                {renderAiPreview(item, indent + 1)}
              </div>
            ))}
          </div>
        );
      }

      if (typeof value === 'object' && value !== null) {
        return (
          <div key={key} className={`${pad} py-1`}>
            <span className="text-xs font-semibold text-purple-400">{label}:</span>
            <div className="ml-2">{renderAiPreview(value, indent + 1)}</div>
          </div>
        );
      }

      return null;
    });
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

                  {/* Content Fields — rendered as friendly text inputs */}
                  {data.content && typeof data.content === 'object' && Object.keys(data.content).length > 0 && (
                    <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-4">
                      <Label className="text-sm font-semibold">Content Fields</Label>
                      <div className="space-y-4">
                        {renderContentFields(key, data.content)}
                      </div>
                    </div>
                  )}

                  {/* AI Generation with Preview/Approval */}
                  <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-semibold">AI Content Generator</span>
                    </div>

                    {/* AI Preview — shown when AI generates content, waiting for approval */}
                    {aiPreview && aiPreview.sectionKey === key && (
                      <div className="rounded-lg border-2 border-purple-400/40 bg-purple-500/10 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-300">AI Generated Preview — Review before applying</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-1">
                          {renderAiPreview(aiPreview.generated)}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-purple-500/20">
                          <Button
                            size="sm"
                            onClick={acceptAiContent}
                            className="bg-green-600 hover:bg-green-500 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" /> Apply Content
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAiPreview(null)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4 mr-1" /> Discard
                          </Button>
                        </div>
                      </div>
                    )}

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
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-sm"
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
