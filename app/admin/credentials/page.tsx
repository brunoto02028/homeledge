'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  KeyRound, Plus, Pencil, Trash2, Copy, Eye, EyeOff, Loader2, Check,
  Building2, Landmark, Sparkles, Cable, CreditCard, Globe, Shield, ExternalLink,
} from 'lucide-react';

interface Credential {
  id: string;
  provider: string;
  label: string;
  keyName: string;
  value: string;
  category: string;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const PROVIDER_CONFIG: Record<string, { label: string; icon: any; color: string; links?: { label: string; url: string }[] }> = {
  companies_house: {
    label: 'Companies House',
    icon: Building2,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    links: [
      { label: 'Developer Hub', url: 'https://developer.company-information.service.gov.uk/' },
      { label: 'Auth Code Request', url: 'https://www.gov.uk/guidance/company-authentication-codes-for-online-filing' },
    ],
  },
  hmrc: {
    label: 'HMRC',
    icon: Landmark,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    links: [
      { label: 'Developer Hub', url: 'https://developer.service.hmrc.gov.uk/' },
    ],
  },
  gemini: {
    label: 'Google Gemini',
    icon: Sparkles,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    links: [
      { label: 'AI Studio', url: 'https://aistudio.google.com/apikey' },
    ],
  },
  abacus: {
    label: 'Abacus AI',
    icon: Sparkles,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    links: [
      { label: 'Dashboard', url: 'https://apps.abacus.ai/' },
    ],
  },
  clinic: {
    label: 'Clinic System',
    icon: Cable,
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  },
  stripe: {
    label: 'Stripe',
    icon: CreditCard,
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    links: [
      { label: 'Dashboard', url: 'https://dashboard.stripe.com/' },
    ],
  },
  custom: {
    label: 'Custom / Other',
    icon: Globe,
    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  api_key: 'API Key',
  oauth_client_id: 'OAuth Client ID',
  oauth_secret: 'OAuth Secret',
  redirect_uri: 'Redirect URI',
  endpoint: 'Endpoint URL',
  auth_code: 'Auth Code',
  other: 'Other',
};

const emptyForm = {
  provider: 'companies_house',
  label: '',
  keyName: '',
  value: '',
  category: 'api_key',
  notes: '',
  isActive: true,
  sortOrder: 0,
};

export default function AdminCredentialsPage() {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Credential | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/credentials');
      if (res.ok) setCredentials(await res.json());
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCredentials(); }, [fetchCredentials]);

  const handleSubmit = async () => {
    if (!form.label || !form.keyName || !form.value) {
      toast({ title: 'Label, Key Name, and Value are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = editItem ? `/api/admin/credentials/${editItem.id}` : '/api/admin/credentials';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: editItem ? 'Credential Updated' : 'Credential Created' });
        setDialogOpen(false);
        fetchCredentials();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/credentials/${id}`, { method: 'DELETE' });
      toast({ title: 'Credential Deleted' });
      fetchCredentials();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cred: Credential) => {
    setEditItem(cred);
    setForm({
      provider: cred.provider,
      label: cred.label,
      keyName: cred.keyName,
      value: cred.value,
      category: cred.category,
      notes: cred.notes || '',
      isActive: cred.isActive,
      sortOrder: cred.sortOrder,
    });
    setDialogOpen(true);
  };

  const toggleVisibility = (id: string) => {
    setVisibleValues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyValue = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const maskValue = (val: string) => {
    if (val.length <= 8) return '••••••••';
    return val.slice(0, 4) + '••••' + val.slice(-4);
  };

  // Group by provider
  const grouped = credentials.reduce((acc, c) => {
    if (!acc[c.provider]) acc[c.provider] = [];
    acc[c.provider].push(c);
    return acc;
  }, {} as Record<string, Credential[]>);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="h-7 w-7 text-primary" />
            API Credentials
          </h1>
          <p className="text-muted-foreground mt-1">
            Centralized, encrypted storage for all API keys, OAuth credentials, and integration details.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Credential
        </Button>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
        <Shield className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-amber-800 dark:text-amber-300">
          All values are encrypted with AES-256-GCM. Only admin users can access this page.
        </span>
      </div>

      {credentials.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <KeyRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No credentials stored yet</p>
            <p className="text-muted-foreground mb-4">Add your API keys, OAuth credentials, and integration details here.</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add First Credential
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([provider, creds]) => {
          const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.custom;
          const Icon = config.icon;
          return (
            <Card key={provider}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {config.label}
                    <Badge variant="outline" className="text-xs">{creds.length} key{creds.length > 1 ? 's' : ''}</Badge>
                  </CardTitle>
                  {config.links && (
                    <div className="flex gap-2">
                      {config.links.map((link) => (
                        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          {link.label} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {creds.map((cred) => (
                  <div key={cred.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{cred.label}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {CATEGORY_LABELS[cred.category] || cred.category}
                        </Badge>
                        {!cred.isActive && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{cred.keyName}</code>
                        <span className="text-xs font-mono text-foreground">
                          {visibleValues.has(cred.id) ? cred.value : maskValue(cred.value)}
                        </span>
                      </div>
                      {cred.notes && <p className="text-xs text-muted-foreground mt-1">{cred.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleVisibility(cred.id)} title={visibleValues.has(cred.id) ? 'Hide' : 'Show'}>
                        {visibleValues.has(cred.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => copyValue(cred.id, cred.value)} title="Copy">
                        {copiedId === cred.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(cred)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Delete">
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{cred.label}&quot; ({cred.keyName}). This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cred.id)} className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-sm">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Credential' : 'Add Credential'}</DialogTitle>
            <DialogDescription>
              Store an API key, OAuth credential, or integration detail. Values are encrypted at rest.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm(prev => ({ ...prev, provider: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Label *</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., REST API Key"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Key Name * <span className="text-xs text-muted-foreground">(env variable name)</span></Label>
              <Input
                value={form.keyName}
                onChange={(e) => setForm(prev => ({ ...prev, keyName: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
                placeholder="e.g., COMPANIES_HOUSE_API_KEY"
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <Label>Value *</Label>
              <Input
                value={form.value}
                onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))}
                placeholder="The secret value..."
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes (e.g., expiry date, account email, etc.)..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.label || !form.keyName || !form.value}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
