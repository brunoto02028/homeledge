'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Globe, FileText, Download, Loader2,
  Trash2, Eye, ToggleLeft, ToggleRight, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Resource {
  id: string;
  title: string;
  titlePt: string | null;
  description: string | null;
  type: string;
  slug: string;
  fileUrl: string | null;
  coverImage: string | null;
  downloadCount: number;
  isActive: boolean;
  requiresEmail: boolean;
  createdAt: string;
}

const RESOURCE_TYPES = ['ebook', 'checklist', 'calculator', 'template', 'guide'];

const TYPE_ICONS: Record<string, string> = {
  ebook: '📚',
  checklist: '✅',
  calculator: '🧮',
  template: '📄',
  guide: '🗺️',
};

export default function ResourcesClient() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [titlePt, setTitlePt] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('ebook');
  const [slug, setSlug] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [requiresEmail, setRequiresEmail] = useState(true);

  useEffect(() => { loadResources(); }, []);

  async function loadResources() {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/resources');
      const data = await res.json();
      setResources(Array.isArray(data) ? data : data.resources || []);
    } finally {
      setLoading(false);
    }
  }

  function autoSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleSave() {
    if (!title || !type || !slug) {
      toast({ title: 'Title, type and slug are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/marketing/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, titlePt, description, type, slug, fileUrl, coverImage, requiresEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: '✅ Resource saved!' });
      setShowForm(false);
      resetForm();
      loadResources();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(resource: Resource) {
    await fetch(`/api/marketing/resources/${resource.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !resource.isActive }),
    });
    loadResources();
  }

  function resetForm() {
    setTitle(''); setTitlePt(''); setDescription('');
    setType('ebook'); setSlug(''); setFileUrl('');
    setCoverImage(''); setRequiresEmail(true);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Free Resources</h1>
            <p className="text-sm text-muted-foreground">E-books, checklists, guides for lead generation</p>
          </div>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Resource
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-6 rounded-xl border bg-card space-y-5">
          <h3 className="font-semibold">New Resource</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Title (English) 🇬🇧</Label>
              <Input
                value={title}
                onChange={e => { setTitle(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }}
                placeholder="UK Tax Guide 2025"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Title (Portuguese) 🇧🇷</Label>
              <Input value={titlePt} onChange={e => setTitlePt(e.target.value)} placeholder="Guia de Impostos UK 2025" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Type</Label>
              <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background">
                {RESOURCE_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm">URL Slug</Label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="uk-tax-guide-2025"
                className="mt-1 font-mono text-sm"
              />
              {slug && <p className="text-xs text-muted-foreground mt-0.5">/recursos/{slug}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm">Description</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description shown on landing page..."
                rows={2}
                className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <Label className="text-sm">File URL (PDF/link)</Label>
              <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Cover Image URL</Label>
              <Input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresEmail}
              onChange={e => setRequiresEmail(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Require email to download (lead capture)</span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Save Resource
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
      ) : resources.length === 0 && !showForm ? (
        <div className="text-center py-16 border rounded-xl">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No resources yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload e-books, checklists and guides to capture leads.</p>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Resource</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(res => (
            <div key={res.id} className="border rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
              {res.coverImage ? (
                <div className="h-36 overflow-hidden">
                  <img src={res.coverImage} alt={res.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <span className="text-5xl">{TYPE_ICONS[res.type] || '📁'}</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm line-clamp-2">{res.title}</p>
                  <button onClick={() => toggleActive(res)} className="shrink-0 mt-0.5">
                    {res.isActive
                      ? <ToggleRight className="h-5 w-5 text-green-600" />
                      : <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    }
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs capitalize">{res.type}</Badge>
                  {res.requiresEmail && <Badge variant="secondary" className="text-xs">Lead capture</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {res.downloadCount}</span>
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> /recursos/{res.slug}</span>
                </div>
                <div className="flex gap-1 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" asChild>
                    <a href={`/recursos/${res.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
