'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Megaphone, Loader2, ToggleLeft, ToggleRight,
  Trash2, Edit, Clock, MousePointer, Scroll,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Popup {
  id: string;
  name: string;
  type: string;
  triggerValue: number;
  titleEn: string;
  bodyEn: string;
  ctaEn: string;
  isActive: boolean;
  showOnPaths: string[];
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; desc: string }> = {
  exit_intent: { label: 'Exit Intent', icon: MousePointer, desc: 'Shows when cursor leaves viewport' },
  scroll: { label: 'Scroll', icon: Scroll, desc: 'Shows after % page scrolled' },
  time: { label: 'Time', icon: Clock, desc: 'Shows after N seconds on page' },
};

export default function PopupsClient() {
  const { toast } = useToast();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('exit_intent');
  const [triggerValue, setTriggerValue] = useState(30);
  const [titleEn, setTitleEn] = useState('');
  const [titlePt, setTitlePt] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyPt, setBodyPt] = useState('');
  const [ctaEn, setCtaEn] = useState('Get Free Guide');
  const [ctaPt, setCtaPt] = useState('Baixar Guia Grátis');

  useEffect(() => { loadPopups(); }, []);

  async function loadPopups() {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/popups?admin=true');
      const data = await res.json();
      setPopups(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name || !titleEn || !bodyEn || !ctaEn) {
      toast({ title: 'All English fields are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/marketing/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, triggerValue, titleEn, titlePt, bodyEn, bodyPt, ctaEn, ctaPt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: '✅ Pop-up saved!' });
      setShowForm(false);
      resetForm();
      loadPopups();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(popup: Popup) {
    await fetch('/api/marketing/popups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: popup.id, isActive: !popup.isActive }),
    });
    loadPopups();
    toast({ title: popup.isActive ? 'Pop-up disabled' : '✅ Pop-up activated!' });
  }

  function resetForm() {
    setName(''); setType('exit_intent'); setTriggerValue(30);
    setTitleEn(''); setTitlePt(''); setBodyEn(''); setBodyPt('');
    setCtaEn('Get Free Guide'); setCtaPt('Baixar Guia Grátis');
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Pop-up Configuration</h1>
            <p className="text-sm text-muted-foreground">Smart lead capture pop-ups for the public site</p>
          </div>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Pop-up
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-6 rounded-xl border bg-card space-y-5">
          <h3 className="font-semibold">New Pop-up</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Internal Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Exit Intent - Blog" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Trigger Type</Label>
              <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label} — {cfg.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm">
                {type === 'exit_intent' ? 'Sensitivity (ignored)' : type === 'scroll' ? 'Scroll % to trigger' : 'Seconds to trigger'}
              </Label>
              <Input
                type="number"
                value={triggerValue}
                onChange={e => setTriggerValue(parseInt(e.target.value))}
                min={1}
                className="mt-1"
                disabled={type === 'exit_intent'}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Title (English) 🇬🇧</Label>
              <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Free UK Tax Guide" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Title (Portuguese) 🇧🇷</Label>
              <Input value={titlePt} onChange={e => setTitlePt(e.target.value)} placeholder="Guia Gratuito de Impostos no UK" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Body (English)</Label>
              <textarea value={bodyEn} onChange={e => setBodyEn(e.target.value)} rows={3} placeholder="Get our free guide..." className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <Label className="text-sm">Body (Portuguese)</Label>
              <textarea value={bodyPt} onChange={e => setBodyPt(e.target.value)} rows={3} placeholder="Baixe nosso guia grátis..." className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <Label className="text-sm">CTA Button (English)</Label>
              <Input value={ctaEn} onChange={e => setCtaEn(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">CTA Button (Portuguese)</Label>
              <Input value={ctaPt} onChange={e => setCtaPt(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Save Pop-up
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : popups.length === 0 && !showForm ? (
        <div className="text-center py-16 border rounded-xl">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No pop-ups yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create intelligent pop-ups to capture leads on the public site.</p>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Create Pop-up</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {popups.map(popup => {
            const cfg = TYPE_CONFIG[popup.type];
            const Icon = cfg?.icon || Megaphone;
            return (
              <div key={popup.id} className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/20 transition-colors">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${popup.isActive ? 'bg-green-500/10' : 'bg-muted'}`}>
                  <Icon className={`h-5 w-5 ${popup.isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm">{popup.name}</p>
                    <Badge variant={popup.isActive ? 'default' : 'secondary'} className="text-xs">
                      {popup.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{popup.titleEn}</p>
                  <p className="text-xs text-muted-foreground">
                    {cfg?.label} • {popup.type !== 'exit_intent' ? `Trigger: ${popup.triggerValue}${popup.type === 'scroll' ? '%' : 's'}` : 'Exit detect'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(popup)}
                    className={`transition-colors ${popup.isActive ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                    title={popup.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {popup.isActive
                      ? <ToggleRight className="h-7 w-7" />
                      : <ToggleLeft className="h-7 w-7" />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
