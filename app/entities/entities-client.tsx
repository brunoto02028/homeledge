'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Building2, User, Plus, Pencil, Trash2, Search, Loader2, Star, MapPin, FileText, Calendar, Shield, Landmark, CheckCircle, LayoutGrid, List, Circle, AlertTriangle, Image, Wand2, X, RefreshCw, Users, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

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
  _count: { bankStatements: number; accounts: number };
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  limited_company: 'Limited Company',
  llp: 'LLP',
  sole_trader: 'Sole Trader',
  partnership: 'Partnership',
  individual: 'Individual',
};

const TAX_REGIME_LABELS: Record<string, string> = {
  corporation_tax: 'Corporation Tax (CT600)',
  self_assessment: 'Self Assessment (SA100/SA103)',
  both: 'Both',
};

const ENTITY_TYPE_ICONS: Record<string, React.ReactNode> = {
  limited_company: <Building2 className="h-6 w-6" />,
  llp: <Building2 className="h-6 w-6" />,
  sole_trader: <User className="h-6 w-6" />,
  partnership: <Building2 className="h-6 w-6" />,
  individual: <User className="h-6 w-6" />,
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  limited_company: '#3b82f6',
  llp: '#8b5cf6',
  sole_trader: '#f59e0b',
  partnership: '#10b981',
  individual: '#6366f1',
};

const COMPANY_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  active: { color: 'text-green-600', bg: 'bg-green-500', label: 'Active', dot: 'bg-green-500 shadow-green-500/50' },
  dissolved: { color: 'text-red-600', bg: 'bg-red-500', label: 'Dissolved', dot: 'bg-red-500 shadow-red-500/50' },
  dormant: { color: 'text-amber-600', bg: 'bg-amber-500', label: 'Dormant', dot: 'bg-amber-500 shadow-amber-500/50' },
  liquidation: { color: 'text-red-600', bg: 'bg-red-500', label: 'Liquidation', dot: 'bg-red-500 shadow-red-500/50' },
  administration: { color: 'text-orange-600', bg: 'bg-orange-500', label: 'Administration', dot: 'bg-orange-500 shadow-orange-500/50' },
  'voluntary-arrangement': { color: 'text-orange-600', bg: 'bg-orange-500', label: 'Voluntary Arrangement', dot: 'bg-orange-500 shadow-orange-500/50' },
  'converted-closed': { color: 'text-gray-500', bg: 'bg-gray-500', label: 'Converted/Closed', dot: 'bg-gray-400 shadow-gray-400/50' },
  open: { color: 'text-green-600', bg: 'bg-green-500', label: 'Open', dot: 'bg-green-500 shadow-green-500/50' },
};

const getStatusConfig = (status: string | null, type: string) => {
  if (!status && (type === 'individual' || type === 'sole_trader')) {
    return { color: 'text-green-600', bg: 'bg-green-500', label: 'Active', dot: 'bg-green-500 shadow-green-500/50' };
  }
  return COMPANY_STATUS_CONFIG[status || ''] || { color: 'text-gray-500', bg: 'bg-gray-400', label: status || 'Unknown', dot: 'bg-gray-400 shadow-gray-400/50' };
};

const isEntityOperational = (entity: Entity) => {
  const status = entity.companyStatus?.toLowerCase() || '';
  if (entity.type === 'individual' || entity.type === 'sole_trader') return true;
  return status === 'active' || status === 'open' || status === '';
};

const emptyForm = {
  name: '',
  tradingName: '',
  type: 'limited_company',
  companyNumber: '',
  utr: '',
  vatNumber: '',
  isVatRegistered: false,
  niNumber: '',
  registeredAddress: '',
  tradingAddress: '',
  accountingBasis: 'accruals',
  notes: '',
  logoUrl: '',
};

