'use client';

import { useState } from 'react';
import { Sparkles, Linkedin, Instagram, Twitter, Mail, FileText, BarChart2, Megaphone, Copy, Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CONTENT_TYPES = [
  { value: 'social_post', label: 'Social Post', icon: Twitter, desc: 'LinkedIn, Instagram, X/Twitter posts' },
  { value: 'blog_article', label: 'Blog Article', icon: FileText, desc: 'SEO-optimised long-form content' },
  { value: 'email_campaign', label: 'Email Campaign', icon: Mail, desc: 'Multi-email nurture sequences' },
  { value: 'marketing_copy', label: 'Marketing Copy', icon: Megaphone, desc: 'Landing pages, ads, CTAs' },
  { value: 'campaign_insight', label: 'Campaign Insights', icon: BarChart2, desc: 'Analyse campaign performance' },
];

const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'X / Twitter', icon: Twitter },
  { value: 'facebook', label: 'Facebook', icon: Megaphone },
];

const TONES = ['professional', 'friendly', 'urgent', 'inspirational', 'educational', 'witty'];

const AUDIENCE_OPTIONS = [
  'UK households managing finances',
  'Small business owners',
  'Freelancers & sole traders',
  'Immigrants navigating UK system',
  'First-time homebuyers',
  'Self-employed professionals',
];

export default function MarketingAIClient() {
  const [type, setType] = useState('social_post');
  const [platform, setPlatform] = useState('linkedin');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('UK households managing finances');
  const [keywords, setKeywords] = useState('');
  const [context, setContext] = useState('');
  const [length, setLength] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [model, setModel] = useState('');
  const [history, setHistory] = useState<{ type: string; topic: string; content: string; model: string }[]>([]);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, platform, topic, tone, audience, keywords, context, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data.content);
      setModel(data.model || data.provider || '');
      setHistory(h => [{ type, topic, content: data.content, model: data.model || data.provider }, ...h.slice(0, 9)]);
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedType = CONTENT_TYPES.find(t => t.value === type);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
          <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Marketing Intelligence</h1>
          <p className="text-sm text-muted-foreground">Powered by Claude AI — generate social posts, blog articles, email campaigns and more</p>
        </div>
        {model && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {model}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Content Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Content Type</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              {CONTENT_TYPES.map(ct => {
                const Icon = ct.icon;
                return (
                  <button
                    key={ct.value}
                    onClick={() => setType(ct.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      type === ct.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${type === ct.value ? 'text-violet-600' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{ct.label}</p>
                      <p className="text-xs text-muted-foreground">{ct.desc}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Platform (only for social) */}
          {type === 'social_post' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Platform</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${
                        platform === p.value
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-600'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {p.label}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle: Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Content Details</CardTitle>
              <CardDescription>Tell Claude what to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {type === 'campaign_insight' ? 'Data / Context to Analyse' : 'Topic / Subject *'}
                </label>
                <Textarea
                  placeholder={
                    type === 'social_post' ? 'e.g. "How Clarity & Co saved our household £2,000/year"' :
                    type === 'blog_article' ? 'e.g. "How to file your HMRC Self Assessment for the first time"' :
                    type === 'email_campaign' ? 'e.g. "Onboarding sequence for new users who uploaded their first statement"' :
                    type === 'campaign_insight' ? 'Paste your campaign metrics, CTR, open rates, conversions...' :
                    'e.g. "Hero section copy for clarityco.co.uk homepage"'
                  }
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tone</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target Audience</label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {type === 'blog_article' ? 'SEO Keywords' : 'Key Points / Keywords'}
                </label>
                <Input
                  placeholder="e.g. HMRC, Self Assessment, tax return, savings"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                />
              </div>

              {(type === 'blog_article' || type === 'email_campaign') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {type === 'blog_article' ? 'Target Length' : 'Number of Emails'}
                  </label>
                  <Input
                    placeholder={type === 'blog_article' ? 'e.g. 1000-1500 words' : 'e.g. 3 emails (welcome, value, CTA)'}
                    value={length}
                    onChange={e => setLength(e.target.value)}
                  />
                </div>
              )}

              {type !== 'campaign_insight' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Context</label>
                  <Textarea
                    placeholder="Any extra details, examples, or specific requests..."
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <Button
                onClick={generate}
                disabled={loading || !topic.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate with Claude</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Result */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Generated Content</CardTitle>
                <CardDescription>{selectedType?.label}</CardDescription>
              </div>
              {result && (
                <Button size="sm" variant="ghost" onClick={copy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  <p className="text-sm">Claude is writing...</p>
                </div>
              )}
              {!loading && !result && (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                  <Sparkles className="h-8 w-8 text-violet-300" />
                  <p className="text-sm">Your generated content will appear here</p>
                </div>
              )}
              {!loading && result && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-[600px] overflow-y-auto bg-muted/30 rounded-lg p-4 font-mono">
                  {result}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Generations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setResult(h.content)}
              >
                <Badge variant="outline" className="text-xs shrink-0">{h.type.replace('_', ' ')}</Badge>
                <p className="text-sm text-muted-foreground truncate flex-1">{h.topic}</p>
                <span className="text-xs text-muted-foreground shrink-0">{h.model}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
