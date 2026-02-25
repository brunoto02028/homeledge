'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  Building2, ArrowLeft, RefreshCw, Loader2, MapPin, Users, Clock, FileText,
  ExternalLink, Save, Shield, Landmark, Calendar, Pencil, Globe, Briefcase,
  TrendingUp, Download, Sparkles, CheckCircle, AlertTriangle, Circle,
  UserPlus, UserMinus, FileCheck, Zap, Link2, CreditCard, PenLine, History, Pin, PinOff, Plus, Trash2, Mail, File, Scale,
} from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  tradingName: string | null;
  type: string;
  taxRegime: string;
  isDefault: boolean;
  companyNumber: string | null;
  companyStatus: string | null;
  sicCodes: string[];
  incorporationDate: string | null;
  utr: string | null;
  vatNumber: string | null;
  isVatRegistered: boolean;
  vatScheme: string | null;
  payeReference: string | null;
  niNumber: string | null;
  registeredAddress: string | null;
  tradingAddress: string | null;
  financialYearStart: string | null;
  financialYearEnd: string | null;
  accountingBasis: string | null;
  logoUrl: string | null;
  notes: string | null;
  _count?: { bankStatements: number; accounts: number };
}

const TYPE_LABELS: Record<string, string> = {
  limited_company: 'Limited Company', llp: 'LLP', sole_trader: 'Sole Trader',
  partnership: 'Partnership', individual: 'Individual',
};

const TAX_LABELS: Record<string, string> = {
  corporation_tax: 'Corporation Tax', self_assessment: 'Self Assessment', both: 'Both',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-600', dissolved: 'text-red-600', dormant: 'text-amber-600',
};

