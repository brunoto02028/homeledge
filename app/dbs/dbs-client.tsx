'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Shield, Plus, FileText, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Send, Trash2, Edit, Eye, User,
  MapPin, Briefcase, CreditCard, Info, Loader2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type Tab = 'dashboard' | 'new' | 'view';
type CheckType = 'basic' | 'standard' | 'enhanced' | 'enhanced_barred';

interface DbsApp {
  id: string;
  checkType: string;
  workforce: string | null;
  title: string | null;
  firstName: string;
  middleNames: string | null;
  lastName: string;
  previousNames: any;
  dateOfBirth: string;
  placeOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  countryOfBirth: string | null;
  email: string;
  phone: string | null;
  niNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
  addressFrom: string | null;
  previousAddresses: any;
  organisationName: string | null;
  roleTitle: string | null;
  roleStartDate: string | null;
  status: string;
  certificateNumber: string | null;
  issueDate: string | null;
  cost: number | null;
  chargedAmount: number | null;
  paid: boolean;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  notes: string | null;
}

const CHECK_TYPES: { id: CheckType; name: string; price: string; description: string; icon: string }[] = [
  { id: 'basic', name: 'Basic DBS', price: '£23.40', description: 'Shows unspent convictions and conditional cautions. For any type of role.', icon: '🔍' },
  { id: 'standard', name: 'Standard DBS', price: '£33.80', description: 'Shows spent and unspent convictions, cautions, reprimands, and warnings.', icon: '📋' },
  { id: 'enhanced', name: 'Enhanced DBS', price: '£57.20', description: 'Standard check plus any relevant police information. For roles with children or vulnerable adults.', icon: '🛡️' },
  { id: 'enhanced_barred', name: 'Enhanced + Barred List', price: '£70.20', description: 'Enhanced check plus barred list check. Required for regulated activities.', icon: '⚠️' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30', icon: Edit },
  submitted: { label: 'Submitted', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Send },
  processing: { label: 'Processing', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: Clock },
  awaiting_id: { label: 'Awaiting ID', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: AlertTriangle },
  completed: { label: 'Completed', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30', icon: XCircle },
};

const FORM_STEPS_EN = ['Check Type', 'Personal Details', 'Address History', 'Employment', 'Review & Submit'];
const FORM_STEPS_PT = ['Tipo de Verificação', 'Dados Pessoais', 'Histórico de Endereços', 'Emprego', 'Revisar e Enviar'];

export function DbsClient() {
  const { locale } = useTranslation();
  const isPt = locale === 'pt-BR';
  const FORM_STEPS = isPt ? FORM_STEPS_PT : FORM_STEPS_EN;
  const [tab, setTab] = useState<Tab>('dashboard');
  const [applications, setApplications] = useState<DbsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewApp, setViewApp] = useState<DbsApp | null>(null);

  // Form state
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    checkType: '' as string,
    workforce: '',
    title: '',
    firstName: '',
    middleNames: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    gender: '',
    nationality: 'British',
    countryOfBirth: 'United Kingdom',
    email: '',
    phone: '',
    niNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
    addressFrom: '',
    previousAddresses: [] as any[],
    organisationName: '',
    roleTitle: '',
    roleStartDate: '',
    notes: '',
  });

  // Previous address being added
  const [prevAddr, setPrevAddr] = useState({ line1: '', line2: '', city: '', county: '', postcode: '', country: 'United Kingdom', from: '', to: '' });

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/dbs');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addPreviousAddress = () => {
    if (!prevAddr.line1 || !prevAddr.city || !prevAddr.postcode || !prevAddr.from || !prevAddr.to) return;
    setForm(prev => ({ ...prev, previousAddresses: [...prev.previousAddresses, { ...prevAddr }] }));
    setPrevAddr({ line1: '', line2: '', city: '', county: '', postcode: '', country: 'United Kingdom', from: '', to: '' });
  };

  const removePreviousAddress = (idx: number) => {
    setForm(prev => ({ ...prev, previousAddresses: prev.previousAddresses.filter((_: any, i: number) => i !== idx) }));
  };

  const resetForm = () => {
    setForm({
      checkType: '', workforce: '', title: '', firstName: '', middleNames: '', lastName: '',
      dateOfBirth: '', placeOfBirth: '', gender: '', nationality: 'British', countryOfBirth: 'United Kingdom',
      email: '', phone: '', niNumber: '', addressLine1: '', addressLine2: '', city: '', county: '',
      postcode: '', country: 'United Kingdom', addressFrom: '', previousAddresses: [],
      organisationName: '', roleTitle: '', roleStartDate: '', notes: '',
    });
    setStep(0);
  };

  const saveApplication = async (submit = false) => {
    setSaving(true);
    try {
      const res = await fetch('/api/dbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to save');
        setSaving(false);
        return;
      }
      const data = await res.json();

      // If submitting, update status
      if (submit && data.application?.id) {
        await fetch(`/api/dbs/${data.application.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'submitted' }),
        });
      }

      resetForm();
      setTab('dashboard');
      fetchApplications();
    } catch {
      alert('Failed to save application');
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/dbs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchApplications();
        if (viewApp?.id === id) {
          const data = await res.json();
          setViewApp(data.application);
        }
      }
    } catch { /* ignore */ }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm(isPt ? 'Excluir esta aplicação?' : 'Delete this application?')) return;
    try {
      await fetch(`/api/dbs/${id}`, { method: 'DELETE' });
      fetchApplications();
      if (viewApp?.id === id) {
        setViewApp(null);
        setTab('dashboard');
      }
    } catch { /* ignore */ }
  };

  const canGoNext = (): boolean => {
    if (step === 0) return !!form.checkType && (form.checkType === 'basic' || form.checkType === 'standard' || !!form.workforce);
    if (step === 1) return !!form.firstName && !!form.lastName && !!form.dateOfBirth && !!form.email;
    if (step === 2) return !!form.addressLine1 && !!form.city && !!form.postcode;
    if (step === 3) return true;
    return true;
  };

  // ── View Application ──
  if (tab === 'view' && viewApp) {
    const sc = STATUS_CONFIG[viewApp.status] || STATUS_CONFIG.draft;
    const StatusIcon = sc.icon;
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              {isPt ? 'Aplicação DBS' : 'DBS Application'} — {viewApp.firstName} {viewApp.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${sc.color} border`}>
                <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {CHECK_TYPES.find(t => t.id === viewApp.checkType)?.name || viewApp.checkType}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => { setViewApp(null); setTab('dashboard'); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {isPt ? 'Voltar' : 'Back'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> {isPt ? 'Dados Pessoais' : 'Personal Details'}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="text-muted-foreground">{isPt ? 'Nome:' : 'Name:'}</span> {viewApp.title ? viewApp.title + ' ' : ''}{viewApp.firstName} {viewApp.middleNames ? viewApp.middleNames + ' ' : ''}{viewApp.lastName}</p>
              <p><span className="text-muted-foreground">{isPt ? 'Nascimento:' : 'DOB:'}</span> {new Date(viewApp.dateOfBirth).toLocaleDateString('en-GB')}</p>
              {viewApp.gender && <p><span className="text-muted-foreground">{isPt ? 'Gênero:' : 'Gender:'}</span> {viewApp.gender}</p>}
              {viewApp.nationality && <p><span className="text-muted-foreground">{isPt ? 'Nacionalidade:' : 'Nationality:'}</span> {viewApp.nationality}</p>}
              <p><span className="text-muted-foreground">Email:</span> {viewApp.email}</p>
              {viewApp.phone && <p><span className="text-muted-foreground">Phone:</span> {viewApp.phone}</p>}
              {viewApp.niNumber && <p><span className="text-muted-foreground">NI Number:</span> {viewApp.niNumber}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> {isPt ? 'Endereço Atual' : 'Current Address'}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{viewApp.addressLine1}</p>
              {viewApp.addressLine2 && <p>{viewApp.addressLine2}</p>}
              <p>{viewApp.city}{viewApp.county ? ', ' + viewApp.county : ''}</p>
              <p>{viewApp.postcode}</p>
              {viewApp.addressFrom && <p className="text-muted-foreground">{isPt ? 'Desde:' : 'Since:'} {new Date(viewApp.addressFrom).toLocaleDateString('en-GB')}</p>}
            </CardContent>
          </Card>

          {viewApp.organisationName && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4" /> {isPt ? 'Emprego' : 'Employment'}</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="text-muted-foreground">{isPt ? 'Organização:' : 'Organisation:'}</span> {viewApp.organisationName}</p>
                {viewApp.roleTitle && <p><span className="text-muted-foreground">{isPt ? 'Cargo:' : 'Role:'}</span> {viewApp.roleTitle}</p>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> {isPt ? 'Preço e Status' : 'Pricing & Status'}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {viewApp.chargedAmount != null && <p><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">£{viewApp.chargedAmount.toFixed(2)}</span></p>}
              <p><span className="text-muted-foreground">{isPt ? 'Pago:' : 'Paid:'}</span> {viewApp.paid ? (isPt ? '✅ Sim' : '✅ Yes') : (isPt ? '❌ Não' : '❌ No')}</p>
              {viewApp.certificateNumber && <p><span className="text-muted-foreground">Certificate:</span> {viewApp.certificateNumber}</p>}
              {viewApp.submittedAt && <p><span className="text-muted-foreground">Submitted:</span> {new Date(viewApp.submittedAt).toLocaleDateString('en-GB')}</p>}
              {viewApp.completedAt && <p><span className="text-muted-foreground">Completed:</span> {new Date(viewApp.completedAt).toLocaleDateString('en-GB')}</p>}
            </CardContent>
          </Card>
        </div>

        {viewApp.notes && (
          <Card>
            <CardContent className="pt-4 text-sm">
              <p className="text-muted-foreground mb-1">{isPt ? 'Observações:' : 'Notes:'}</p>
              <p>{viewApp.notes}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 pt-2">
          {viewApp.status === 'draft' && (
            <>
              <Button onClick={() => updateStatus(viewApp.id, 'submitted')}>
                <Send className="h-4 w-4 mr-1" /> {isPt ? 'Enviar Aplicação' : 'Submit Application'}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteApplication(viewApp.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> {isPt ? 'Excluir' : 'Delete'}
              </Button>
            </>
          )}
          {viewApp.status === 'submitted' && (
            <Button variant="outline" onClick={() => updateStatus(viewApp.id, 'cancelled')}>{isPt ? 'Cancelar Aplicação' : 'Cancel Application'}</Button>
          )}
          {(viewApp.status === 'cancelled' || viewApp.status === 'rejected') && (
            <Button variant="outline" onClick={() => updateStatus(viewApp.id, 'draft')}>{isPt ? 'Reabrir como Rascunho' : 'Reopen as Draft'}</Button>
          )}
        </div>
      </div>
    );
  }

  // ── New Application Form ──
  if (tab === 'new') {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> {isPt ? 'Nova Aplicação DBS' : 'New DBS Application'}
          </h2>
          <Button variant="outline" onClick={() => { resetForm(); setTab('dashboard'); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {isPt ? 'Cancelar' : 'Cancel'}
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {FORM_STEPS.map((s, i) => (
              <span key={i} className={i === step ? 'text-primary font-semibold' : i < step ? 'text-green-500' : ''}>{s}</span>
            ))}
          </div>
          <Progress value={((step + 1) / FORM_STEPS.length) * 100} className="h-1.5" />
        </div>

        {/* Step 0: Check Type */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{isPt ? 'Selecione o tipo de verificação DBS:' : 'Select the type of DBS check required:'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CHECK_TYPES.map(ct => (
                <Card
                  key={ct.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${form.checkType === ct.id ? 'border-primary ring-1 ring-primary/30' : ''}`}
                  onClick={() => updateForm('checkType', ct.id)}
                >
                  <CardContent className="pt-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{ct.icon} {ct.name}</span>
                      <Badge variant="secondary">{ct.price}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ct.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {(form.checkType === 'enhanced' || form.checkType === 'enhanced_barred') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{isPt ? 'Tipo de público *' : 'Workforce type *'}</label>
                <div className="flex gap-2">
                  {['child', 'adult', 'other'].map(w => (
                    <Button key={w} size="sm" variant={form.workforce === w ? 'default' : 'outline'} onClick={() => updateForm('workforce', w)}>
                      {w === 'child' ? '👶 Child' : w === 'adult' ? '🧑 Adult' : '📌 Other'}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={form.title} onChange={e => updateForm('title', e.target.value)}>
                  <option value="">-</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>
              <div className="col-span-3">
                <label className="text-xs font-medium text-muted-foreground">First Name *</label>
                <Input className="mt-1" value={form.firstName} onChange={e => updateForm('firstName', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Middle Names</label>
                <Input className="mt-1" value={form.middleNames} onChange={e => updateForm('middleNames', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Last Name *</label>
                <Input className="mt-1" value={form.lastName} onChange={e => updateForm('lastName', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date of Birth *</label>
                <Input type="date" className="mt-1" value={form.dateOfBirth} onChange={e => updateForm('dateOfBirth', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Gender</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={form.gender} onChange={e => updateForm('gender', e.target.value)}>
                  <option value="">-</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Place of Birth</label>
                <Input className="mt-1" placeholder="City/Town" value={form.placeOfBirth} onChange={e => updateForm('placeOfBirth', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nationality</label>
                <Input className="mt-1" value={form.nationality} onChange={e => updateForm('nationality', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email *</label>
                <Input type="email" className="mt-1" value={form.email} onChange={e => updateForm('email', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input className="mt-1" placeholder="+44..." value={form.phone} onChange={e => updateForm('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">National Insurance Number</label>
              <Input className="mt-1" placeholder="AB 12 34 56 C" value={form.niNumber} onChange={e => updateForm('niNumber', e.target.value.toUpperCase())} />
            </div>
          </div>
        )}

        {/* Step 2: Address History */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> {isPt ? 'Endereço Atual *' : 'Current Address *'}</h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Address Line 1 *</label>
                  <Input className="mt-1" value={form.addressLine1} onChange={e => updateForm('addressLine1', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Address Line 2</label>
                  <Input className="mt-1" value={form.addressLine2} onChange={e => updateForm('addressLine2', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">City *</label>
                  <Input className="mt-1" value={form.city} onChange={e => updateForm('city', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">County</label>
                  <Input className="mt-1" value={form.county} onChange={e => updateForm('county', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Postcode *</label>
                  <Input className="mt-1" value={form.postcode} onChange={e => updateForm('postcode', e.target.value.toUpperCase())} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Living here since</label>
                <Input type="date" className="mt-1 max-w-[200px]" value={form.addressFrom} onChange={e => updateForm('addressFrom', e.target.value)} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold">{isPt ? 'Endereços Anteriores (últimos 5 anos)' : 'Previous Addresses (last 5 years)'}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> {isPt ? 'DBS exige histórico completo de endereços dos últimos 5 anos' : 'DBS requires a full 5-year address history'}</p>

              {form.previousAddresses.length > 0 && (
                <div className="space-y-2">
                  {form.previousAddresses.map((addr: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded p-2 text-xs">
                      <span>{addr.line1}, {addr.city}, {addr.postcode} ({addr.from} — {addr.to})</span>
                      <Button size="sm" variant="ghost" onClick={() => removePreviousAddress(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}

              <Card className="border-dashed">
                <CardContent className="pt-3 space-y-2">
                  <p className="text-xs font-medium">{isPt ? 'Adicionar endereço anterior:' : 'Add previous address:'}</p>
                  <Input placeholder="Address Line 1" value={prevAddr.line1} onChange={e => setPrevAddr({ ...prevAddr, line1: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="City" value={prevAddr.city} onChange={e => setPrevAddr({ ...prevAddr, city: e.target.value })} />
                    <Input placeholder="County" value={prevAddr.county} onChange={e => setPrevAddr({ ...prevAddr, county: e.target.value })} />
                    <Input placeholder="Postcode" value={prevAddr.postcode} onChange={e => setPrevAddr({ ...prevAddr, postcode: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">From</label>
                      <Input type="date" value={prevAddr.from} onChange={e => setPrevAddr({ ...prevAddr, from: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">To</label>
                      <Input type="date" value={prevAddr.to} onChange={e => setPrevAddr({ ...prevAddr, to: e.target.value })} />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={addPreviousAddress}>
                    <Plus className="h-3 w-3 mr-1" /> {isPt ? 'Adicionar' : 'Add Address'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Employment */}
        {step === 3 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" /> {isPt ? 'Dados do Emprego (Opcional)' : 'Employment Details (Optional)'}</h3>
            <p className="text-xs text-muted-foreground">{isPt ? 'Se este DBS é para um cargo específico, informe os dados do empregador.' : 'If this DBS is for a specific role, provide the employer details.'}</p>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Organisation Name</label>
              <Input className="mt-1" value={form.organisationName} onChange={e => updateForm('organisationName', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role / Job Title</label>
                <Input className="mt-1" value={form.roleTitle} onChange={e => updateForm('roleTitle', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <Input type="date" className="mt-1" value={form.roleStartDate} onChange={e => updateForm('roleStartDate', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]"
                value={form.notes}
                onChange={e => updateForm('notes', e.target.value)}
                placeholder="Any additional information..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{isPt ? 'Revise sua Aplicação' : 'Review Your Application'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-3 text-sm space-y-1">
                  <p className="font-semibold text-xs text-muted-foreground uppercase">Check Type</p>
                  <p>{CHECK_TYPES.find(t => t.id === form.checkType)?.name}</p>
                  {form.workforce && <p className="text-xs text-muted-foreground">Workforce: {form.workforce}</p>}
                  <p className="font-semibold text-primary">{CHECK_TYPES.find(t => t.id === form.checkType)?.price}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 text-sm space-y-1">
                  <p className="font-semibold text-xs text-muted-foreground uppercase">Applicant</p>
                  <p>{form.title ? form.title + ' ' : ''}{form.firstName} {form.middleNames ? form.middleNames + ' ' : ''}{form.lastName}</p>
                  <p className="text-xs text-muted-foreground">{form.email}</p>
                  <p className="text-xs text-muted-foreground">DOB: {form.dateOfBirth}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 text-sm space-y-1">
                  <p className="font-semibold text-xs text-muted-foreground uppercase">Address</p>
                  <p>{form.addressLine1}</p>
                  <p>{form.city}, {form.postcode}</p>
                  {form.previousAddresses.length > 0 && (
                    <p className="text-xs text-muted-foreground">+ {form.previousAddresses.length} previous address(es)</p>
                  )}
                </CardContent>
              </Card>
              {form.organisationName && (
                <Card>
                  <CardContent className="pt-3 text-sm space-y-1">
                    <p className="font-semibold text-xs text-muted-foreground uppercase">Employment</p>
                    <p>{form.organisationName}</p>
                    {form.roleTitle && <p className="text-xs text-muted-foreground">{form.roleTitle}</p>}
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-3 text-sm flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{isPt ? 'Pronto para enviar?' : 'Ready to submit?'}</p>
                  <p className="text-xs text-muted-foreground">{isPt ? 'Você pode salvar como rascunho e enviar depois, ou enviar agora. Após o envio, a aplicação será encaminhada ao provedor DBS para processamento.' : 'You can save as draft and submit later, or submit now. Once submitted, the application will be sent to the DBS provider for processing.'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : (resetForm(), setTab('dashboard'))} disabled={saving}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {step === 0 ? (isPt ? 'Cancelar' : 'Cancel') : (isPt ? 'Voltar' : 'Back')}
          </Button>
          <div className="flex gap-2">
            {step === 4 && (
              <Button variant="outline" onClick={() => saveApplication(false)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                {isPt ? 'Salvar Rascunho' : 'Save Draft'}
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canGoNext()}>
                {isPt ? 'Próximo' : 'Next'} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => saveApplication(true)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                {isPt ? 'Enviar Aplicação' : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  const active = applications.filter(a => !['completed', 'cancelled', 'rejected'].includes(a.status));
  const completed = applications.filter(a => a.status === 'completed');
  const other = applications.filter(a => ['cancelled', 'rejected'].includes(a.status));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" /> {isPt ? 'Aplicações DBS' : 'DBS Check Applications'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{isPt ? 'Solicitar verificação de antecedentes criminais DBS (Disclosure and Barring Service)' : 'Apply for DBS (Disclosure and Barring Service) criminal record checks'}</p>
        </div>
        <Button onClick={() => setTab('new')}>
          <Plus className="h-4 w-4 mr-1" /> {isPt ? 'Nova Aplicação' : 'New Application'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold">{applications.length}</p>
            <p className="text-xs text-muted-foreground">{isPt ? 'Total de Aplicações' : 'Total Applications'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{active.length}</p>
            <p className="text-xs text-muted-foreground">{isPt ? 'Em Andamento' : 'In Progress'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-green-400">{completed.length}</p>
            <p className="text-xs text-muted-foreground">{isPt ? 'Concluídas' : 'Completed'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{applications.filter(a => a.status === 'draft').length}</p>
            <p className="text-xs text-muted-foreground">{isPt ? 'Rascunhos' : 'Drafts'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Check Types Info */}
      {applications.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <div>
              <h3 className="font-semibold">{isPt ? 'Nenhuma Aplicação DBS' : 'No DBS Applications Yet'}</h3>
              <p className="text-sm text-muted-foreground mt-1">{isPt ? 'Inicie uma nova verificação DBS. Tipos disponíveis:' : 'Start a new DBS check application. Available check types:'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
              {CHECK_TYPES.map(ct => (
                <div key={ct.id} className="bg-muted/30 rounded p-3">
                  <p className="font-medium text-sm">{ct.icon} {ct.name} — {ct.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ct.description}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => setTab('new')} className="mt-2">
              <Plus className="h-4 w-4 mr-1" /> {isPt ? 'Iniciar Aplicação' : 'Start Application'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>}

      {/* Active Applications */}
      {active.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">{isPt ? 'Aplicações Ativas' : 'Active Applications'}</h2>
          {active.map(app => {
            const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
            const StatusIcon = sc.icon;
            return (
              <Card key={app.id} className="hover:border-primary/30 transition-all cursor-pointer" onClick={() => { setViewApp(app); setTab('view'); }}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{CHECK_TYPES.find(t => t.id === app.checkType)?.icon || '🔍'}</div>
                    <div>
                      <p className="font-medium text-sm">{app.firstName} {app.lastName}</p>
                      <p className="text-xs text-muted-foreground">{CHECK_TYPES.find(t => t.id === app.checkType)?.name} — {new Date(app.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.chargedAmount != null && <span className="text-sm font-semibold">£{app.chargedAmount.toFixed(2)}</span>}
                    <Badge className={`${sc.color} border text-xs`}><StatusIcon className="h-3 w-3 mr-1" />{sc.label}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">{isPt ? 'Concluídas' : 'Completed'}</h2>
          {completed.map(app => (
            <Card key={app.id} className="hover:border-primary/30 transition-all cursor-pointer opacity-80" onClick={() => { setViewApp(app); setTab('view'); }}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">{app.firstName} {app.lastName}</p>
                    <p className="text-xs text-muted-foreground">{CHECK_TYPES.find(t => t.id === app.checkType)?.name} — Certificate: {app.certificateNumber || 'N/A'}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cancelled/Rejected */}
      {other.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">{isPt ? 'Canceladas / Rejeitadas' : 'Cancelled / Rejected'}</h2>
          {other.map(app => {
            const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
            return (
              <Card key={app.id} className="opacity-50 cursor-pointer hover:opacity-70" onClick={() => { setViewApp(app); setTab('view'); }}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <p className="text-sm">{app.firstName} {app.lastName} — {CHECK_TYPES.find(t => t.id === app.checkType)?.name}</p>
                  <Badge className={`${sc.color} border text-xs`}>{sc.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