export default function EntitiesClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntity, setEditEntity] = useState<Entity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  // Companies House search
  const [chSearch, setChSearch] = useState('');
  const [chSearching, setChSearching] = useState(false);
  const [chResults, setChResults] = useState<any[]>([]);
  const [chLoading, setChLoading] = useState(false);
  const [chDebounce, setChDebounce] = useState<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [logoPrompt, setLogoPrompt] = useState('');
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // CH Live Data
  const [chLiveData, setChLiveData] = useState<Record<string, any>>({});
  const [chLiveLoading, setChLiveLoading] = useState<string | null>(null);
  const [chExpanded, setChExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchChLiveData = async (entityId: string, companyNumber: string) => {
    if (chLiveData[entityId] && chExpanded === entityId) {
      setChExpanded(null);
      return;
    }
    if (chLiveData[entityId]) {
      setChExpanded(entityId);
      return;
    }
    setChLiveLoading(entityId);
    setChExpanded(entityId);
    try {
      const res = await fetch(`/api/entities/companies-house?number=${encodeURIComponent(companyNumber)}`);
      if (res.ok) {
        const data = await res.json();
        setChLiveData(prev => ({ ...prev, [entityId]: data }));
      } else {
        toast({ title: 'CH Error', description: 'Could not fetch Companies House data', variant: 'destructive' });
        setChExpanded(null);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to reach Companies House', variant: 'destructive' });
      setChExpanded(null);
    } finally {
      setChLiveLoading(null);
    }
  };

  const refreshChData = async (entityId: string, companyNumber: string) => {
    setChLiveLoading(entityId);
    try {
      const res = await fetch(`/api/entities/companies-house?number=${encodeURIComponent(companyNumber)}`);
      if (res.ok) {
        const data = await res.json();
        setChLiveData(prev => ({ ...prev, [entityId]: data }));
        toast({ title: 'Refreshed', description: 'Companies House data updated' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setChLiveLoading(null);
    }
  };

  const fetchEntities = async () => {
    try {
      const res = await fetch('/api/entities');
      if (res.ok) {
        const data = await res.json();
        setEntities(data);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntities(); }, []);

  const openCreateDialog = (type?: string) => {
    setEditEntity(null);
    setForm({ ...emptyForm, type: type || 'limited_company' });
    setChResults([]);
    setChSearch('');
    setDialogOpen(true);
  };

  const openEditDialog = (entity: Entity) => {
    setEditEntity(entity);
    setForm({
      name: entity.name,
      tradingName: entity.tradingName || '',
      type: entity.type,
      companyNumber: entity.companyNumber || '',
      utr: entity.utr || '',
      vatNumber: entity.vatNumber || '',
      isVatRegistered: entity.isVatRegistered,
      niNumber: entity.niNumber || '',
      registeredAddress: entity.registeredAddress || '',
      tradingAddress: entity.tradingAddress || '',
      accountingBasis: entity.accountingBasis || 'accruals',
      notes: entity.notes || '',
      logoUrl: entity.logoUrl || '',
    });
    setChResults([]);
    setDialogOpen(true);
  };

  // Companies House lookup by number
  const lookupCompany = async (companyNumber: string) => {
    if (!companyNumber || companyNumber.length < 6) return;
    setChLoading(true);
    try {
      const res = await fetch(`/api/entities/companies-house?number=${encodeURIComponent(companyNumber)}`);
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          name: data.name || prev.name,
          companyNumber: data.companyNumber || prev.companyNumber,
          type: data.entityType || prev.type,
          registeredAddress: data.registeredAddress || prev.registeredAddress,
        }));
        toast({ title: 'Company Found', description: `${data.name} - ${data.status}` });
      } else {
        const err = await res.json();
        toast({ title: 'Not Found', description: err.error || 'Company not found', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not reach Companies House', variant: 'destructive' });
    } finally {
      setChLoading(false);
    }
  };

  // Companies House search by name
  const searchCompanies = async () => {
    if (!chSearch.trim()) return;
    setChSearching(true);
    try {
      const res = await fetch(`/api/entities/companies-house?q=${encodeURIComponent(chSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setChResults(data.results || []);
      } else {
        const err = await res.json();
        toast({ title: 'Search Error', description: err.error || err.hint || 'Search failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not search Companies House', variant: 'destructive' });
    } finally {
      setChSearching(false);
    }
  };

  // Auto-search as user types (debounced)
  const handleChSearchChange = (value: string) => {
    setChSearch(value);
    if (chDebounce) clearTimeout(chDebounce);
    if (value.trim().length >= 3) {
      const timeout = setTimeout(async () => {
        setChSearching(true);
        try {
          const res = await fetch(`/api/entities/companies-house?q=${encodeURIComponent(value)}`);
          if (res.ok) {
            const data = await res.json();
            setChResults(data.results || []);
          }
        } catch { /* ignore */ }
        setChSearching(false);
      }, 400);
      setChDebounce(timeout);
    } else {
      setChResults([]);
    }
  };

  // Full lookup when a search result is selected
  const selectCompanyResult = async (result: any) => {
    setChResults([]);
    setChSearch(result.name);
    setChLoading(true);
    try {
      // Do a full lookup by number to get officers, SIC, etc.
      const res = await fetch(`/api/entities/companies-house?number=${encodeURIComponent(result.companyNumber)}`);
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          name: data.name || result.name,
          companyNumber: data.companyNumber || result.companyNumber,
          type: data.entityType || result.entityType || prev.type,
          registeredAddress: data.registeredAddress || result.address || '',
        }));
        toast({
          title: 'Company Loaded',
          description: `${data.name} — ${data.status}${data.officers?.length ? ` — ${data.officers.length} officer(s)` : ''}${data.sicCodes?.length ? ` — SIC: ${data.sicCodes.join(', ')}` : ''}`,
        });
      } else {
        // Fallback to basic info from search
        setForm(prev => ({
          ...prev,
          name: result.name,
          companyNumber: result.companyNumber,
          type: result.entityType || prev.type,
          registeredAddress: result.address || '',
        }));
        toast({ title: 'Company Selected', description: result.name });
      }
    } catch {
      setForm(prev => ({
        ...prev,
        name: result.name,
        companyNumber: result.companyNumber,
        type: result.entityType || prev.type,
        registeredAddress: result.address || '',
      }));
    }
    setChLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = editEntity ? `/api/entities/${editEntity.id}` : '/api/entities';
      const method = editEntity ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: editEntity ? 'Entity Updated' : 'Entity Created' });
        setDialogOpen(false);
        fetchEntities();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/entities/${deleteId}`, { method: 'DELETE' });
      toast({ title: 'Entity Deleted' });
      fetchEntities();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await fetch(`/api/entities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      toast({ title: 'Default Entity Set' });
      fetchEntities();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const isCompanyType = form.type === 'limited_company' || form.type === 'llp';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('entities.title')}</h1>
          <p className="text-muted-foreground">{t('entities.subtitle')}</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border rounded-md overflow-hidden mr-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="rounded-none h-9 px-2.5" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-none h-9 px-2.5" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => openCreateDialog('individual')}>
            <User className="h-4 w-4 mr-2" /> Add Personal
          </Button>
          <Button onClick={() => openCreateDialog('limited_company')}>
            <Building2 className="h-4 w-4 mr-2" /> Add Company
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : entities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('entities.noEntities')}</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Add your companies (Ltd, LLP) for Companies House compliance, or personal profiles for HMRC Self Assessment.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => openCreateDialog('individual')}>
                <User className="h-4 w-4 mr-2" /> Add Personal Profile
              </Button>
              <Button onClick={() => openCreateDialog('limited_company')}>
                <Building2 className="h-4 w-4 mr-2" /> Add Company
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active entities first, then inactive */}
          {(() => {
            const active = entities.filter(e => isEntityOperational(e));
            const inactive = entities.filter(e => !isEntityOperational(e));
            const sorted = [...active, ...inactive];

            if (viewMode === 'list') {
              return (
                <div className="space-y-2">
                  {inactive.length > 0 && active.length > 0 && (
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">Active ({active.length})</p>
                  )}
                  {active.map((entity) => {
                    const sc = getStatusConfig(entity.companyStatus, entity.type);
                    return (
                      <div key={entity.id} className={`flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${entity.isDefault ? 'border-blue-300 shadow-sm' : ''} ${!isEntityOperational(entity) ? 'opacity-60' : ''}`}>
                        <div className="relative">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${ENTITY_TYPE_COLORS[entity.type] || '#6b7280'}20`, color: ENTITY_TYPE_COLORS[entity.type] || '#6b7280' }}>
                            {ENTITY_TYPE_ICONS[entity.type] || <Building2 className="h-5 w-5" />}
                          </div>
                          <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background shadow-sm ${sc.dot}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">{entity.name}</span>
                            {entity.isDefault && <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0 text-[10px] h-5">Default</Badge>}
                            {entity.tradingName && <span className="text-xs text-muted-foreground">t/a {entity.tradingName}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <Badge variant="outline" className="text-[10px] h-4 py-0" style={{ borderColor: `${ENTITY_TYPE_COLORS[entity.type]}40`, color: ENTITY_TYPE_COLORS[entity.type] }}>{ENTITY_TYPE_LABELS[entity.type]}</Badge>
                            {entity.companyNumber && <span className="font-mono">#{entity.companyNumber}</span>}
                            <span className={`flex items-center gap-1 ${sc.color}`}><Circle className="h-2 w-2 fill-current" />{sc.label}</span>
                            {entity.registeredAddress && <span className="truncate max-w-[200px]">{entity.registeredAddress}</span>}
                            <span>{TAX_REGIME_LABELS[entity.taxRegime]}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{entity._count.bankStatements} stmt</span>
                          <span>{entity._count.accounts} acc</span>
                        </div>
                        <div className="flex gap-1">
                          {!entity.isDefault && <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDefault(entity.id)} title="Set as default"><Star className="h-3.5 w-3.5" /></Button>}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(entity)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => setDeleteId(entity.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    );
                  })}
                  {inactive.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1 pt-3">History / Inactive ({inactive.length})</p>
                      {inactive.map((entity) => {
                        const sc = getStatusConfig(entity.companyStatus, entity.type);
                        return (
                          <div key={entity.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card/50 opacity-60 hover:opacity-80 transition-all">
                            <div className="relative">
                              <div className="p-2 rounded-lg" style={{ backgroundColor: `${ENTITY_TYPE_COLORS[entity.type] || '#6b7280'}10`, color: ENTITY_TYPE_COLORS[entity.type] || '#6b7280' }}>
                                {ENTITY_TYPE_ICONS[entity.type] || <Building2 className="h-5 w-5" />}
                              </div>
                              <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background shadow-sm ${sc.dot}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold truncate">{entity.name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <Badge variant="outline" className="text-[10px] h-4 py-0">{ENTITY_TYPE_LABELS[entity.type]}</Badge>
                                {entity.companyNumber && <span className="font-mono">#{entity.companyNumber}</span>}
                                <span className={`flex items-center gap-1 ${sc.color}`}><Circle className="h-2 w-2 fill-current" />{sc.label}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(entity)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => setDeleteId(entity.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              );
            }

            // Grid view
            return (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {active.map((entity) => {
                    const sc = getStatusConfig(entity.companyStatus, entity.type);
                    return (
                      <Card key={entity.id} className={entity.isDefault ? 'border-blue-300 shadow-md' : ''}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${ENTITY_TYPE_COLORS[entity.type] || '#6b7280'}20`, color: ENTITY_TYPE_COLORS[entity.type] || '#6b7280' }}>
                                  {ENTITY_TYPE_ICONS[entity.type] || <Building2 className="h-6 w-6" />}
                                </div>
                                <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm ${sc.dot}`} title={sc.label} />
                              </div>
                              <div>
                                <CardTitle className="text-lg leading-tight">{entity.name}</CardTitle>
                                {entity.tradingName && <p className="text-sm text-muted-foreground">t/a {entity.tradingName}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {!entity.isDefault && <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDefault(entity.id)} title="Set as default"><Star className="h-3.5 w-3.5" /></Button>}
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(entity)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => setDeleteId(entity.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 cursor-pointer" onClick={() => router.push(`/entities/${entity.id}`)}>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge style={{ backgroundColor: `${ENTITY_TYPE_COLORS[entity.type]}20`, color: ENTITY_TYPE_COLORS[entity.type], borderColor: `${ENTITY_TYPE_COLORS[entity.type]}40` }} variant="outline">
                              {ENTITY_TYPE_LABELS[entity.type] || entity.type}
                            </Badge>
                            {entity.isDefault && <Badge className="bg-muted text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800">Default</Badge>}
                            {entity.isVatRegistered && <Badge variant="outline" className="text-green-700 dark:text-green-400 border-border bg-green-50 dark:bg-green-950/30">VAT</Badge>}
                            <Badge variant="outline" className={`${sc.color} border-current/20`}>
                              <Circle className="h-2 w-2 fill-current mr-1" />{sc.label}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1.5 text-muted-foreground">
                            {entity.companyNumber && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                <span>Co. #{entity.companyNumber}</span>
                              </div>
                            )}
                            {entity.utr && (
                              <div className="flex items-center gap-2">
                                <Landmark className="h-3.5 w-3.5" />
                                <span>UTR: {entity.utr}</span>
                              </div>
                            )}
                            {entity.registeredAddress && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{entity.registeredAddress}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Shield className="h-3.5 w-3.5" />
                              <span>{TAX_REGIME_LABELS[entity.taxRegime] || entity.taxRegime}</span>
                            </div>
                          </div>
                          <div className="flex gap-4 pt-2 border-t text-sm">
                            <span className="text-muted-foreground">{entity._count.bankStatements} statements</span>
                            <span className="text-muted-foreground">{entity._count.accounts} accounts</span>
                          </div>

                          {/* CH Live Data Button */}
                          {entity.companyNumber && (
                            <div className="pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => fetchChLiveData(entity.id, entity.companyNumber!)}
                                disabled={chLiveLoading === entity.id}
                              >
                                {chLiveLoading === entity.id ? (
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                ) : (
                                  <Building2 className="h-3 w-3 mr-2" />
                                )}
                                Companies House Live
                                {chExpanded === entity.id ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                              </Button>

                              {chExpanded === entity.id && chLiveData[entity.id] && (
                                <div className="mt-3 space-y-3 text-sm">
                                  {/* Status + Refresh */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live from Companies House</span>
                                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    </div>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => refreshChData(entity.id, entity.companyNumber!)}>
                                        <RefreshCw className={`h-3 w-3 ${chLiveLoading === entity.id ? 'animate-spin' : ''}`} />
                                      </Button>
                                      <a href={`https://find-and-update.company-information.service.gov.uk/company/${entity.companyNumber}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="sm" className="h-7 px-2">
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </a>
                                    </div>
                                  </div>

                                  {/* Registered Address */}
                                  <div className="rounded-lg border p-3 space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                      <MapPin className="h-3 w-3" /> Registered Office
                                    </div>
                                    <p className="text-sm">{chLiveData[entity.id].registeredAddress || 'Not available'}</p>
                                  </div>

                                  {/* Officers */}
                                  {chLiveData[entity.id].officers?.length > 0 && (
                                    <div className="rounded-lg border p-3 space-y-2">
                                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <Users className="h-3 w-3" /> Active Officers ({chLiveData[entity.id].officers.length})
                                      </div>
                                      {chLiveData[entity.id].officers.map((o: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between py-1 border-b last:border-0">
                                          <div>
                                            <span className="font-medium text-sm">{o.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2 capitalize">{o.role?.replace(/-/g, ' ')}</span>
                                          </div>
                                          {o.appointedDate && (
                                            <span className="text-xs text-muted-foreground">Since {new Date(o.appointedDate).toLocaleDateString('en-GB')}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Key Dates */}
                                  <div className="rounded-lg border p-3 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                      <Clock className="h-3 w-3" /> Key Dates
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {chLiveData[entity.id].incorporationDate && (
                                        <div>
                                          <span className="text-muted-foreground">Incorporated:</span>
                                          <span className="ml-1 font-medium">{new Date(chLiveData[entity.id].incorporationDate).toLocaleDateString('en-GB')}</span>
                                        </div>
                                      )}
                                      {chLiveData[entity.id].raw?.nextAccounts && (
                                        <div>
                                          <span className="text-muted-foreground">Next Accounts:</span>
                                          <span className="ml-1 font-medium">{new Date(chLiveData[entity.id].raw.nextAccounts).toLocaleDateString('en-GB')}</span>
                                        </div>
                                      )}
                                      {chLiveData[entity.id].raw?.confirmationStatement && (
                                        <div>
                                          <span className="text-muted-foreground">Confirmation Stmt:</span>
                                          <span className="ml-1 font-medium">{new Date(chLiveData[entity.id].raw.confirmationStatement).toLocaleDateString('en-GB')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* SIC Codes */}
                                  {chLiveData[entity.id].sicCodes?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {chLiveData[entity.id].sicCodes.map((sic: string) => (
                                        <Badge key={sic} variant="outline" className="text-[10px] font-mono">SIC {sic}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {inactive.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">History / Inactive ({inactive.length})</p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {inactive.map((entity) => {
                        const sc = getStatusConfig(entity.companyStatus, entity.type);
                        return (
                          <Card key={entity.id} className="opacity-60 hover:opacity-80 transition-opacity">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${ENTITY_TYPE_COLORS[entity.type] || '#6b7280'}10`, color: ENTITY_TYPE_COLORS[entity.type] || '#6b7280' }}>
                                      {ENTITY_TYPE_ICONS[entity.type] || <Building2 className="h-6 w-6" />}
                                    </div>
                                    <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm ${sc.dot}`} title={sc.label} />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg leading-tight">{entity.name}</CardTitle>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(entity)}><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => setDeleteId(entity.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline">{ENTITY_TYPE_LABELS[entity.type]}</Badge>
                                <Badge variant="outline" className={`${sc.color} border-current/20`}>
                                  <Circle className="h-2 w-2 fill-current mr-1" />{sc.label}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {entity.companyNumber && <span className="font-mono">Co. #{entity.companyNumber}</span>}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* Create/Edit Entity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEntity ? 'Edit Entity' : 'Add Entity'}</DialogTitle>
            <DialogDescription>
              {isCompanyType ? 'Register a UK company. Search Companies House to auto-fill.' : 'Add a personal or sole trader profile for HMRC.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Entity Type */}
            <div>
              <Label>Entity Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limited_company">Limited Company (Ltd)</SelectItem>
                  <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                  <SelectItem value="sole_trader">Sole Trader</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="individual">Individual (Personal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Companies House Search (for company types) */}
            {isCompanyType && !editEntity && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <Search className="h-4 w-4" /> Companies House Lookup
                </p>
                <div className="relative">
                  <Input
                    value={chSearch}
                    onChange={(e) => handleChSearchChange(e.target.value)}
                    placeholder="Start typing a company name or number..."
                    onKeyDown={(e) => e.key === 'Enter' && searchCompanies()}
                  />
                  {(chSearching || chLoading) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                {chResults.length > 0 && (
                  <div className="bg-popover rounded-lg border shadow-lg max-h-48 overflow-y-auto">
                    {chResults.map((r, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-b last:border-b-0 text-sm transition-colors"
                        onClick={() => selectCompanyResult(r)}
                      >
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{r.companyNumber}</span>
                          <span>•</span>
                          <Badge variant="outline" className={`text-[10px] py-0 h-4 ${r.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                            {r.status}
                          </Badge>
                          {r.address && <><span>•</span><span className="truncate">{r.address}</span></>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">Results auto-fill company name, number, address, officers and SIC codes</p>
              </div>
            )}

            {/* Name */}
            <div>
              <Label>{isCompanyType ? 'Company Name' : 'Full Name'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isCompanyType ? 'e.g., ABC Holdings Ltd' : 'Your full name'}
                  className="flex-1"
                />
                {isCompanyType && form.companyNumber && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => lookupCompany(form.companyNumber)}
                    disabled={chLoading}
                  >
                    {chLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>

            {form.type === 'sole_trader' && (
              <div>
                <Label>Trading Name (optional)</Label>
                <Input
                  value={form.tradingName}
                  onChange={(e) => setForm(prev => ({ ...prev, tradingName: e.target.value }))}
                  placeholder="e.g., My Trading Name"
                  className="mt-1"
                />
              </div>
            )}

            {/* Company Number */}
            {isCompanyType && (
              <div>
                <Label>Company Number</Label>
                <Input
                  value={form.companyNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, companyNumber: e.target.value }))}
                  placeholder="e.g., 12345678"
                  className="mt-1"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* UTR — show for companies and sole traders, NOT for individual */}
              {form.type !== 'individual' && (
                <div>
                  <Label>UTR (Unique Taxpayer Reference)</Label>
                  <Input
                    value={form.utr}
                    onChange={(e) => setForm(prev => ({ ...prev, utr: e.target.value }))}
                    placeholder="10 digits"
                    maxLength={10}
                    className="mt-1"
                  />
                </div>
              )}

              {/* NI Number (personal/sole trader) */}
              {(form.type === 'individual' || form.type === 'sole_trader') && (
                <div>
                  <Label>NI Number</Label>
                  <Input
                    value={form.niNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, niNumber: e.target.value }))}
                    placeholder="e.g., AB123456C"
                    className="mt-1"
                  />
                </div>
              )}

              {/* VAT */}
              {isCompanyType && (
                <div>
                  <Label>VAT Number (if registered)</Label>
                  <Input
                    value={form.vatNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, vatNumber: e.target.value, isVatRegistered: !!e.target.value }))}
                    placeholder="GB123456789"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <Label>{isCompanyType ? 'Registered Address' : 'Address'}</Label>
              <Input
                value={form.registeredAddress}
                onChange={(e) => setForm(prev => ({ ...prev, registeredAddress: e.target.value }))}
                placeholder="Full address"
                className="mt-1"
              />
            </div>

            {/* Accounting Basis */}
            <div>
              <Label>Accounting Basis</Label>
              <Select value={form.accountingBasis} onValueChange={(v) => setForm(prev => ({ ...prev, accountingBasis: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accruals">Accruals Basis</SelectItem>
                  <SelectItem value="cash">Cash Basis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logo */}
            <div>
              <Label>Logo</Label>
              <div className="mt-1 space-y-2">
                {form.logoUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={form.logoUrl} alt="Logo" className="h-16 w-16 object-contain border rounded-lg bg-white" />
                    <Button variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, logoUrl: '' }))}>
                      <X className="h-4 w-4 text-red-500 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <label className="cursor-pointer flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingLogo(true);
                            try {
                              const presignedRes = await fetch('/api/upload/presigned', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
                              });
                              if (presignedRes.ok) {
                                const { uploadUrl, cloudStoragePath } = await presignedRes.json();
                                await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
                                const getUrlRes = await fetch('/api/upload/get-url', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ cloudStoragePath, isPublic: true }),
                                });
                                if (getUrlRes.ok) {
                                  const { url } = await getUrlRes.json();
                                  setForm(prev => ({ ...prev, logoUrl: url }));
                                  toast({ title: 'Logo Uploaded' });
                                }
                              }
                            } catch (err) {
                              console.error('Logo upload error:', err);
                              toast({ title: 'Upload Failed', variant: 'destructive' });
                            } finally {
                              setUploadingLogo(false);
                            }
                          }}
                        />
                        <Button variant="outline" className="w-full" disabled={uploadingLogo} asChild>
                          <span>
                            {uploadingLogo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Image className="h-4 w-4 mr-2" />}
                            Upload Logo
                          </span>
                        </Button>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={logoPrompt}
                        onChange={(e) => setLogoPrompt(e.target.value)}
                        placeholder="Describe your logo (e.g., modern blue tech logo)..."
                        className="flex-1 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={generatingLogo || !logoPrompt.trim()}
                        onClick={async () => {
                          setGeneratingLogo(true);
                          try {
                            const res = await fetch('/api/ai/generate-logo', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                prompt: logoPrompt,
                                entityId: editEntity?.id || undefined,
                                style: 'modern',
                              }),
                            });
                            const data = await res.json();
                            if (data.success && data.logoUrl) {
                              setForm(prev => ({ ...prev, logoUrl: data.logoUrl }));
                              toast({ title: 'Logo Generated', description: 'AI-generated logo applied.' });
                            } else {
                              toast({ title: 'Generation Info', description: data.message || data.suggestion || 'Could not generate image. Try uploading instead.', variant: 'default' });
                            }
                          } catch (err) {
                            console.error('Logo gen error:', err);
                            toast({ title: 'Error', description: 'Failed to generate logo', variant: 'destructive' });
                          } finally {
                            setGeneratingLogo(false);
                          }
                        }}
                      >
                        {generatingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Upload an image or describe your logo for AI generation</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="mt-1"
              />
            </div>

            {/* Tax Regime Info */}
            <div className="bg-muted/50 border rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 font-medium mb-1">
                <Shield className="h-4 w-4" />
                Tax Regime: {TAX_REGIME_LABELS[isCompanyType ? 'corporation_tax' : 'self_assessment']}
              </div>
              <p className="text-muted-foreground">
                {isCompanyType
                  ? 'Statements uploaded for this entity will use Corporation Tax (CT600) categories and Companies House reporting.'
                  : 'Statements uploaded for this entity will use HMRC Self Assessment (SA103) categories and tax deductions.'
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editEntity ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the entity. Linked statements and accounts will be unlinked but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