export default function EntityDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const entityId = params.id as string;

  const [entity, setEntity] = useState<Entity | null>(null);
  const [chData, setChData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chLoading, setChLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ch' | 'actions' | 'history' | 'report'>('overview');
  const [editing, setEditing] = useState(false);
  const [chConnection, setChConnection] = useState<any>(null);
  const [filingDialog, setFilingDialog] = useState<string | null>(null);
  const [filingForm, setFilingForm] = useState<any>({});
  const [filingSubmitting, setFilingSubmitting] = useState(false);
  const [filingStep, setFilingStep] = useState<'form' | 'confirm'>('form');
  const [postcodeLooking, setPostcodeLooking] = useState(false);
  const [postcodeAddresses, setPostcodeAddresses] = useState<any[]>([]);
  const [connectAuthCode, setConnectAuthCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  // History & Docs state
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [historyForm, setHistoryForm] = useState({ type: 'note', title: '', description: '', date: new Date().toISOString().split('T')[0], tags: '' });
  const [historySubmitting, setHistorySubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', tradingName: '', registeredAddress: '', tradingAddress: '',
    utr: '', vatNumber: '', isVatRegistered: false, vatScheme: '',
    payeReference: '', niNumber: '', accountingBasis: 'accruals',
    financialYearStart: '', financialYearEnd: '', notes: '',
  });

  const fetchEntity = useCallback(async () => {
    try {
      const res = await fetch(`/api/entities/${entityId}`);
      if (!res.ok) { router.push('/entities'); return; }
      const data = await res.json();
      setEntity(data);
      setForm({
        name: data.name || '',
        tradingName: data.tradingName || '',
        registeredAddress: data.registeredAddress || '',
        tradingAddress: data.tradingAddress || '',
        utr: data.utr || '',
        vatNumber: data.vatNumber || '',
        isVatRegistered: data.isVatRegistered || false,
        vatScheme: data.vatScheme || '',
        payeReference: data.payeReference || '',
        niNumber: data.niNumber || '',
        accountingBasis: data.accountingBasis || 'accruals',
        financialYearStart: data.financialYearStart || '',
        financialYearEnd: data.financialYearEnd || '',
        notes: data.notes || '',
      });
    } catch { router.push('/entities'); }
    finally { setLoading(false); }
  }, [entityId, router]);

  const fetchChData = useCallback(async () => {
    if (!entity?.companyNumber) return;
    setChLoading(true);
    try {
      const res = await fetch(`/api/entities/companies-house?number=${encodeURIComponent(entity.companyNumber)}`);
      if (res.ok) setChData(await res.json());
    } catch { /* ignore */ }
    finally { setChLoading(false); }
  }, [entity?.companyNumber]);

  // Check if there's an active CH OAuth connection for this entity
  const fetchChConnection = useCallback(async () => {
    try {
      const res = await fetch('/api/government/connect');
      if (res.ok) {
        const data = await res.json();
        const connections = data.connections || data;
        const match = (Array.isArray(connections) ? connections : []).find(
          (c: any) => c.provider === 'companies_house' && c.companyNumber === entity?.companyNumber && c.status === 'active'
        );
        setChConnection(match || null);
      }
    } catch { /* ignore */ }
  }, [entity?.companyNumber]);

  // Fetch history entries
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const typeParam = historyFilter !== 'all' ? `&type=${historyFilter}` : '';
      const res = await fetch(`/api/entities/${entityId}/history?limit=100${typeParam}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryEntries(data.entries || []);
        setHistoryTotal(data.total || 0);
      }
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  }, [entityId, historyFilter]);

  // Submit new history entry
  const submitHistory = async () => {
    if (!historyForm.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setHistorySubmitting(true);
    try {
      const res = await fetch(`/api/entities/${entityId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...historyForm,
          tags: historyForm.tags ? historyForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        toast({ title: 'Entry Added' });
        setShowAddHistory(false);
        setHistoryForm({ type: 'note', title: '', description: '', date: new Date().toISOString().split('T')[0], tags: '' });
        fetchHistory();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setHistorySubmitting(false); }
  };

  // Delete history entry
  const deleteHistory = async (historyId: string) => {
    try {
      const res = await fetch(`/api/entities/${entityId}/history/${historyId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Entry Deleted' });
        fetchHistory();
      }
    } catch { /* ignore */ }
  };

  // Toggle pin
  const togglePin = async (entry: any) => {
    try {
      await fetch(`/api/entities/${entityId}/history/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !entry.isPinned }),
      });
      fetchHistory();
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchEntity(); }, [fetchEntity]);
  useEffect(() => { if (entity?.companyNumber) { fetchChData(); fetchChConnection(); } }, [entity?.companyNumber, fetchChData, fetchChConnection]);
  useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab, fetchHistory]);

  // Detect OAuth callback redirect (?ch_connected=true)
  useEffect(() => {
    if (searchParams.get('ch_connected') === 'true') {
      toast({ title: 'Companies House Connected!', description: 'OAuth active — you can now submit filings directly.' });
      setActiveTab('actions');
      fetchChConnection();
      // Clean URL
      window.history.replaceState({}, '', `/entities/${entityId}`);
    }
    if (searchParams.get('error')) {
      toast({ title: 'Connection Error', description: decodeURIComponent(searchParams.get('error') || ''), variant: 'destructive' });
      setActiveTab('actions');
      window.history.replaceState({}, '', `/entities/${entityId}`);
    }
  }, [searchParams]);

  // Inline CH connect (no need to go to /connections)
  const handleInlineConnect = async () => {
    if (!entity?.companyNumber) {
      toast({ title: 'No company number', description: 'This entity has no company number set.', variant: 'destructive' });
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch('/api/government/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'companies_house',
          entityId,
          companyNumber: entity.companyNumber,
          authCode: connectAuthCode || undefined,
        }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON response: ${text.slice(0, 200)}`); }
      if (!res.ok) {
        if (data.chDown) {
          toast({ title: '⚠️ Companies House Service Down', description: data.error || 'CH identity service is currently unavailable. This is on their side — please try again later.', variant: 'destructive', duration: 10000 });
          setConnecting(false);
          return;
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (!data.authUrl) throw new Error('No authUrl returned');
      // Redirect to CH identity — after auth, callback redirects back to this entity page
      window.location.href = data.authUrl;
    } catch (err: any) {
      toast({ title: 'Connection Error', description: err.message, variant: 'destructive' });
      setConnecting(false);
    }
  };

  // Postcode lookup — fetches street-level addresses from Nominatim + postcodes.io
  const lookupPostcode = async (postcode: string) => {
    if (!postcode || postcode.replace(/\s/g, '').length < 5) return;
    setPostcodeLooking(true);
    setPostcodeAddresses([]);
    try {
      const res = await fetch(`/api/postcode-lookup?postcode=${encodeURIComponent(postcode)}`);
      const data = await res.json();
      if (res.ok && data.postcode) {
        // Always fill postcode, city, region, country from validated data
        setFilingForm((p: any) => ({
          ...p,
          city: data.locality || p.city,
          region: data.region || p.region,
          country: data.country || p.country,
          postcode: data.postcode || p.postcode,
        }));

        if (data.addresses && data.addresses.length > 0) {
          // Filter out entries with empty addressLine1 (fallback-only entries)
          const realAddresses = data.addresses.filter((a: any) => a.addressLine1);
          if (realAddresses.length > 0) {
            setPostcodeAddresses(realAddresses);
            toast({ title: `${realAddresses.length} address(es) found`, description: 'Select one below or type manually.' });
          } else {
            toast({ title: 'Postcode found', description: `${data.postcode} — ${data.locality}. Enter your street address manually.` });
          }
        } else {
          toast({ title: 'Postcode found', description: `${data.postcode} — ${data.locality}. Enter your street address manually.` });
        }
      } else {
        toast({ title: 'Postcode not found', description: data.error || 'Please check and try again.', variant: 'destructive' });
      }
    } catch { toast({ title: 'Lookup failed', variant: 'destructive' }); }
    finally { setPostcodeLooking(false); }
  };

  // Select address from the dropdown
  const selectAddress = (addr: any) => {
    setFilingForm((p: any) => ({
      ...p,
      premises: addr.premises || p.premises,
      addressLine1: addr.addressLine1 || p.addressLine1,
      addressLine2: addr.addressLine2 || p.addressLine2,
      city: addr.city || p.city,
      region: addr.region || p.region,
      country: addr.country || p.country,
      postcode: addr.postcode || p.postcode,
    }));
    setPostcodeAddresses([]);
    if (addr.isStreetOnly) {
      toast({ title: 'Street selected', description: 'Add your house number or building name in the fields below.' });
    }
  };

  const submitFiling = async (filingType: string, formData: any) => {
    if (!chConnection) {
      toast({ title: 'Not Connected', description: 'Enter your Authentication Code and connect first.', variant: 'destructive' });
      return;
    }
    setFilingSubmitting(true);
    try {
      const res = await fetch(`/api/government/ch/${chConnection.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filingType, formData }),
      });
      const data = await res.json();
      if (res.ok && data.filing?.status !== 'rejected') {
        toast({ title: 'Filing Submitted!', description: `${data.filing.description} — Ref: ${data.filing.reference || 'pending'}`, duration: 8000 });

        // Record in Entity History automatically
        try {
          await fetch(`/api/entities/${entityId}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: filingType === 'change_registered_office' ? 'address_change' : 'filing',
              title: data.filing.description || `CH Filing: ${filingType}`,
              description: `Submitted to Companies House.\nReference: ${data.filing.reference || 'pending'}\nStatus: ${data.filing.status}\n\nDetails: ${JSON.stringify(formData, null, 2)}`,
              date: new Date().toISOString(),
              tags: ['companies-house', filingType, data.filing.reference].filter(Boolean).join(','),
            }),
          });
        } catch { /* non-critical */ }

        setFilingDialog(null);
        setFilingForm({});
        setFilingStep('form');
        fetchChData();
      } else {
        toast({ title: 'Filing Rejected', description: data.filing?.responseData?.error || data.error || 'Submission failed', variant: 'destructive', duration: 10000 });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit filing', variant: 'destructive' });
    } finally { setFilingSubmitting(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/entities/${entityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: 'Saved', description: 'Entity updated successfully' });
        setEditing(false);
        fetchEntity();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const generateReport = async () => {
    if (!entity) return;
    setGenerating(true);
    setAiReport(null);
    try {
      const context = {
        entity: {
          name: entity.name, tradingName: entity.tradingName, type: entity.type,
          taxRegime: entity.taxRegime, companyNumber: entity.companyNumber,
          companyStatus: entity.companyStatus, registeredAddress: entity.registeredAddress,
          tradingAddress: entity.tradingAddress, utr: entity.utr, vatNumber: entity.vatNumber,
          isVatRegistered: entity.isVatRegistered, incorporationDate: entity.incorporationDate,
          sicCodes: entity.sicCodes, accountingBasis: entity.accountingBasis,
          financialYearStart: entity.financialYearStart, financialYearEnd: entity.financialYearEnd,
        },
        chData: chData ? {
          status: chData.status, officers: chData.officers,
          filings: chData.filings?.slice(0, 10),
          nextAccounts: chData.raw?.nextAccounts,
          confirmationStatement: chData.raw?.confirmationStatement,
          sicCodes: chData.sicCodes,
        } : null,
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a comprehensive company report for this UK entity. Include:\n1. Company Overview\n2. Registration & Compliance Status\n3. Officer Summary\n4. Filing History Summary\n5. Tax Obligations\n6. Key Upcoming Deadlines\n7. Recommendations\n\nEntity data: ${JSON.stringify(context)}`,
          }],
          section: 'reports',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiReport(data.reply || data.content || 'No report generated');
        setActiveTab('report');
      } else {
        toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'AI report generation failed', variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!entity) return null;

  const isCompany = entity.type === 'limited_company' || entity.type === 'llp';
  const activeOfficers = chData?.officers?.filter((o: any) => !o.resignedDate) || [];
  const resignedOfficers = chData?.officers?.filter((o: any) => o.resignedDate) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/entities')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{entity.name}</h1>
              {entity.companyStatus && (
                <Badge className={`${STATUS_COLORS[entity.companyStatus] || 'text-gray-600'}`} variant="outline">
                  <Circle className="h-2 w-2 fill-current mr-1" />
                  {entity.companyStatus}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span>{TYPE_LABELS[entity.type]}</span>
              {entity.companyNumber && <span className="font-mono">#{entity.companyNumber}</span>}
              {entity.tradingName && <span>t/a {entity.tradingName}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateReport} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            AI Report
          </Button>
          {isCompany && entity.companyNumber && (
            <a href={`https://find-and-update.company-information.service.gov.uk/company/${entity.companyNumber}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" /> Companies House
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { key: 'overview', label: 'Overview & Edit', icon: Building2 },
          ...(isCompany ? [{ key: 'ch', label: 'Companies House', icon: Globe }] : []),
          ...(isCompany ? [{ key: 'actions', label: 'Actions & Filings', icon: Zap }] : []),
          { key: 'history', label: 'History & Docs', icon: History },
          { key: 'report', label: 'AI Report', icon: FileText },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Entity Details</h2>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Company Identity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  {editing ? (
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  ) : (
                    <p className="text-sm font-medium">{entity.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Trading Name</Label>
                  {editing ? (
                    <Input value={form.tradingName} onChange={e => setForm(p => ({ ...p, tradingName: e.target.value }))} placeholder="Trading as..." />
                  ) : (
                    <p className="text-sm">{entity.tradingName || '—'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="text-sm font-medium">{TYPE_LABELS[entity.type]}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tax Regime</Label>
                    <p className="text-sm font-medium">{TAX_LABELS[entity.taxRegime]}</p>
                  </div>
                </div>
                {entity.companyNumber && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Company Number</Label>
                    <p className="text-sm font-mono font-medium">{entity.companyNumber}</p>
                  </div>
                )}
                {entity.incorporationDate && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Incorporated</Label>
                    <p className="text-sm">{new Date(entity.incorporationDate).toLocaleDateString('en-GB')}</p>
                  </div>
                )}
                {entity.sicCodes?.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">SIC Codes</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entity.sicCodes.map(s => <Badge key={s} variant="outline" className="font-mono text-xs">SIC {s}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Registered Address</Label>
                  {editing ? (
                    <Textarea value={form.registeredAddress} onChange={e => setForm(p => ({ ...p, registeredAddress: e.target.value }))} rows={3} />
                  ) : (
                    <p className="text-sm">{entity.registeredAddress || '—'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Trading Address</Label>
                  {editing ? (
                    <Textarea value={form.tradingAddress} onChange={e => setForm(p => ({ ...p, tradingAddress: e.target.value }))} rows={3} />
                  ) : (
                    <p className="text-sm">{entity.tradingAddress || '—'}</p>
                  )}
                </div>
                {chData?.registeredAddress && entity.registeredAddress !== chData.registeredAddress && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                      <AlertTriangle className="h-3 w-3" /> Address mismatch with Companies House
                    </div>
                    <p className="text-xs text-muted-foreground">CH: {chData.registeredAddress}</p>
                    <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => {
                      setForm(p => ({ ...p, registeredAddress: chData.registeredAddress }));
                      setEditing(true);
                    }}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Sync from CH
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax & Finance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Tax & Finance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UTR</Label>
                    {editing ? (
                      <Input value={form.utr} onChange={e => setForm(p => ({ ...p, utr: e.target.value }))} placeholder="1234567890" />
                    ) : (
                      <p className="text-sm font-mono">{entity.utr || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>VAT Number</Label>
                    {editing ? (
                      <Input value={form.vatNumber} onChange={e => setForm(p => ({ ...p, vatNumber: e.target.value }))} placeholder="GB123456789" />
                    ) : (
                      <p className="text-sm font-mono">{entity.vatNumber || '—'}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PAYE Reference</Label>
                    {editing ? (
                      <Input value={form.payeReference} onChange={e => setForm(p => ({ ...p, payeReference: e.target.value }))} />
                    ) : (
                      <p className="text-sm font-mono">{entity.payeReference || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>NI Number</Label>
                    {editing ? (
                      <Input value={form.niNumber} onChange={e => setForm(p => ({ ...p, niNumber: e.target.value }))} />
                    ) : (
                      <p className="text-sm font-mono">{entity.niNumber || '—'}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Accounting Basis</Label>
                    {editing ? (
                      <Select value={form.accountingBasis} onValueChange={v => setForm(p => ({ ...p, accountingBasis: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accruals">Accruals</SelectItem>
                          <SelectItem value="cash">Cash Basis</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm capitalize">{entity.accountingBasis || 'Accruals'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Financial Year End</Label>
                    {editing ? (
                      <Input value={form.financialYearEnd} onChange={e => setForm(p => ({ ...p, financialYearEnd: e.target.value }))} placeholder="31/03" />
                    ) : (
                      <p className="text-sm">{entity.financialYearEnd || '—'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={6} placeholder="Internal notes about this entity..." />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{entity.notes || 'No notes yet.'}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* === COMPANIES HOUSE TAB === */}
      {activeTab === 'ch' && isCompany && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Companies House Data</h2>
              {chData && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <Button variant="outline" size="sm" onClick={fetchChData} disabled={chLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${chLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          {chLoading && !chData ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !chData ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No Companies House data available</CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Registered Office */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Registered Office</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{chData.registeredAddress}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    To change address officially, use Companies House WebFiling at
                    <a href="https://www.gov.uk/file-changes-to-a-company-with-companies-house" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 hover:underline">gov.uk</a>
                  </p>
                </CardContent>
              </Card>

              {/* Company Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Status & Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={STATUS_COLORS[chData.status] || ''}>{chData.status}</Badge>
                  </div>
                  {chData.raw?.nextAccounts && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Accounts Due</span>
                      <span className="font-medium">{new Date(chData.raw.nextAccounts).toLocaleDateString('en-GB')}</span>
                    </div>
                  )}
                  {chData.raw?.confirmationStatement && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confirmation Statement</span>
                      <span className="font-medium">{new Date(chData.raw.confirmationStatement).toLocaleDateString('en-GB')}</span>
                    </div>
                  )}
                  {chData.incorporationDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Incorporated</span>
                      <span className="font-medium">{new Date(chData.incorporationDate).toLocaleDateString('en-GB')}</span>
                    </div>
                  )}
                  {chData.sicCodes?.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">SIC Codes (Nature of Business)</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {chData.sicCodes.map((s: string) => <Badge key={s} variant="outline" className="font-mono text-xs">SIC {s}</Badge>)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Change SIC codes via
                        <a href="https://www.gov.uk/file-your-confirmation-statement-with-companies-house" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 hover:underline">Confirmation Statement</a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Officers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Active Officers ({activeOfficers.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeOfficers.map((o: any, i: number) => (
                    <div key={i} className="flex items-start justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{o.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{o.role?.replace(/-/g, ' ')}</p>
                        {o.nationality && <p className="text-xs text-muted-foreground">{o.nationality}{o.occupation ? ` · ${o.occupation}` : ''}</p>}
                      </div>
                      {o.appointedDate && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Since {new Date(o.appointedDate).toLocaleDateString('en-GB')}</span>
                      )}
                    </div>
                  ))}
                  {resignedOfficers.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground text-xs py-2">Former Officers ({resignedOfficers.length})</summary>
                      {resignedOfficers.map((o: any, i: number) => (
                        <div key={i} className="flex items-start justify-between py-1.5 text-muted-foreground opacity-60">
                          <div>
                            <p className="text-sm">{o.name}</p>
                            <p className="text-xs capitalize">{o.role?.replace(/-/g, ' ')}</p>
                          </div>
                          <span className="text-xs whitespace-nowrap">Resigned {o.resignedDate ? new Date(o.resignedDate).toLocaleDateString('en-GB') : ''}</span>
                        </div>
                      ))}
                    </details>
                  )}
                  <p className="text-xs text-muted-foreground pt-2">
                    Appoint/remove officers via
                    <a href="https://www.gov.uk/running-a-limited-company/appointing-directors" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 hover:underline">Companies House WebFiling</a>
                  </p>
                </CardContent>
              </Card>

              {/* Filing History */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Recent Filings</CardTitle>
                </CardHeader>
                <CardContent>
                  {chData.filings?.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {chData.filings.map((f: any, i: number) => (
                        <div key={i} className="flex items-start justify-between py-2 border-b last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{f.description}</p>
                            <p className="text-xs text-muted-foreground">{f.category} · {f.type}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {f.date ? new Date(f.date).toLocaleDateString('en-GB') : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No filings found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* === ACTIONS & FILINGS TAB === */}
      {activeTab === 'actions' && isCompany && (
        <div className="space-y-6">
          {/* Connection Status / Inline Connect */}
          {chConnection ? (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Companies House Connected</p>
                    <p className="text-xs text-muted-foreground">OAuth active — submit filings directly from here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/30">
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 mt-0.5">
                      <Link2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium text-sm">Connect to Companies House</p>
                        <p className="text-xs text-muted-foreground">
                          Enter your Authentication Code to enable filing. You&apos;ll briefly authenticate on the CH website, then return here.
                        </p>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1 max-w-[200px]">
                          <Label className="text-xs">Authentication Code</Label>
                          <Input
                            value={connectAuthCode}
                            onChange={e => setConnectAuthCode(e.target.value.toUpperCase())}
                            placeholder="e.g. A7BM62"
                            maxLength={6}
                            className="h-9"
                          />
                        </div>
                        <Button onClick={handleInlineConnect} disabled={connecting} size="sm" className="h-9">
                          {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                          Connect
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Company: {entity.companyNumber} · Auth Code is sent by post to your registered office</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* ── FILING ACTIONS (require OAuth) ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">File from HomeLedger</h3>

              {/* Change Registered Office */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><MapPin className="h-5 w-5 text-blue-600" /></div>
                      <div>
                        <p className="font-medium text-sm">Change Registered Address</p>
                        <p className="text-xs text-muted-foreground mt-0.5">AD01 — Free, instant</p>
                        {chData?.registeredAddress && <p className="text-xs mt-1">Current: {chData.registeredAddress}</p>}
                      </div>
                    </div>
                    <Button size="sm" disabled={!chConnection} onClick={() => { setFilingForm({ country: 'England' }); setFilingDialog('change_registered_office'); }}>
                      <Pencil className="h-3 w-3 mr-1" /> File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Appoint Director */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><UserPlus className="h-5 w-5 text-green-600" /></div>
                      <div>
                        <p className="font-medium text-sm">Appoint Director</p>
                        <p className="text-xs text-muted-foreground mt-0.5">AP01 — Free</p>
                      </div>
                    </div>
                    <Button size="sm" disabled={!chConnection} onClick={() => { setFilingForm({ consentToAct: true, sameAsService: true, serviceCountry: 'England' }); setFilingDialog('appoint_director'); }}>
                      <UserPlus className="h-3 w-3 mr-1" /> File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Terminate Director */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><UserMinus className="h-5 w-5 text-red-600" /></div>
                      <div>
                        <p className="font-medium text-sm">Remove Director</p>
                        <p className="text-xs text-muted-foreground mt-0.5">TM01 — Free</p>
                        {activeOfficers.length > 0 && <p className="text-xs mt-1">{activeOfficers.length} active officer(s)</p>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled={!chConnection} onClick={() => { setFilingForm({}); setFilingDialog('terminate_director'); }}>
                      <UserMinus className="h-3 w-3 mr-1" /> File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Confirmation Statement */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><FileCheck className="h-5 w-5 text-purple-600" /></div>
                      <div>
                        <p className="font-medium text-sm">Confirmation Statement</p>
                        <p className="text-xs text-muted-foreground mt-0.5">CS01 — £13 fee (paid via gov.uk after submission)</p>
                        {chData?.raw?.confirmationStatement && (
                          <p className="text-xs mt-1">Due: {new Date(chData.raw.confirmationStatement).toLocaleDateString('en-GB')}</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" disabled={!chConnection} onClick={() => { setFilingForm({ noUpdatesRequired: true }); setFilingDialog('confirmation_statement'); }}>
                      <FileCheck className="h-3 w-3 mr-1" /> File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Officer Details */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><PenLine className="h-5 w-5 text-amber-600" /></div>
                      <div>
                        <p className="font-medium text-sm">Change Director Details</p>
                        <p className="text-xs text-muted-foreground mt-0.5">CH01 — Free (name, address, nationality)</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled={!chConnection} onClick={() => { setFilingForm({}); setFilingDialog('change_officer_details'); }}>
                      <PenLine className="h-3 w-3 mr-1" /> File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── GOV.UK LINKS (require payment / WebFiling only) ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Complete on Gov.uk</h3>
              <p className="text-xs text-muted-foreground">These actions require payment or are only available via WebFiling.</p>

              {[
                { title: 'Change Company Name', desc: '£8 fee — Special Resolution required', fee: '£8', icon: Building2, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600', url: `https://www.gov.uk/file-changes-to-a-company-with-companies-house` },
                { title: 'File Annual Accounts', desc: 'Free — Must be filed within 9 months of year end', fee: 'Free', icon: FileText, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600', url: 'https://www.gov.uk/file-your-company-annual-accounts' },
                { title: 'Apply to Strike Off', desc: 'DS01 — £10 fee', fee: '£10', icon: AlertTriangle, color: 'bg-red-100 dark:bg-red-900/30 text-red-600', url: 'https://www.gov.uk/strike-off-your-company-from-companies-register' },
                { title: 'Register a Charge', desc: 'MR01 — Free within 21 days of creation', fee: 'Free', icon: Shield, color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600', url: 'https://www.gov.uk/guidance/register-a-charge-on-your-company' },
                { title: 'Allot Shares', desc: 'SH01 — Return of allotment', fee: 'Free', icon: TrendingUp, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600', url: 'https://www.gov.uk/running-a-limited-company/taking-money-out-of-a-limited-company' },
                { title: 'WebFiling Dashboard', desc: 'All available filings in one place', fee: '', icon: Globe, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', url: `https://ewf.companieshouse.gov.uk/runpage?page=webFilingIntro&company=${entity.companyNumber}` },
              ].map((action, i) => (
                <a key={i} href={action.url} target="_blank" rel="noopener noreferrer" className="block">
                  <Card className="hover:shadow-md transition-shadow hover:border-primary/30 cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${action.color}`}><action.icon className="h-5 w-5" /></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{action.title}</p>
                            <div className="flex items-center gap-2">
                              {action.fee && <Badge variant="outline" className="text-[10px]">{action.fee}</Badge>}
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FILING DIALOGS ── */}

      {/* Change Registered Office Dialog — with Postcode Lookup + Confirmation */}
      <Dialog open={filingDialog === 'change_registered_office'} onOpenChange={v => { if (!v) { setFilingDialog(null); setFilingStep('form'); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Change Registered Office (AD01)
              {filingStep === 'confirm' && <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">Review</Badge>}
            </DialogTitle>
            <DialogDescription>
              {filingStep === 'form'
                ? 'Search by postcode or enter the new address manually. This change takes effect immediately.'
                : 'Please review carefully before submitting. This will change your company\'s registered address on the public register.'}
            </DialogDescription>
          </DialogHeader>

          {filingStep === 'form' ? (
            <div className="space-y-3">
              {/* Current Address */}
              {chData?.registeredAddress && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Current Registered Address</p>
                  <p>{chData.registeredAddress}</p>
                </div>
              )}

              {/* Postcode Lookup */}
              <div>
                <Label className="font-semibold">Postcode Lookup</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={filingForm.postcode || ''}
                    onChange={e => setFilingForm((p: any) => ({ ...p, postcode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. TW7 7LA"
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && lookupPostcode(filingForm.postcode)}
                  />
                  <Button variant="outline" size="sm" onClick={() => lookupPostcode(filingForm.postcode)} disabled={postcodeLooking || !filingForm.postcode}>
                    {postcodeLooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    <span className="ml-1">Find</span>
                  </Button>
                </div>
              </div>

              {/* Address Selection Dropdown */}
              {postcodeAddresses.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-2 max-h-48 overflow-y-auto space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-1 mb-1">Select an address:</p>
                  {postcodeAddresses.map((addr: any, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectAddress(addr)}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                    >
                      {addr.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Address Fields */}
              <div className="border-t pt-3 space-y-3">
                <div><Label>Premises / Building Name</Label><Input value={filingForm.premises || ''} onChange={e => setFilingForm((p: any) => ({ ...p, premises: e.target.value }))} placeholder="e.g. Unit 5, Mill House" /></div>
                <div><Label>Address Line 1 *</Label><Input value={filingForm.addressLine1 || ''} onChange={e => setFilingForm((p: any) => ({ ...p, addressLine1: e.target.value }))} placeholder="e.g. 20 Harlequin Close" /></div>
                <div><Label>Address Line 2</Label><Input value={filingForm.addressLine2 || ''} onChange={e => setFilingForm((p: any) => ({ ...p, addressLine2: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>City / Town *</Label><Input value={filingForm.city || ''} onChange={e => setFilingForm((p: any) => ({ ...p, city: e.target.value }))} placeholder="London" /></div>
                  <div><Label>County / Region</Label><Input value={filingForm.region || ''} onChange={e => setFilingForm((p: any) => ({ ...p, region: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Postcode *</Label><Input value={filingForm.postcode || ''} onChange={e => setFilingForm((p: any) => ({ ...p, postcode: e.target.value.toUpperCase() }))} placeholder="SW1A 1AA" /></div>
                  <div><Label>Country</Label>
                    <Select value={filingForm.country || 'England'} onValueChange={v => setFilingForm((p: any) => ({ ...p, country: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="England">England</SelectItem>
                        <SelectItem value="Wales">Wales</SelectItem>
                        <SelectItem value="Scotland">Scotland</SelectItem>
                        <SelectItem value="Northern Ireland">Northern Ireland</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── CONFIRMATION STEP ── */
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Confirm Address Change</p>
                </div>
                <p className="text-sm text-muted-foreground mb-3">This will be submitted to Companies House and will change your company&apos;s registered address on the <strong>public register</strong>.</p>

                {chData?.registeredAddress && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground">FROM (current):</p>
                    <p className="text-sm line-through opacity-60">{chData.registeredAddress}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">TO (new):</p>
                  <p className="text-sm font-semibold">
                    {[filingForm.premises, filingForm.addressLine1, filingForm.addressLine2, filingForm.city, filingForm.region, filingForm.postcode, filingForm.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">What happens next:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Companies House processes the change immediately</li>
                    <li>• You will receive a confirmation email from CH</li>
                    <li>• The change is recorded in your entity history</li>
                    <li>• The public register is updated within minutes</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {filingStep === 'form' ? (
              <>
                <Button variant="ghost" onClick={() => setFilingDialog(null)}>Cancel</Button>
                <Button
                  onClick={() => setFilingStep('confirm')}
                  disabled={!filingForm.addressLine1 || !filingForm.city || !filingForm.postcode}
                >
                  Review Changes <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setFilingStep('form')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Edit
                </Button>
                <Button
                  onClick={() => submitFiling('change_registered_office', filingForm)}
                  disabled={filingSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {filingSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Confirm &amp; Submit to CH
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appoint Director Dialog */}
      <Dialog open={filingDialog === 'appoint_director'} onOpenChange={v => !v && setFilingDialog(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appoint Director (AP01)</DialogTitle>
            <DialogDescription>Submit new director appointment to Companies House.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Title</Label><Input value={filingForm.title || ''} onChange={e => setFilingForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="Mr" /></div>
              <div><Label>First Name *</Label><Input value={filingForm.firstName || ''} onChange={e => setFilingForm((p: any) => ({ ...p, firstName: e.target.value }))} /></div>
              <div><Label>Last Name *</Label><Input value={filingForm.lastName || ''} onChange={e => setFilingForm((p: any) => ({ ...p, lastName: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date of Birth *</Label><Input type="date" value={filingForm.dateOfBirth || ''} onChange={e => setFilingForm((p: any) => ({ ...p, dateOfBirth: e.target.value }))} /></div>
              <div><Label>Appointed On *</Label><Input type="date" value={filingForm.appointedOn || ''} onChange={e => setFilingForm((p: any) => ({ ...p, appointedOn: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nationality *</Label><Input value={filingForm.nationality || ''} onChange={e => setFilingForm((p: any) => ({ ...p, nationality: e.target.value }))} placeholder="British" /></div>
              <div><Label>Occupation</Label><Input value={filingForm.occupation || ''} onChange={e => setFilingForm((p: any) => ({ ...p, occupation: e.target.value }))} placeholder="Director" /></div>
            </div>
            <p className="text-xs font-medium text-muted-foreground pt-2">Service Address (public record)</p>
            <div><Label>Address Line 1 *</Label><Input value={filingForm.serviceAddressLine1 || ''} onChange={e => setFilingForm((p: any) => ({ ...p, serviceAddressLine1: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City *</Label><Input value={filingForm.serviceCity || ''} onChange={e => setFilingForm((p: any) => ({ ...p, serviceCity: e.target.value }))} /></div>
              <div><Label>Postcode *</Label><Input value={filingForm.servicePostcode || ''} onChange={e => setFilingForm((p: any) => ({ ...p, servicePostcode: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={filingForm.consentToAct || false} onCheckedChange={v => setFilingForm((p: any) => ({ ...p, consentToAct: v }))} />
              <Label className="text-sm">Director consents to act</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFilingDialog(null)}>Cancel</Button>
            <Button onClick={() => submitFiling('appoint_director', filingForm)} disabled={filingSubmitting || !filingForm.firstName || !filingForm.lastName || !filingForm.dateOfBirth || !filingForm.consentToAct}>
              {filingSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />} Submit to CH
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Director Dialog */}
      <Dialog open={filingDialog === 'terminate_director'} onOpenChange={v => !v && setFilingDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Director (TM01)</DialogTitle>
            <DialogDescription>Select the director to remove and the resignation date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {activeOfficers.length > 0 ? (
              <>
                <Label>Select Director</Label>
                <div className="space-y-2">
                  {activeOfficers.map((o: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${filingForm.officerName === o.name ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}
                      onClick={() => setFilingForm((p: any) => ({ ...p, officerName: o.name, officerId: o.name.toLowerCase().replace(/\s+/g, '-') }))}
                    >
                      <p className="font-medium text-sm">{o.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{o.role?.replace(/-/g, ' ')} · Since {o.appointedDate ? new Date(o.appointedDate).toLocaleDateString('en-GB') : 'N/A'}</p>
                    </div>
                  ))}
                </div>
                <div><Label>Resignation Date *</Label><Input type="date" value={filingForm.resignedOn || ''} onChange={e => setFilingForm((p: any) => ({ ...p, resignedOn: e.target.value }))} /></div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No active officers found. Refresh Companies House data first.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFilingDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => submitFiling('terminate_director', filingForm)} disabled={filingSubmitting || !filingForm.officerName || !filingForm.resignedOn}>
              {filingSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserMinus className="h-4 w-4 mr-2" />} Submit to CH
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Statement Dialog */}
      <Dialog open={filingDialog === 'confirmation_statement'} onOpenChange={v => !v && setFilingDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmation Statement (CS01)</DialogTitle>
            <DialogDescription>Confirm company details are correct. £13 fee payable via gov.uk after submission.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={filingForm.noUpdatesRequired ?? true} onCheckedChange={v => setFilingForm((p: any) => ({ ...p, noUpdatesRequired: v }))} />
              <Label className="text-sm">No changes required (all details are correct)</Label>
            </div>
            {!filingForm.noUpdatesRequired && (
              <div><Label>Updated SIC Codes (comma-separated)</Label><Input value={filingForm.sicCodes || ''} onChange={e => setFilingForm((p: any) => ({ ...p, sicCodes: e.target.value }))} placeholder="62020, 70229" /></div>
            )}
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1"><CreditCard className="h-3 w-3" /> A £13 fee will be payable on Companies House WebFiling after this submission is processed.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFilingDialog(null)}>Cancel</Button>
            <Button onClick={() => submitFiling('confirmation_statement', { ...filingForm, sicCodes: filingForm.sicCodes?.split(',').map((s: string) => s.trim()).filter(Boolean) })} disabled={filingSubmitting}>
              {filingSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCheck className="h-4 w-4 mr-2" />} Submit to CH
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Officer Details Dialog */}
      <Dialog open={filingDialog === 'change_officer_details'} onOpenChange={v => !v && setFilingDialog(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Director Details (CH01)</DialogTitle>
            <DialogDescription>Update name, address, nationality, or occupation of an existing director.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {activeOfficers.length > 0 && (
              <>
                <Label>Select Director</Label>
                <div className="space-y-2">
                  {activeOfficers.map((o: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${filingForm.officerName === o.name ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}
                      onClick={() => setFilingForm((p: any) => ({ ...p, officerName: o.name, officerId: o.name.toLowerCase().replace(/\s+/g, '-') }))}
                    >
                      <p className="font-medium text-sm">{o.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{o.role?.replace(/-/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={filingForm.newServiceAddress || false} onCheckedChange={v => setFilingForm((p: any) => ({ ...p, newServiceAddress: v }))} />
              <Label className="text-sm">Change service address</Label>
            </div>
            {filingForm.newServiceAddress && (
              <div className="space-y-2 pl-4 border-l-2">
                <div><Label>Address Line 1</Label><Input value={filingForm.serviceAddressLine1 || ''} onChange={e => setFilingForm((p: any) => ({ ...p, serviceAddressLine1: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>City</Label><Input value={filingForm.serviceCity || ''} onChange={e => setFilingForm((p: any) => ({ ...p, serviceCity: e.target.value }))} /></div>
                  <div><Label>Postcode</Label><Input value={filingForm.servicePostcode || ''} onChange={e => setFilingForm((p: any) => ({ ...p, servicePostcode: e.target.value }))} /></div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>New Nationality</Label><Input value={filingForm.newNationality || ''} onChange={e => setFilingForm((p: any) => ({ ...p, newNationality: e.target.value }))} placeholder="Leave blank if unchanged" /></div>
              <div><Label>New Occupation</Label><Input value={filingForm.newOccupation || ''} onChange={e => setFilingForm((p: any) => ({ ...p, newOccupation: e.target.value }))} placeholder="Leave blank if unchanged" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFilingDialog(null)}>Cancel</Button>
            <Button onClick={() => submitFiling('change_officer_details', filingForm)} disabled={filingSubmitting || !filingForm.officerName}>
              {filingSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenLine className="h-4 w-4 mr-2" />} Submit to CH
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === HISTORY & DOCS TAB === */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">History & Documents</h2>
              <p className="text-sm text-muted-foreground">{historyTotal} entries · Timeline of events, correspondence, and documents</p>
            </div>
            <Button onClick={() => setShowAddHistory(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Entry
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', icon: History },
              { key: 'note', label: 'Notes', icon: FileText },
              { key: 'correspondence', label: 'Letters', icon: Mail },
              { key: 'filing', label: 'Filings', icon: FileCheck },
              { key: 'document', label: 'Documents', icon: File },
              { key: 'officer_change', label: 'Officers', icon: Users },
              { key: 'address_change', label: 'Address', icon: MapPin },
              { key: 'deadline', label: 'Deadlines', icon: Calendar },
              { key: 'financial', label: 'Financial', icon: TrendingUp },
              { key: 'legal', label: 'Legal', icon: Scale },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setHistoryFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  historyFilter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <f.icon className="h-3 w-3" /> {f.label}
              </button>
            ))}
          </div>

          {/* Add Entry Form */}
          {showAddHistory && (
            <Card className="border-primary/30">
              <CardContent className="pt-5 space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={historyForm.type} onValueChange={v => setHistoryForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="correspondence">Correspondence / Letter</SelectItem>
                        <SelectItem value="filing">Filing / Submission</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="officer_change">Officer Change</SelectItem>
                        <SelectItem value="address_change">Address Change</SelectItem>
                        <SelectItem value="deadline">Deadline / Due Date</SelectItem>
                        <SelectItem value="financial">Financial Event</SelectItem>
                        <SelectItem value="legal">Legal / Compliance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input type="date" className="h-9" value={historyForm.date} onChange={e => setHistoryForm(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Tags (comma-separated)</Label>
                    <Input className="h-9" placeholder="e.g. hmrc, urgent" value={historyForm.tags} onChange={e => setHistoryForm(p => ({ ...p, tags: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Title *</Label>
                  <Input placeholder="e.g. Auth Code letter received from CH" value={historyForm.title} onChange={e => setHistoryForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Description / Notes</Label>
                  <Textarea rows={3} placeholder="Details about this event..." value={historyForm.description} onChange={e => setHistoryForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddHistory(false)}>Cancel</Button>
                  <Button size="sm" onClick={submitHistory} disabled={historySubmitting}>
                    {historySubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Save Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historyEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No history entries yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add notes, track correspondence, log filings, and upload documents to keep a complete record.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddHistory(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-1">
                {historyEntries.map((entry: any) => {
                  const typeConfig: Record<string, { icon: any; color: string }> = {
                    note: { icon: FileText, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' },
                    correspondence: { icon: Mail, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' },
                    filing: { icon: FileCheck, color: 'bg-green-100 text-green-600 dark:bg-green-900/30' },
                    document: { icon: File, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' },
                    officer_change: { icon: Users, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30' },
                    address_change: { icon: MapPin, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' },
                    deadline: { icon: Calendar, color: 'bg-red-100 text-red-600 dark:bg-red-900/30' },
                    financial: { icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' },
                    legal: { icon: Scale, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' },
                    other: { icon: Circle, color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30' },
                  };
                  const config = typeConfig[entry.type] || typeConfig.other;
                  const Icon = config.icon;

                  return (
                    <div key={entry.id} className="relative pl-12 py-3">
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 top-4 p-1.5 rounded-full ${config.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <Card className={entry.isPinned ? 'border-amber-300 dark:border-amber-700' : ''}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {entry.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                                <span className="font-medium text-sm">{entry.title}</span>
                                <Badge variant="outline" className="text-[10px] py-0">{entry.type.replace('_', ' ')}</Badge>
                              </div>
                              {entry.description && (
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{entry.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {entry.tags?.length > 0 && entry.tags.map((tag: string) => (
                                  <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5">{tag}</Badge>
                                ))}
                                {entry.fileName && (
                                  <span className="flex items-center gap-1 text-primary">
                                    <File className="h-3 w-3" /> {entry.fileName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(entry)} title={entry.isPinned ? 'Unpin' : 'Pin'}>
                                {entry.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteHistory(entry.id)} title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === AI REPORT TAB === */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">AI Company Report</h2>
            <Button variant="outline" size="sm" onClick={generateReport} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {aiReport ? 'Regenerate' : 'Generate Report'}
            </Button>
          </div>

          {generating ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Generating comprehensive company report...</p>
              </CardContent>
            </Card>
          ) : aiReport ? (
            <Card>
              <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Generate a Company Report</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  AI will analyse your entity data and Companies House records to create a comprehensive report with compliance status, deadlines, and recommendations.
                </p>
                <Button onClick={generateReport}>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate Report
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
