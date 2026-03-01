'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  KeyRound, Plus, Search, Star, StarOff, Eye, EyeOff, Copy, Check,
  Trash2, Pencil, X, ExternalLink, Loader2, Shield, Landmark, Zap,
  Building2, CreditCard, FileText, Heart, GraduationCap, Home, Car, MoreHorizontal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';

const CATEGORIES = [
  { value: 'banking', label: 'Banking', icon: Landmark, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  { value: 'utilities', label: 'Utilities', icon: Zap, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  { value: 'government', label: 'Government', icon: Building2, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
  { value: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400' },
  { value: 'tax', label: 'Tax', icon: FileText, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  { value: 'healthcare', label: 'Healthcare', icon: Heart, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
  { value: 'housing', label: 'Housing', icon: Home, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-muted text-muted-foreground' },
];

interface VaultEntry {
  id: string;
  title: string;
  category: string;
  username: string | null;
  passwordEnc: string | null;
  notes: string | null;
  referenceNumber: string | null;
  accountNumber: string | null;
  sortCode: string | null;
  websiteUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  tags: string[];
  isFavorite: boolean;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  title: '', category: 'other', username: '', password: '', notes: '',
  referenceNumber: '', accountNumber: '', sortCode: '', websiteUrl: '',
  phoneNumber: '', email: '', tags: '' as string, isFavorite: false,
};

export function VaultClient() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/vault');
      if (res.ok) setEntries(await res.json());
    } catch {
      toast({ title: 'Error', description: 'Failed to load vault entries', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    try {
      const url = editingId ? `/api/vault/${editingId}` : '/api/vault';
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({ title: 'Success', description: `Entry ${editingId ? 'updated' : 'created'}` });
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchEntries();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleEdit = (entry: VaultEntry) => {
    setForm({
      title: entry.title,
      category: entry.category,
      username: entry.username || '',
      password: entry.passwordEnc || '',
      notes: entry.notes || '',
      referenceNumber: entry.referenceNumber || '',
      accountNumber: entry.accountNumber || '',
      sortCode: entry.sortCode || '',
      websiteUrl: entry.websiteUrl || '',
      phoneNumber: entry.phoneNumber || '',
      email: entry.email || '',
      tags: entry.tags.join(', '),
      isFavorite: entry.isFavorite,
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vault entry? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/vault/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Entry removed from vault' });
        fetchEntries();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleToggleFavorite = async (entry: VaultEntry) => {
    try {
      await fetch(`/api/vault/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !entry.isFavorite }),
      });
      fetchEntries();
    } catch {}
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getCat = (val: string) => CATEGORIES.find((c) => c.value === val) || CATEGORIES[CATEGORIES.length - 1];

  const filtered = entries.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.username && e.username.toLowerCase().includes(search.toLowerCase())) ||
      (e.email && e.email.toLowerCase().includes(search.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !categoryFilter || e.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const categoryCounts = CATEGORIES.map((c) => ({
    ...c,
    count: entries.filter((e) => e.category === c.value).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <KeyRound className="h-7 w-7 text-blue-700" />
            {t('vault.title')}
          </h2>
          <p className="text-muted-foreground mt-1">{t('vault.subtitle')}</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>
          <Plus className="h-4 w-4 mr-2" />
          {t('vault.add')}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-border bg-blue-50/30 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Barclays Online Banking" required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username or login ID" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (stored encrypted)" />
                </div>
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} placeholder="e.g. Council Tax ref, UTR" />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Account number" />
                </div>
                <div className="space-y-2">
                  <Label>Sort Code</Label>
                  <Input value={form.sortCode} onChange={(e) => setForm({ ...form, sortCode: e.target.value })} placeholder="00-00-00" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="Contact number" />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. important, uk, bank" />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFavorite} onChange={(e) => setForm({ ...form, isFavorite: e.target.checked })} className="rounded" />
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Favorite</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes, security questions, etc."
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {editingId ? 'Update' : 'Save'} Entry
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input placeholder="Search vault..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={categoryFilter === '' ? 'default' : 'outline'} onClick={() => setCategoryFilter('')}>
            All ({entries.length})
          </Button>
          {categoryCounts.map((c) => {
            const Icon = c.icon;
            return (
              <Button key={c.value} size="sm" variant={categoryFilter === c.value ? 'default' : 'outline'} onClick={() => setCategoryFilter(c.value === categoryFilter ? '' : c.value)}>
                <Icon className="h-3.5 w-3.5 mr-1" />
                {c.label} ({c.count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <KeyRound className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">{entries.length === 0 ? 'Your vault is empty. Add your first entry!' : 'No entries match your search.'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((entry) => {
            const cat = getCat(entry.category);
            const Icon = cat.icon;
            const isPasswordVisible = visiblePasswords.has(entry.id);

            return (
              <Card key={entry.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{entry.title}</h3>
                          {entry.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${cat.color}`}>
                          {cat.label}
                        </span>

                        {/* Credential Fields */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          {entry.email && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60 text-xs w-16">Email</span>
                              <span className="text-muted/500 truncate">{entry.email}</span>
                              <button onClick={() => copyToClipboard(entry.email!, `email-${entry.id}`)} className="text-muted-foreground/60 hover:text-blue-600 flex-shrink-0">
                                {copiedField === `email-${entry.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                          {entry.username && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60 text-xs w-16">User</span>
                              <span className="text-muted/500 truncate">{entry.username}</span>
                              <button onClick={() => copyToClipboard(entry.username!, `user-${entry.id}`)} className="text-muted-foreground/60 hover:text-blue-600 flex-shrink-0">
                                {copiedField === `user-${entry.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                          {entry.passwordEnc && (
                            entry.passwordEnc === '[decryption failed]' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground/60 text-xs w-16">Pass</span>
                                <span className="text-red-400 text-xs font-medium">[decryption failed]</span>
                                <button onClick={() => handleEdit(entry)} className="text-xs text-amber-400 hover:text-amber-300 underline flex-shrink-0">
                                  Re-enter
                                </button>
                              </div>
                            ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60 text-xs w-16">Pass</span>
                              <span className="text-muted/500 font-mono text-xs truncate">
                                {isPasswordVisible ? entry.passwordEnc : '••••••••'}
                              </span>
                              <button onClick={() => togglePasswordVisibility(entry.id)} className="text-muted-foreground/60 hover:text-blue-600 flex-shrink-0">
                                {isPasswordVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              <button onClick={() => copyToClipboard(entry.passwordEnc!, `pass-${entry.id}`)} className="text-muted-foreground/60 hover:text-blue-600 flex-shrink-0">
                                {copiedField === `pass-${entry.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                            )
                          )}
                          {entry.referenceNumber && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60 text-xs w-16">Ref</span>
                              <span className="text-muted/500 truncate">{entry.referenceNumber}</span>
                              <button onClick={() => copyToClipboard(entry.referenceNumber!, `ref-${entry.id}`)} className="text-muted-foreground/60 hover:text-blue-600 flex-shrink-0">
                                {copiedField === `ref-${entry.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                          {entry.accountNumber && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60 text-xs w-16">Acct</span>
                              <span className="text-muted/500">{entry.accountNumber}</span>
                              {entry.sortCode && <span className="text-muted-foreground/60">/ {entry.sortCode}</span>}
                              <button onClick={() => copyToClipboard(entry.accountNumber!, `acct-${entry.id}`)} className="text-muted-foreground/60 hover:text-blue-600 flex-shrink-0">
                                {copiedField === `acct-${entry.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                          {entry.phoneNumber && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60 text-xs w-16">Phone</span>
                              <span className="text-muted/500">{entry.phoneNumber}</span>
                            </div>
                          )}
                        </div>

                        {entry.notes && (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{entry.notes}</p>
                        )}

                        {entry.tags.length > 0 && (
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {entry.tags.map((tag, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {entry.websiteUrl && (
                        <a href={entry.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      )}
                      <button onClick={() => handleToggleFavorite(entry)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        {entry.isFavorite ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-4 w-4 text-muted-foreground/60" />}
                      </button>
                      <button onClick={() => handleEdit(entry)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
