'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  CheckCircle2, Circle, Clock, ExternalLink, AlertTriangle, ChevronDown, ChevronUp,
  FileText, User, Building2, Shield, Phone, Mail, Globe, Landmark, ArrowRight,
  Briefcase, ClipboardCheck, Calendar, PoundSterling, HelpCircle, Rocket,
  Info, BookOpen, KeyRound, MapPin, Hash, Loader2, Save, Sparkles,
  Copy, Check, ClipboardCopy, Pencil, Eye, ChevronRight,
} from 'lucide-react';

// ─── Types ───
interface EntityUser {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  utr: string | null;
  niNumber: string | null;
  taxRegime: string;
  tradingName: string | null;
  registeredAddress: string | null;
  tradingAddress: string | null;
  financialYearStart: string | null;
  user?: EntityUser;
}

interface TaxpayerProfile {
  id: string;
  utr: string | null;
  nationalInsuranceNumber: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  tradingName: string | null;
}

type Tab = 'prepare' | 'register' | 'learn';

type RegistrationStatus = 'not_started' | 'gateway_created' | 'sa_registered' | 'waiting_utr' | 'utr_received' | 'activated';

const REG_STATUSES: { value: RegistrationStatus; label: string; icon: any; color: string; desc: string }[] = [
  { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-muted-foreground', desc: 'Haven\'t begun the registration process yet' },
  { value: 'gateway_created', label: 'Gateway Account Created', icon: Globe, color: 'text-blue-500', desc: 'Government Gateway account is set up' },
  { value: 'sa_registered', label: 'SA Registration Submitted', icon: FileText, color: 'text-amber-500', desc: 'Self Assessment form submitted to HMRC' },
  { value: 'waiting_utr', label: 'Waiting for UTR Letter', icon: Clock, color: 'text-orange-500', desc: 'HMRC is processing — letter arriving in 10 working days' },
  { value: 'utr_received', label: 'UTR Received', icon: KeyRound, color: 'text-purple-500', desc: 'UTR letter arrived — enter your number below' },
  { value: 'activated', label: 'Fully Activated', icon: CheckCircle2, color: 'text-emerald-500', desc: 'Online SA account activated and ready to file' },
];

const STORAGE_KEY = 'homeledger-sa-guide';

interface FormData {
  fullName: string;
  dateOfBirth: string;
  niNumber: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  businessName: string;
  tradingName: string;
  businessType: string;
  businessStartDate: string;
  utr: string;
  gatewayUserId: string;
}

const EMPTY_FORM: FormData = {
  fullName: '', dateOfBirth: '', niNumber: '', phone: '', email: '',
  addressLine1: '', addressLine2: '', city: '', postcode: '',
  businessName: '', tradingName: '', businessType: 'sole_trader', businessStartDate: '',
  utr: '', gatewayUserId: '',
};

const BUSINESS_TYPES = [
  { value: 'sole_trader', label: 'Sole Trader / Self-Employed' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'landlord', label: 'Landlord (Rental Income)' },
  { value: 'other', label: 'Other Untaxed Income' },
];

// ─── Helper: extract ALL form fields from entity + owner ───
function fillFormFromEntity(ent: Entity): Partial<FormData> {
  const patch: Partial<FormData> = {};

  // Business details from entity
  if (ent.name) patch.businessName = ent.name;
  if (ent.tradingName) patch.tradingName = ent.tradingName;
  if (ent.utr) patch.utr = ent.utr;
  if (ent.niNumber) patch.niNumber = ent.niNumber;
  if (ent.financialYearStart) patch.businessStartDate = ent.financialYearStart.split('T')[0];

  // Map entity type to businessType
  if (ent.type === 'sole_trader' || ent.type === 'individual') patch.businessType = 'sole_trader';
  else if (ent.type === 'partnership') patch.businessType = 'partnership';

  // For individual/sole_trader entities, the name IS the person's name
  if ((ent.type === 'individual' || ent.type === 'sole_trader') && ent.name) {
    patch.fullName = ent.name;
  }

  // Parse registeredAddress (could be JSON or plain string)
  if (ent.registeredAddress) {
    try {
      const addr = JSON.parse(ent.registeredAddress);
      if (addr.addressLine1) patch.addressLine1 = addr.addressLine1;
      if (addr.addressLine2) patch.addressLine2 = addr.addressLine2;
      if (addr.city || addr.town) patch.city = addr.city || addr.town;
      if (addr.postcode || addr.postalCode) patch.postcode = addr.postcode || addr.postalCode;
    } catch {
      // Plain text address — put in addressLine1
      if (!patch.addressLine1) patch.addressLine1 = ent.registeredAddress;
    }
  }

  // Owner user data — name, email, phone, DOB
  if (ent.user) {
    if (ent.user.fullName) patch.fullName = ent.user.fullName;
    if (ent.user.email) patch.email = ent.user.email;
    if (ent.user.phone) patch.phone = ent.user.phone;
    if (ent.user.dateOfBirth) patch.dateOfBirth = ent.user.dateOfBirth.split('T')[0];
  }

  return patch;
}

