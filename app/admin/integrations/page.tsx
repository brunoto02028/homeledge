'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Cable, Plus, Pencil, Trash2, Loader2, Check, X, RefreshCw,
  Wifi, WifiOff, Download, Eye, EyeOff, Zap, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  config: any;
}

export default function AdminIntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncData, setSyncData] = useState<Record<string, any> | null>(null);
  const [showSyncData, setShowSyncData] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({ name: '', slug: '', baseUrl: '', apiKey: '', config: '{}' });
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') router.replace('/dashboard');
  }, [status, session, router]);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations');
      if (res.ok) setIntegrations(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.baseUrl || !form.apiKey) {
      toast({ title: 'Missing fields', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let config = {};
      try { config = form.config ? JSON.parse(form.config) : {}; } catch {
        toast({ title: 'Invalid JSON', description: 'Config must be valid JSON.', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, config }),
      });

      if (res.ok) {
        toast({ title: 'Integration Created' });
        setShowDialog(false);
        setForm({ name: '', slug: '', baseUrl: '', apiKey: '', config: '{}' });
        fetchIntegrations();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/integrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      fetchIntegrations();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete integration "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/integrations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Integration Deleted' });
        fetchIntegrations();
      }
    } catch { /* ignore */ }
  };

  const handleTestConnection = async (id: string) => {
    setSyncing(id);
    try {
      const res = await fetch(`/api/admin/integrations/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Connection Successful', description: 'The external API is reachable.' });
      } else {
        toast({ title: 'Connection Failed', description: data.message || 'Could not reach the API.', variant: 'destructive' });
      }
      fetchIntegrations();
    } catch {
      toast({ title: 'Error', description: 'Test failed', variant: 'destructive' });
    }
    setSyncing(null);
  };

  const handleFetchData = async (id: string) => {
    setSyncing(id);
    try {
      const res = await fetch(`/api/admin/integrations/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch' }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncData(data.data);
        setShowSyncData(true);
        toast({ title: 'Data Fetched', description: 'Financial data retrieved successfully.' });
      } else {
        toast({ title: 'Fetch Failed', description: data.message, variant: 'destructive' });
      }
      fetchIntegrations();
    } catch {
      toast({ title: 'Error', description: 'Fetch failed', variant: 'destructive' });
    }
    setSyncing(null);
  };

  const statusBadge = (s: string | null) => {
    if (!s) return <Badge variant="outline">Never synced</Badge>;
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      success: { variant: 'default', label: 'Connected' },
      syncing: { variant: 'secondary', label: 'Syncing...' },
      error: { variant: 'destructive', label: 'Error' },
    };
    const m = map[s] || { variant: 'outline' as const, label: s };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  if (loading || status === 'loading') return <LoadingSpinner />;
  if ((session?.user as any)?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cable className="h-7 w-7 text-primary" />
            External Integrations
          </h1>
          <p className="text-muted-foreground mt-1">Connect to external systems and import financial data</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Integration
        </Button>
      </div>

      {/* Integrations List */}
      <div className="space-y-4">
        {integrations.map(intg => {
          const isExpanded = expandedId === intg.id;
          return (
            <Card key={intg.id} className={!intg.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      intg.syncStatus === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      intg.syncStatus === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-muted'
                    }`}>
                      {intg.syncStatus === 'success' ? <Wifi className="h-5 w-5 text-emerald-600" /> :
                       intg.syncStatus === 'error' ? <WifiOff className="h-5 w-5 text-red-600" /> :
                       <Cable className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <CardTitle className="text-base">{intg.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{intg.baseUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(intg.syncStatus)}
                    <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : intg.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Slug</p>
                      <p className="font-mono">{intg.slug}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">API Key</p>
                      <p className="font-mono">{intg.apiKey}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Last Sync</p>
                      <p>{intg.lastSyncAt ? new Date(intg.lastSyncAt).toLocaleString('en-GB') : 'Never'}</p>
                    </div>
                  </div>

                  {intg.syncError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                      <p className="font-medium mb-1">Last Error:</p>
                      <p className="text-xs font-mono">{intg.syncError}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={intg.isActive}
                        onCheckedChange={(v) => handleToggleActive(intg.id, v)}
                      />
                      <Label className="text-sm">{intg.isActive ? 'Active' : 'Inactive'}</Label>
                    </div>

                    <div className="flex-1" />

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(intg.id)}
                      disabled={syncing === intg.id}
                    >
                      {syncing === intg.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                      Test Connection
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFetchData(intg.id)}
                      disabled={syncing === intg.id}
                    >
                      {syncing === intg.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Fetch Data
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleDelete(intg.id, intg.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {integrations.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Cable className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No integrations configured</p>
            <p className="text-sm mt-1">Click "Add Integration" to connect an external system.</p>
          </div>
        )}
      </div>

      {/* Create Integration Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add External Integration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Clinic System"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (unique ID)</Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. clinic"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={form.baseUrl}
                onChange={e => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="e.g. http://localhost:3001/api"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={form.apiKey}
                  onChange={e => setForm({ ...form, apiKey: e.target.value })}
                  placeholder="bpr_k_..."
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Config (JSON, optional)</Label>
              <Textarea
                value={form.config}
                onChange={e => setForm({ ...form, config: e.target.value })}
                rows={3}
                className="font-mono text-xs"
                placeholder="{}"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Data Results Dialog */}
      <Dialog open={showSyncData} onOpenChange={setShowSyncData}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fetched Financial Data</DialogTitle>
          </DialogHeader>
          {syncData && (
            <div className="space-y-4">
              {Object.entries(syncData).map(([key, value]) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold mb-1">{key}</h3>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-60">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncData(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
