'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Plus, Send, Clock, CheckCircle, Loader2,
  Users, BarChart2, Sparkles, Trash2, Edit, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  segment: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  type: string;
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'text-green-600 bg-green-500/10 border-green-500/20',
  scheduled: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  draft: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  sending: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  failed: 'text-red-600 bg-red-500/10 border-red-500/20',
};

const SEGMENTS = [
  { value: 'all', label: 'All Leads' },
  { value: 'hot', label: '🔥 Hot Leads' },
  { value: 'warm', label: '🌡️ Warm Leads' },
  { value: 'cold', label: '❄️ Cold Leads' },
];

export default function CampaignsClient() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [segment, setSegment] = useState('all');
  const [templateId, setTemplateId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [aiTopic, setAiTopic] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [campsRes, tmplRes] = await Promise.all([
        fetch('/api/marketing/campaigns'),
        fetch('/api/marketing/email-templates'),
      ]);
      const [campsData, tmplData] = await Promise.all([campsRes.json(), tmplRes.json()]);
      setCampaigns(Array.isArray(campsData) ? campsData : campsData.campaigns || []);
      setTemplates(Array.isArray(tmplData) ? tmplData : []);
    } finally {
      setLoading(false);
    }
  }

  async function generateWithAI() {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/marketing/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email_campaign', topic: aiTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubject(data.subjectEn || '');
      setBodyHtml(data.bodyHtmlEn || '');
      if (!name) setName(data.subjectEn || aiTopic);
      toast({ title: '✅ Campaign generated with AI!' });
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(send = false) {
    if (!name || !subject || !bodyHtml) {
      toast({ title: 'Name, subject and body are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, subject, bodyHtml, segment,
          templateId: templateId || null,
          scheduledAt: scheduledAt || null,
          status: send ? 'sending' : scheduledAt ? 'scheduled' : 'draft',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: send ? '📧 Campaign sent!' : scheduledAt ? '📅 Scheduled!' : '💾 Saved as draft' });
      setShowForm(false);
      resetForm();
      loadAll();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setName(''); setSubject(''); setBodyHtml('');
    setSegment('all'); setTemplateId(''); setScheduledAt(''); setAiTopic('');
  }

  function loadTemplate(id: string) {
    const tmpl = templates.find(t => t.id === id);
    if (tmpl) {
      setTemplateId(id);
      setSubject(tmpl.subject);
      if (!name) setName(tmpl.name);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Email Campaigns</h1>
            <p className="text-sm text-muted-foreground">{campaigns.length} campaigns total</p>
          </div>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="p-6 rounded-xl border bg-card space-y-5">
          <h3 className="font-semibold">New Campaign</h3>

          {/* AI Generate */}
          <div className="p-4 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Generate with AI</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                placeholder="Email topic... e.g. 'HMRC self-assessment deadline reminder'"
                onKeyDown={e => e.key === 'Enter' && generateWithAI()}
              />
              <Button onClick={generateWithAI} disabled={!aiTopic || generating} className="bg-purple-600 text-white hover:bg-purple-700 shrink-0">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Campaign Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. April Newsletter" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Segment</Label>
              <select value={segment} onChange={e => setSegment(e.target.value)} className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background">
                {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm">Subject Line</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." className="mt-1" />
            </div>
          </div>

          {templates.length > 0 && (
            <div>
              <Label className="text-sm">Use Template (optional)</Label>
              <select value={templateId} onChange={e => loadTemplate(e.target.value)} className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background">
                <option value="">— Select template —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <Label className="text-sm">Email Body (HTML)</Label>
            <textarea
              value={bodyHtml}
              onChange={e => setBodyHtml(e.target.value)}
              placeholder="<p>Hello {{name}},</p>..."
              rows={10}
              className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <Label className="text-sm">Schedule (optional)</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="mt-1 max-w-xs" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
              {scheduledAt ? 'Schedule' : 'Save Draft'}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving || !!scheduledAt} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Send Now
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="ml-auto">Cancel</Button>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 && !showForm ? (
        <div className="text-center py-16 border rounded-xl">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first email campaign using the AI assistant.</p>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Segment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Stats</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(camp => (
                <tr key={camp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{camp.name}</p>
                    <p className="text-xs text-muted-foreground">{camp.subject}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[camp.status] || STATUS_COLORS.draft}`}>
                      {camp.status === 'sent' && <CheckCircle className="h-3 w-3" />}
                      {camp.status === 'scheduled' && <Clock className="h-3 w-3" />}
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground capitalize">{camp.segment}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {camp.totalSent > 0 ? (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {camp.totalSent}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {camp.totalSent > 0 ? Math.round((camp.totalOpened / camp.totalSent) * 100) : 0}%</span>
                        <span className="flex items-center gap-1"><BarChart2 className="h-3 w-3" /> {camp.totalSent > 0 ? Math.round((camp.totalClicked / camp.totalSent) * 100) : 0}%</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {camp.sentAt
                        ? new Date(camp.sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                        : camp.scheduledAt
                          ? `Scheduled ${new Date(camp.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                          : new Date(camp.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