// ─── Copy Button Component ───
function CopyBtn({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: `${label} copied!`, duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  return (
    <button
      onClick={copy}
      disabled={!value}
      className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

// ─── Field Row with Copy ───
function FormField({ label, value, onChange, placeholder, type, icon: Icon, copyLabel, disabled, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; icon?: any; copyLabel?: string; disabled?: boolean; mono?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</Label>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          type={type || 'text'}
          disabled={disabled}
          className={`flex-1 h-9 text-sm ${mono ? 'font-mono tracking-wider' : ''}`}
        />
        <CopyBtn value={value} label={copyLabel || label} />
      </div>
    </div>
  );
}

export function SelfAssessmentGuideClient() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('prepare');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [loggedInUserId, setLoggedInUserId] = useState('');
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [regStatus, setRegStatus] = useState<RegistrationStatus>('not_started');
  const [expandedSection, setExpandedSection] = useState<string>('');
  const [appliedDate, setAppliedDate] = useState('');

  // ─── Persistence helpers ───
  const saveLocal = useCallback((f: FormData, status: RegistrationStatus, applied: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form: f, regStatus: status, appliedDate: applied }));
    } catch { /* ignore */ }
  }, []);

  const updateForm = useCallback((patch: Partial<FormData>) => {
    setForm(prev => {
      const next = { ...prev, ...patch };
      saveLocal(next, regStatus, appliedDate);
      return next;
    });
  }, [regStatus, appliedDate, saveLocal]);

  const updateRegStatus = useCallback((status: RegistrationStatus) => {
    setRegStatus(status);
    saveLocal(form, status, appliedDate);
  }, [form, appliedDate, saveLocal]);

  // ─── Load data ───
  useEffect(() => {
    (async () => {
      try {
        // Load local state
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const p = JSON.parse(saved);
            if (p.form) setForm(prev => ({ ...prev, ...p.form }));
            if (p.regStatus) setRegStatus(p.regStatus);
            if (p.appliedDate) setAppliedDate(p.appliedDate);
          }
        } catch { /* ignore */ }

        const [entRes, tpRes, userRes] = await Promise.all([
          fetch('/api/entities'),
          fetch('/api/taxpayer-profile'),
          fetch('/api/onboarding'),
        ]);
        const ents = await entRes.json();
        const tp = await tpRes.json();
        const user = await userRes.json();

        // Store the logged-in user's ID
        const currentUserId = user?.id || '';
        setLoggedInUserId(currentUserId);

        let selectedEnt: Entity | null = null;

        if (Array.isArray(ents)) {
          setEntities(ents);
          // Prefer individual/sole_trader entity, or first one
          selectedEnt = ents.find((e: Entity) => e.type === 'individual' || e.type === 'sole_trader') || ents[0] || null;
          if (selectedEnt) {
            setSelectedEntity(selectedEnt.id);
            // Pre-fill ALL fields from entity + owner
            const entityPatch = fillFormFromEntity(selectedEnt);
            setForm(prev => {
              const merged: any = { ...prev };
              for (const [k, v] of Object.entries(entityPatch)) {
                if (v && !merged[k]) merged[k] = v;
              }
              return merged;
            });
          }
        }

        // Only layer taxpayer profile + logged-in user data if
        // the selected entity belongs to the CURRENT logged-in user.
        // Otherwise we'd mix Bruno's data into Patricia's form.
        const entityOwnerId = selectedEnt?.user?.id;
        const isOwnEntity = !entityOwnerId || entityOwnerId === currentUserId;

        if (isOwnEntity) {
          if (tp && !tp.error) {
            setForm(prev => ({
              ...prev,
              fullName: prev.fullName || tp.fullName || '',
              dateOfBirth: prev.dateOfBirth || (tp.dateOfBirth ? tp.dateOfBirth.split('T')[0] : ''),
              niNumber: prev.niNumber || tp.nationalInsuranceNumber || '',
              addressLine1: prev.addressLine1 || tp.addressLine1 || '',
              addressLine2: prev.addressLine2 || tp.addressLine2 || '',
              city: prev.city || tp.city || '',
              postcode: prev.postcode || tp.postcode || '',
              utr: prev.utr || tp.utr || '',
              tradingName: prev.tradingName || tp.tradingName || '',
            }));
          }

          if (user && !user.error) {
            setForm(prev => ({
              ...prev,
              fullName: prev.fullName || user.fullName || '',
              email: prev.email || user.email || '',
              phone: prev.phone || user.phone || '',
            }));
          }
        }

        // Auto-detect if entity already has UTR
        const selectedUTR = selectedEnt?.utr || selectedEnt?.user?.id === currentUserId && tp?.utr;
        if (selectedUTR) {
          setRegStatus(prev => prev === 'not_started' ? 'activated' : prev);
        }

      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Save to DB ───
  const saveAll = async () => {
    setSaving(true);
    try {
      // Save to taxpayer profile
      await fetch('/api/taxpayer-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          nationalInsuranceNumber: form.niNumber || undefined,
          addressLine1: form.addressLine1 || undefined,
          addressLine2: form.addressLine2 || undefined,
          city: form.city || undefined,
          postcode: form.postcode || undefined,
          utr: form.utr || undefined,
          tradingName: form.tradingName || undefined,
        }),
      });

      // Save to entity
      if (selectedEntity) {
        await fetch(`/api/entities/${selectedEntity}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utr: form.utr || undefined,
            niNumber: form.niNumber || undefined,
            tradingName: form.tradingName || undefined,
          }),
        });
      }

      saveLocal(form, regStatus, appliedDate);
      toast({ title: 'All details saved!', description: 'Your data is safely stored in Clarity & Co.' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Copy all fields for HMRC ───
  const copyAllForHMRC = async () => {
    const lines = [
      `Full Name: ${form.fullName}`,
      `Date of Birth: ${form.dateOfBirth}`,
      `NI Number: ${form.niNumber}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `Address: ${[form.addressLine1, form.addressLine2, form.city, form.postcode].filter(Boolean).join(', ')}`,
      `Business Name: ${form.businessName}`,
      `Trading Name: ${form.tradingName}`,
      `Business Type: ${BUSINESS_TYPES.find(b => b.value === form.businessType)?.label || form.businessType}`,
      `Business Start Date: ${form.businessStartDate}`,
      form.utr ? `UTR: ${form.utr}` : '',
      form.gatewayUserId ? `Government Gateway User ID: ${form.gatewayUserId}` : '',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      toast({ title: 'All details copied!', description: 'Paste into HMRC form or keep as reference.' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  // ─── Computed ───
  const filledFields = Object.entries(form).filter(([k, v]) => v && k !== 'gatewayUserId').length;
  const totalFields = Object.keys(EMPTY_FORM).length - 1; // exclude gatewayUserId
  const readinessPct = Math.round((filledFields / totalFields) * 100);

  const currentStatusIdx = REG_STATUSES.findIndex(s => s.value === regStatus);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Landmark className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Self Assessment — Preparation Hub</h1>
          <p className="text-muted-foreground text-sm">Fill in your details here, then copy them into the HMRC form in minutes</p>
        </div>
      </div>

      {/* ─── Status Banner ─── */}
      <Card className={`border-l-4 ${regStatus === 'activated' ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : regStatus === 'not_started' ? 'border-l-gray-400' : 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20'}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(() => {
              const s = REG_STATUSES[currentStatusIdx];
              const Icon = s.icon;
              return (
                <>
                  <Icon className={`h-6 w-6 ${s.color}`} />
                  <div>
                    <p className="font-bold text-sm">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Form readiness</p>
            <p className="font-bold text-lg">{readinessPct}%</p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {([
          { id: 'prepare' as Tab, label: '1. Your Details', icon: Pencil, desc: 'Fill the form' },
          { id: 'register' as Tab, label: '2. Register', icon: Landmark, desc: 'Track status' },
          { id: 'learn' as Tab, label: '3. Learn', icon: BookOpen, desc: 'Knowledge base' },
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split('.')[1]?.trim()}</span>
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: YOUR DETAILS (FORM + COPY)                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'prepare' && (
        <div className="space-y-5">
          {/* Readiness bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Form Readiness — {filledFields}/{totalFields} fields filled</p>
              <p className="text-xs font-bold">{readinessPct}%</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${readinessPct === 100 ? 'bg-emerald-500' : readinessPct > 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                style={{ width: `${readinessPct}%` }}
              />
            </div>
          </div>

          {/* Entity Selector */}
          {entities.length > 1 && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Entity</Label>
              <select
                value={selectedEntity}
                onChange={e => {
                  setSelectedEntity(e.target.value);
                  const ent = entities.find(x => x.id === e.target.value);
                  if (ent) {
                    // RESET form then fill from entity + owner (no data mixing)
                    const fresh = { ...EMPTY_FORM };
                    const patch = fillFormFromEntity(ent);
                    Object.assign(fresh, patch);
                    setForm(fresh);
                    saveLocal(fresh, regStatus, appliedDate);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm"
              >
                {entities.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.type.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Personal Details ── */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" /> Personal Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField label="Full Legal Name" value={form.fullName} onChange={v => updateForm({ fullName: v })} placeholder="John Smith" icon={User} />
                <FormField label="Date of Birth" value={form.dateOfBirth} onChange={v => updateForm({ dateOfBirth: v })} type="date" icon={Calendar} />
                <FormField label="National Insurance Number" value={form.niNumber} onChange={v => updateForm({ niNumber: v.toUpperCase() })} placeholder="AB 12 34 56 C" icon={Hash} mono />
                <FormField label="Phone Number" value={form.phone} onChange={v => updateForm({ phone: v })} placeholder="+44 7..." icon={Phone} />
                <div className="sm:col-span-2">
                  <FormField label="Email Address" value={form.email} onChange={v => updateForm({ email: v })} placeholder="you@email.com" icon={Mail} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Address ── */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" /> Address
                <span className="text-xs text-muted-foreground font-normal">(where HMRC will send your UTR letter)</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField label="Address Line 1" value={form.addressLine1} onChange={v => updateForm({ addressLine1: v })} placeholder="123 High Street" />
                <FormField label="Address Line 2" value={form.addressLine2} onChange={v => updateForm({ addressLine2: v })} placeholder="Flat 4 (optional)" />
                <FormField label="City / Town" value={form.city} onChange={v => updateForm({ city: v })} placeholder="London" />
                <FormField label="Postcode" value={form.postcode} onChange={v => updateForm({ postcode: v.toUpperCase() })} placeholder="SW1A 1AA" mono />
              </div>
            </CardContent>
          </Card>

          {/* ── Business Details ── */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-500" /> Business Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField label="Business Name" value={form.businessName} onChange={v => updateForm({ businessName: v })} placeholder="Your business or your own name" icon={Building2} />
                <FormField label="Trading Name (if different)" value={form.tradingName} onChange={v => updateForm({ tradingName: v })} placeholder="Optional" />
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Type of Self-Employment</Label>
                  <select
                    value={form.businessType}
                    onChange={e => updateForm({ businessType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm h-9"
                  >
                    {BUSINESS_TYPES.map(bt => (
                      <option key={bt.value} value={bt.value}>{bt.label}</option>
                    ))}
                  </select>
                </div>
                <FormField label="Business Start Date" value={form.businessStartDate} onChange={v => updateForm({ businessStartDate: v })} type="date" icon={Calendar} />
              </div>
            </CardContent>
          </Card>

          {/* ── Tax References ── */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" /> Tax References
                <span className="text-xs text-muted-foreground font-normal">(fill after you receive them)</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField label="UTR (Unique Taxpayer Reference)" value={form.utr} onChange={v => updateForm({ utr: v.replace(/[^0-9\s]/g, '') })} placeholder="10 digits — e.g. 12345 67890" icon={KeyRound} mono />
                <FormField label="Government Gateway User ID" value={form.gatewayUserId} onChange={v => updateForm({ gatewayUserId: v })} placeholder="12 digits — save for your records" icon={Globe} mono />
              </div>
            </CardContent>
          </Card>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={saveAll} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save All to Clarity & Co
            </Button>
            <Button onClick={copyAllForHMRC} variant="outline" className="flex-1">
              <ClipboardCopy className="h-4 w-4 mr-2" />
              Copy All for HMRC
            </Button>
          </div>

          {/* ── Ready to register? ── */}
          {readinessPct >= 60 && regStatus === 'not_started' && (
            <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-emerald-700 dark:text-emerald-300">Ready to register!</p>
                    <p className="text-xs text-muted-foreground">Your form is {readinessPct}% complete. Go to the Register tab to start the HMRC registration.</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab('register')}>
                    Go to Register <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: REGISTRATION TRACKER                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <div className="space-y-5">

          {/* Status Timeline */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-4">Registration Progress</h3>
              <div className="space-y-0">
                {REG_STATUSES.map((s, idx) => {
                  const Icon = s.icon;
                  const isCurrent = s.value === regStatus;
                  const isDone = idx < currentStatusIdx;
                  const isFuture = idx > currentStatusIdx;
                  return (
                    <div key={s.value} className="flex gap-3">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'border-primary bg-primary/10' : 'border-muted bg-muted'}`}>
                          {isDone ? (
                            <Check className="h-4 w-4 text-white" />
                          ) : (
                            <Icon className={`h-4 w-4 ${isCurrent ? s.color : 'text-muted-foreground'}`} />
                          )}
                        </div>
                        {idx < REG_STATUSES.length - 1 && (
                          <div className={`w-0.5 h-8 ${isDone ? 'bg-emerald-500' : 'bg-muted'}`} />
                        )}
                      </div>
                      {/* Content */}
                      <div className={`pb-4 pt-1 ${isFuture ? 'opacity-40' : ''}`}>
                        <p className={`font-semibold text-sm ${isCurrent ? '' : ''}`}>{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Selector */}
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Update your status:</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REG_STATUSES.map(s => {
                    const Icon = s.icon;
                    const isActive = s.value === regStatus;
                    return (
                      <button
                        key={s.value}
                        onClick={() => {
                          updateRegStatus(s.value);
                          if (s.value === 'sa_registered' && !appliedDate) {
                            setAppliedDate(new Date().toISOString().split('T')[0]);
                          }
                        }}
                        className={`p-2 rounded-lg border text-xs font-medium text-left transition-all ${isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                      >
                        <Icon className={`h-3.5 w-3.5 mb-1 ${isActive ? s.color : 'text-muted-foreground'}`} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contextual action card based on status */}
          {regStatus === 'not_started' && (
            <Card className="border-blue-500/30">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Step 1: Create a Government Gateway Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Government Gateway is HMRC&apos;s online service. You need an account before you can register for Self Assessment.
                </p>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><span className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0">1</span> Click the link below to go to GOV.UK</li>
                  <li className="flex items-start gap-2"><span className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0">2</span> Click &quot;Create sign in details&quot;</li>
                  <li className="flex items-start gap-2"><span className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0">3</span> Enter your email address and create a password</li>
                  <li className="flex items-start gap-2"><span className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0">4</span> <strong>Save your User ID</strong> (12 digits) — paste it in the form above</li>
                </ol>
                <a
                  href="https://www.gov.uk/log-in-register-hmrc-online-services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
                >
                  Open GOV.UK — Create Gateway Account <ExternalLink className="h-4 w-4" />
                </a>
                <p className="text-xs text-muted-foreground">After creating your account, update your status to &quot;Gateway Account Created&quot; above.</p>
              </CardContent>
            </Card>
          )}

          {regStatus === 'gateway_created' && (
            <Card className="border-amber-500/30">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Step 2: Register for Self Assessment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Now log into your Government Gateway and register as self-employed. HMRC will ask for the details you&apos;ve already prepared.
                </p>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">💡 Quick tip:</p>
                  <p className="text-sm text-muted-foreground">
                    Go to the &quot;Your Details&quot; tab, click <strong>&quot;Copy All for HMRC&quot;</strong>, and have it ready to paste as you fill in the HMRC form.
                  </p>
                </div>
                <a
                  href="https://www.gov.uk/register-for-self-assessment/self-employed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors"
                >
                  Open HMRC — Register Self Assessment <ExternalLink className="h-4 w-4" />
                </a>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setActiveTab('prepare'); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Review Your Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyAllForHMRC}>
                    <ClipboardCopy className="h-3.5 w-3.5 mr-1" /> Copy All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {regStatus === 'sa_registered' && (
            <Card className="border-orange-500/30">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Step 3: Waiting for Identity Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  HMRC may ask you to verify your identity online or send a verification code by post. Complete this step to proceed.
                </p>
                <p className="text-sm">Once verified, update your status to <strong>&quot;Waiting for UTR Letter&quot;</strong>.</p>
              </CardContent>
            </Card>
          )}

          {regStatus === 'waiting_utr' && (
            <Card className="border-orange-500/30">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-500" />
                  Waiting for Your UTR Letter
                </h3>
                <p className="text-sm text-muted-foreground">
                  HMRC will send your 10-digit UTR number by post to: <strong>{[form.addressLine1, form.city, form.postcode].filter(Boolean).join(', ') || 'your registered address'}</strong>
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg border border-border">
                    <p className="font-bold">📮 UK Address</p>
                    <p className="text-muted-foreground">Usually arrives within <strong>10 working days</strong> (2 weeks)</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <p className="font-bold">✈️ Overseas</p>
                    <p className="text-muted-foreground">Can take up to <strong>21 working days</strong></p>
                  </div>
                </div>
                {appliedDate && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                    <p className="text-sm">
                      📅 You registered on <strong>{appliedDate}</strong>.
                      Expected arrival: <strong>{(() => {
                        const d = new Date(appliedDate);
                        d.setDate(d.getDate() + 14);
                        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                      })()}</strong> (approx.)
                    </p>
                  </div>
                )}
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Haven&apos;t received it?</p>
                  <p className="text-sm text-muted-foreground">Call HMRC: <strong>0300 200 3310</strong> (Mon–Fri 8am–6pm) to request a new letter.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {regStatus === 'utr_received' && (
            <Card className="border-purple-500/30">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-purple-500" />
                  Enter Your UTR Number
                </h3>
                <p className="text-sm text-muted-foreground">
                  You received your UTR letter! Enter the 10-digit number below to save it securely in Clarity & Co.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">UTR (10 digits)</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={form.utr}
                        onChange={e => updateForm({ utr: e.target.value.replace(/[^0-9\s]/g, '') })}
                        placeholder="12345 67890"
                        className="font-mono text-lg tracking-wider"
                        maxLength={11}
                      />
                      <CopyBtn value={form.utr} label="UTR" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">NI Number (confirm)</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={form.niNumber}
                        onChange={e => updateForm({ niNumber: e.target.value.toUpperCase() })}
                        placeholder="AB 12 34 56 C"
                        className="font-mono text-lg tracking-wider"
                        maxLength={13}
                      />
                      <CopyBtn value={form.niNumber} label="NI Number" />
                    </div>
                  </div>
                </div>
                <Button onClick={async () => { await saveAll(); updateRegStatus('activated'); }} disabled={saving || !form.utr} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save UTR &amp; Mark as Activated
                </Button>
              </CardContent>
            </Card>
          )}

          {regStatus === 'activated' && (
            <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-bold text-emerald-700 dark:text-emerald-300">You&apos;re all set!</h3>
                </div>
                {form.utr && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-background border border-emerald-200 dark:border-emerald-800">
                    <KeyRound className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Your UTR</p>
                      <p className="font-mono font-bold text-xl tracking-wider">{form.utr}</p>
                    </div>
                    <CopyBtn value={form.utr} label="UTR" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Your Self Assessment registration is complete. Now make the most of Clarity & Co:
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { emoji: '🏦', label: 'Upload Bank Statements', href: '/statements' },
                    { emoji: '📸', label: 'Scan Receipts', href: '/smart-upload' },
                    { emoji: '📊', label: 'View Tax Reports', href: '/reports' },
                    { emoji: '🏛️', label: 'Connect HMRC API', href: '/entities' },
                    { emoji: '📅', label: 'Tax Timeline', href: '/tax-timeline' },
                    { emoji: '🎯', label: 'Set Up Categories', href: '/categories' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => router.push(item.href)}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 text-sm font-medium text-left transition-colors group"
                    >
                      <span>{item.emoji}</span>
                      <span className="flex-1 group-hover:text-primary transition-colors">{item.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final step: Activate online */}
          {regStatus === 'utr_received' && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
              <h4 className="font-bold text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" /> Final Step: Activate Your Online Account
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Log back into Government Gateway, enter your UTR, and complete the activation. After that, you can file tax returns online.
              </p>
              <a
                href="https://www.gov.uk/log-in-register-hmrc-online-services"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Log into Government Gateway <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: KNOWLEDGE BASE                                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'learn' && (
        <div className="space-y-3">
          {/* What is Self Assessment */}
          <CollapsibleSection
            id="what-is-sa"
            title="What is Self Assessment?"
            icon={HelpCircle}
            color="text-blue-500"
            expanded={expandedSection}
            setExpanded={setExpandedSection}
          >
            <p className="text-sm leading-relaxed">
              Self Assessment is the system HMRC uses to collect Income Tax from people who earn money that isn&apos;t taxed automatically (like a salary through PAYE).
              If you&apos;re <strong>self-employed</strong>, a <strong>landlord</strong>, or have <strong>untaxed income</strong>, you need to tell HMRC how much you earned and pay the right amount of tax.
            </p>
          </CollapsibleSection>

          {/* Who needs to register */}
          <CollapsibleSection
            id="who-needs"
            title="Do I need to register?"
            icon={AlertTriangle}
            color="text-amber-500"
            expanded={expandedSection}
            setExpanded={setExpandedSection}
          >
            <p className="text-sm mb-3">You <strong>must</strong> register for Self Assessment if:</p>
            <ul className="space-y-1.5 text-sm">
              {[
                'You\'re self-employed and earn more than £1,000 per year',
                'You\'re a partner in a business partnership',
                'You have untaxed income (e.g. rental income, investments)',
                'You earn more than £150,000 per year',
                'You need to claim tax relief on expenses',
                'You received Child Benefit and earn over £60,000',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* What is a UTR */}
          <CollapsibleSection
            id="what-is-utr"
            title="What is a UTR?"
            icon={KeyRound}
            color="text-purple-500"
            expanded={expandedSection}
            setExpanded={setExpandedSection}
          >
            <p className="text-sm leading-relaxed mb-3">
              A <strong>UTR (Unique Taxpayer Reference)</strong> is a <strong>10-digit number</strong> that HMRC gives you when you register.
              It&apos;s like your personal tax ID — you&apos;ll need it every time you file a tax return or contact HMRC.
            </p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border">
              <Hash className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Example UTR format:</p>
                <p className="font-mono font-bold text-lg tracking-wider">12345 67890</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Key Deadlines */}
          <CollapsibleSection
            id="deadlines"
            title="Key Deadlines"
            icon={Calendar}
            color="text-rose-500"
            expanded={expandedSection}
            setExpanded={setExpandedSection}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { date: '5 October', desc: 'Deadline to register if you started self-employment this tax year' },
                { date: '31 October', desc: 'Deadline for paper tax returns' },
                { date: '31 January', desc: 'Online tax return deadline AND tax bill payment' },
                { date: '31 July', desc: 'Second payment on account (if applicable)' },
              ].map((d, i) => (
                <div key={i} className="p-3 rounded-lg border border-border">
                  <p className="font-bold">{d.date}</p>
                  <p className="text-muted-foreground text-xs">{d.desc}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Tax Rates */}
          <CollapsibleSection
            id="tax-rates"
            title="Tax Rates & Allowances 2024/25"
            icon={PoundSterling}
            color="text-emerald-500"
            expanded={expandedSection}
            setExpanded={setExpandedSection}
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { amount: '£12,570', label: 'Personal Allowance (tax-free)' },
                { amount: '£1,000', label: 'Trading Allowance' },
                { amount: '20%', label: 'Basic Rate (£12,571–£50,270)' },
                { amount: '40%', label: 'Higher Rate (£50,271–£125,140)' },
                { amount: '45%', label: 'Additional Rate (over £125,140)' },
                { amount: '£6,725', label: 'Class 2 NI threshold' },
              ].map((r, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-border">
                  <p className="font-bold">{r.amount}</p>
                  <p className="text-xs text-muted-foreground">{r.label}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Expenses */}
          <CollapsibleSection
            id="expenses"
            title="Allowable Business Expenses"
            icon={Briefcase}
            color="text-indigo-500"
            expanded={expandedSection}
            setExpanded={setExpandedSection}
          >
            <p className="text-sm mb-2">You can deduct these costs from your income to reduce your tax bill:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
              {[
                'Office supplies & stationery', 'Phone & internet bills', 'Travel & mileage',
                'Advertising & marketing', 'Professional services (accountant, lawyer)',
                'Insurance', 'Tools & equipment', 'Training courses (related to business)',
                'Bank charges & interest', 'Postage & delivery',
                'Subscriptions & memberships', 'Use of home as office',
              ].map((exp, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                  <span>{exp}</span>
                </div>
              ))}
            </div>
            <a
              href="https://www.gov.uk/expenses-if-youre-self-employed"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline font-medium"
            >
              Full list on GOV.UK <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CollapsibleSection>

          {/* NI Number help */}
          <CollapsibleSection
            id="ni-help"
            title="How to find your NI Number"
            icon={Hash}
            color="text-teal-500"
            expanded={expandedSection}
            setExpanded={setExpandedSection}
          >
            <p className="text-sm mb-2">Your National Insurance Number can be found on:</p>
            <ul className="space-y-1.5 text-sm">
              {['Payslips', 'P60 (end of year certificate)', 'P45 (when you leave a job)', 'Tax letters from HMRC', 'The HMRC app', 'Your National Insurance card (if you have one)'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><ArrowRight className="h-3.5 w-3.5 text-teal-500" /> {item}</li>
              ))}
            </ul>
            <a
              href="https://www.gov.uk/lost-national-insurance-number"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline font-medium"
            >
              Request NI Number reminder on GOV.UK <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CollapsibleSection>

          {/* Quick Links */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" /> Quick Reference Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Register for Self Assessment', url: 'https://www.gov.uk/register-for-self-assessment' },
                  { label: 'File your Tax Return', url: 'https://www.gov.uk/self-assessment-tax-returns' },
                  { label: 'Pay your Tax Bill', url: 'https://www.gov.uk/pay-self-assessment-tax-bill' },
                  { label: 'SA Deadlines', url: 'https://www.gov.uk/self-assessment-tax-returns/deadlines' },
                  { label: 'Allowable Expenses', url: 'https://www.gov.uk/expenses-if-youre-self-employed' },
                  { label: 'HMRC Contact', url: 'https://www.gov.uk/government/organisations/hm-revenue-customs/contact/self-assessment' },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm font-medium group"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Section (used in Learn tab) ───
function CollapsibleSection({ id, title, icon: Icon, color, children, expanded, setExpanded }: {
  id: string; title: string; icon: any; color: string; children: React.ReactNode;
  expanded: string; setExpanded: (v: string) => void;
}) {
  const isOpen = expanded === id;
  return (
    <Card>
      <button
        onClick={() => setExpanded(isOpen ? '' : id)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="font-bold text-sm flex-1">{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <CardContent className="px-4 pb-4 pt-0 border-t border-border/50">
          <div className="pt-3">{children}</div>
        </CardContent>
      )}
    </Card>
  );
}
