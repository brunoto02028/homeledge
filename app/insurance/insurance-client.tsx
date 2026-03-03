'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { ModuleGuide } from '@/components/module-guide';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useTranslation } from '@/lib/i18n';
import { useEntityContext } from '@/components/entity-context';
import {
  Shield, Plus, Pencil, Trash2, Loader2, Car, Heart, Home, Plane,
  Stethoscope, Dog, Briefcase, MoreHorizontal, Calendar, AlertTriangle,
  CheckCircle2, PoundSterling, Clock, Bike, Phone, FileText, ExternalLink,
  HelpCircle, TrendingDown, TrendingUp, Minus, ChevronRight, Lightbulb, Scale,
} from 'lucide-react';
import { getClaimGuide, getComparisonLinks, getPriceAssessment, RENEWAL_TIPS, type ClaimGuide } from '@/lib/insurance-data';

const POLICY_TYPES = [
  { value: 'car', label: 'Car Insurance', icon: Car, color: 'bg-blue-500' },
  { value: 'motorcycle', label: 'Motorcycle Insurance', icon: Bike, color: 'bg-orange-500' },
  { value: 'life', label: 'Life Insurance', icon: Heart, color: 'bg-red-500' },
  { value: 'home', label: 'Home Insurance', icon: Home, color: 'bg-green-500' },
  { value: 'health', label: 'Health Insurance', icon: Stethoscope, color: 'bg-purple-500' },
  { value: 'travel', label: 'Travel Insurance', icon: Plane, color: 'bg-cyan-500' },
  { value: 'pet', label: 'Pet Insurance', icon: Dog, color: 'bg-amber-500' },
  { value: 'business', label: 'Business Insurance', icon: Briefcase, color: 'bg-slate-500' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-500' },
];

const COVER_TYPES = [
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'third_party', label: 'Third Party Only' },
  { value: 'third_party_fire_theft', label: 'Third Party, Fire & Theft' },
];

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: '/month',
  quarterly: '/quarter',
  yearly: '/year',
};

interface InsurancePolicy {
  id: string;
  type: string;
  providerName: string;
  policyNumber: string | null;
  holderName: string | null;
  coverageAmount: number | null;
  premiumAmount: number;
  premiumFrequency: string;
  excessAmount: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  autoRenewal: boolean;
  notes: string | null;
  entityId: string | null;
  entity: { id: string; name: string } | null;
  vehicleReg: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  coverType: string | null;
  ncdYears: number | null;
  beneficiary: string | null;
  termYears: number | null;
  propertyAddress: string | null;
  buildingsValue: number | null;
  contentsValue: number | null;
}

const emptyForm = {
  type: 'car', providerName: '', policyNumber: '', holderName: '', coverageAmount: '',
  premiumAmount: '', premiumFrequency: 'monthly', excessAmount: '', startDate: '',
  endDate: '', isActive: true, autoRenewal: true, notes: '', entityId: '',
  vehicleReg: '', vehicleMake: '', vehicleModel: '', vehicleYear: '',
  coverType: 'comprehensive', ncdYears: '',
  beneficiary: '', termYears: '',
  propertyAddress: '', buildingsValue: '', contentsValue: '',
};

export function InsuranceClient() {
  const { t } = useTranslation();
  const { selectedEntityId } = useEntityContext();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterType, setFilterType] = useState('all');
  const [claimGuidePolicy, setClaimGuidePolicy] = useState<InsurancePolicy | null>(null);
  const [emergencyPolicy, setEmergencyPolicy] = useState<InsurancePolicy | null>(null);
  const [comparePolicy, setComparePolicy] = useState<InsurancePolicy | null>(null);
  const [renewalTipsOpen, setRenewalTipsOpen] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      const url = selectedEntityId
        ? `/api/insurance?entityId=${selectedEntityId}`
        : '/api/insurance';
      const res = await fetch(url);
      if (res.ok) setPolicies(await res.json());
    } catch {
      toast({ title: 'Error loading policies', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [selectedEntityId, toast]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const handleSave = async () => {
    if (!form.providerName || !form.premiumAmount || !form.startDate) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/insurance/${editId}` : '/api/insurance';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: editId ? 'Policy updated' : 'Policy added' });
        setShowDialog(false);
        setEditId(null);
        setForm(emptyForm);
        fetchPolicies();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Error', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error saving policy', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/insurance/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Policy deleted' });
        fetchPolicies();
      }
    } catch {
      toast({ title: 'Error deleting', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const openEdit = (p: InsurancePolicy) => {
    setEditId(p.id);
    setForm({
      type: p.type,
      providerName: p.providerName,
      policyNumber: p.policyNumber || '',
      holderName: p.holderName || '',
      coverageAmount: p.coverageAmount?.toString() || '',
      premiumAmount: p.premiumAmount.toString(),
      premiumFrequency: p.premiumFrequency,
      excessAmount: p.excessAmount?.toString() || '',
      startDate: p.startDate?.split('T')[0] || '',
      endDate: p.endDate?.split('T')[0] || '',
      isActive: p.isActive,
      autoRenewal: p.autoRenewal,
      notes: p.notes || '',
      entityId: p.entityId || '',
      vehicleReg: p.vehicleReg || '',
      vehicleMake: p.vehicleMake || '',
      vehicleModel: p.vehicleModel || '',
      vehicleYear: p.vehicleYear?.toString() || '',
      coverType: p.coverType || 'comprehensive',
      ncdYears: p.ncdYears?.toString() || '',
      beneficiary: p.beneficiary || '',
      termYears: p.termYears?.toString() || '',
      propertyAddress: p.propertyAddress || '',
      buildingsValue: p.buildingsValue?.toString() || '',
      contentsValue: p.contentsValue?.toString() || '',
    });
    setShowDialog(true);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

  const getAnnualPremium = (amount: number, freq: string) => {
    if (freq === 'monthly') return amount * 12;
    if (freq === 'quarterly') return amount * 4;
    return amount;
  };

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const diff = new Date(endDate).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate).getTime() < Date.now();
  };

  if (loading) return <LoadingSpinner />;

  const filtered = filterType === 'all'
    ? policies
    : policies.filter(p => p.type === filterType);

  const activePolicies = policies.filter(p => p.isActive);
  const totalMonthlyPremium = activePolicies.reduce((sum, p) => {
    const annual = getAnnualPremium(p.premiumAmount, p.premiumFrequency);
    return sum + annual / 12;
  }, 0);
  const totalAnnualPremium = totalMonthlyPremium * 12;
  const expiringCount = activePolicies.filter(p => isExpiringSoon(p.endDate)).length;

  const isVehicleType = form.type === 'car' || form.type === 'motorcycle';
  const isLifeType = form.type === 'life';
  const isHomeType = form.type === 'home';

  return (
    <div className="p-6 space-y-6">
      <ModuleGuide moduleKey="insurance" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            {t('nav.insurance')}
          </h1>
          <p className="text-muted-foreground mt-1">Manage all your insurance policies in one place</p>
        </div>
        <div className="flex gap-2">
          {activePolicies.length > 0 && (
            <Button variant="outline" onClick={() => setRenewalTipsOpen(true)} className="gap-1.5">
              <Lightbulb className="h-4 w-4" /> Renewal Tips
            </Button>
          )}
          <Button onClick={() => { setEditId(null); setForm(emptyForm); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Policy
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Policies</p>
              <p className="text-xl font-bold">{activePolicies.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Cost</p>
              <p className="text-xl font-bold">{formatCurrency(totalMonthlyPremium)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annual Cost</p>
              <p className="text-xl font-bold">{formatCurrency(totalAnnualPremium)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expiring Soon</p>
              <p className="text-xl font-bold">{expiringCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={filterType === 'all' ? 'default' : 'outline'} onClick={() => setFilterType('all')}>
          All ({policies.length})
        </Button>
        {POLICY_TYPES.filter(pt => policies.some(p => p.type === pt.value)).map(pt => {
          const Icon = pt.icon;
          const count = policies.filter(p => p.type === pt.value).length;
          return (
            <Button key={pt.value} size="sm" variant={filterType === pt.value ? 'default' : 'outline'} onClick={() => setFilterType(pt.value)}>
              <Icon className="h-3.5 w-3.5 mr-1" /> {pt.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Policy Cards */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No insurance policies yet</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">Add your first policy to start tracking your insurance coverage.</p>
          <Button className="mt-4" onClick={() => { setEditId(null); setForm(emptyForm); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Policy
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(policy => {
            const typeConfig = POLICY_TYPES.find(pt => pt.value === policy.type) || POLICY_TYPES[8];
            const Icon = typeConfig.icon;
            const expired = isExpired(policy.endDate);
            const expiringSoon = isExpiringSoon(policy.endDate);

            return (
              <Card key={policy.id} className={`overflow-hidden transition-shadow hover:shadow-md ${!policy.isActive ? 'opacity-60' : ''}`}>
                <div className={`h-1 ${typeConfig.color}`} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg ${typeConfig.color}/10 flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${typeConfig.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{policy.providerName}</h3>
                        <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(policy)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(policy.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {policy.isActive ? (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {expired && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Expired
                      </Badge>
                    )}
                    {expiringSoon && !expired && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                        <Clock className="h-3 w-3 mr-1" /> Expiring Soon
                      </Badge>
                    )}
                    {policy.autoRenewal && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                        Auto-Renew
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Premium</span>
                      <span className="font-semibold">{formatCurrency(policy.premiumAmount)}{FREQUENCY_LABELS[policy.premiumFrequency]}</span>
                    </div>
                    {policy.coverageAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cover</span>
                        <span>{formatCurrency(policy.coverageAmount)}</span>
                      </div>
                    )}
                    {policy.excessAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Excess</span>
                        <span>{formatCurrency(policy.excessAmount)}</span>
                      </div>
                    )}
                    {policy.policyNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Policy #</span>
                        <span className="font-mono text-xs">{policy.policyNumber}</span>
                      </div>
                    )}
                    {policy.endDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Renewal</span>
                        <span>{new Date(policy.endDate).toLocaleDateString('en-GB')}</span>
                      </div>
                    )}
                    {/* Vehicle details */}
                    {(policy.type === 'car' || policy.type === 'motorcycle') && policy.vehicleReg && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle</span>
                        <span>{policy.vehicleReg} {policy.vehicleMake} {policy.vehicleModel}</span>
                      </div>
                    )}
                    {policy.coverType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cover Type</span>
                        <span>{COVER_TYPES.find(c => c.value === policy.coverType)?.label || policy.coverType}</span>
                      </div>
                    )}
                    {policy.ncdYears != null && policy.ncdYears > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NCD</span>
                        <span>{policy.ncdYears} years</span>
                      </div>
                    )}
                  </div>

                  {/* Price Assessment */}
                  {(() => {
                    const monthly = policy.premiumFrequency === 'monthly' ? policy.premiumAmount
                      : policy.premiumFrequency === 'quarterly' ? policy.premiumAmount / 3
                      : policy.premiumAmount / 12;
                    const assessment = getPriceAssessment(policy.type, monthly);
                    return (
                      <div className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md ${
                        assessment.status === 'low' ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300' :
                        assessment.status === 'high' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300' :
                        'bg-muted/50 text-muted-foreground'
                      }`}>
                        {assessment.status === 'low' && <TrendingDown className="h-3 w-3 flex-shrink-0" />}
                        {assessment.status === 'high' && <TrendingUp className="h-3 w-3 flex-shrink-0" />}
                        {assessment.status === 'typical' && <Minus className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{assessment.message}</span>
                      </div>
                    );
                  })()}

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 pt-1 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1"
                      onClick={() => setClaimGuidePolicy(policy)}
                    >
                      <HelpCircle className="h-3 w-3" /> How to Claim
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => setEmergencyPolicy(policy)}
                    >
                      <Phone className="h-3 w-3" /> Emergency
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      onClick={() => setComparePolicy(policy)}
                    >
                      <Scale className="h-3 w-3" /> Compare
                    </Button>
                  </div>

                  {policy.entity && (
                    <div className="pt-1 border-t">
                      <span className="text-xs text-muted-foreground">{policy.entity.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Policy' : 'Add Insurance Policy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Policy Type */}
            <div>
              <Label>Policy Type *</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POLICY_TYPES.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider & Policy Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provider *</Label>
                <Input value={form.providerName} onChange={e => setForm({ ...form, providerName: e.target.value })} placeholder="e.g. Admiral, Aviva" />
              </div>
              <div>
                <Label>Policy Number</Label>
                <Input value={form.policyNumber} onChange={e => setForm({ ...form, policyNumber: e.target.value })} placeholder="Optional" />
              </div>
            </div>

            {/* Premium */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Premium Amount (£) *</Label>
                <Input type="number" step="0.01" value={form.premiumAmount} onChange={e => setForm({ ...form, premiumAmount: e.target.value })} placeholder="29.99" />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={form.premiumFrequency} onValueChange={v => setForm({ ...form, premiumFrequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Coverage & Excess */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Coverage Amount (£)</Label>
                <Input type="number" step="0.01" value={form.coverageAmount} onChange={e => setForm({ ...form, coverageAmount: e.target.value })} placeholder="Total cover" />
              </div>
              <div>
                <Label>Excess (£)</Label>
                <Input type="number" step="0.01" value={form.excessAmount} onChange={e => setForm({ ...form, excessAmount: e.target.value })} placeholder="Voluntary excess" />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Renewal Date</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            {/* Vehicle fields */}
            {isVehicleType && (
              <div className="space-y-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Registration</Label>
                    <Input value={form.vehicleReg} onChange={e => setForm({ ...form, vehicleReg: e.target.value.toUpperCase() })} placeholder="AB12 CDE" />
                  </div>
                  <div>
                    <Label>Cover Type</Label>
                    <Select value={form.coverType} onValueChange={v => setForm({ ...form, coverType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COVER_TYPES.map(ct => (
                          <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Make</Label>
                    <Input value={form.vehicleMake} onChange={e => setForm({ ...form, vehicleMake: e.target.value })} placeholder="Honda" />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })} placeholder="CBR600" />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input type="number" value={form.vehicleYear} onChange={e => setForm({ ...form, vehicleYear: e.target.value })} placeholder="2022" />
                  </div>
                </div>
                <div>
                  <Label>NCD Years</Label>
                  <Input type="number" value={form.ncdYears} onChange={e => setForm({ ...form, ncdYears: e.target.value })} placeholder="No-claims discount years" />
                </div>
              </div>
            )}

            {/* Life fields */}
            {isLifeType && (
              <div className="space-y-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/30">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Life Insurance Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Beneficiary</Label>
                    <Input value={form.beneficiary} onChange={e => setForm({ ...form, beneficiary: e.target.value })} placeholder="Name of beneficiary" />
                  </div>
                  <div>
                    <Label>Term (years)</Label>
                    <Input type="number" value={form.termYears} onChange={e => setForm({ ...form, termYears: e.target.value })} placeholder="25" />
                  </div>
                </div>
              </div>
            )}

            {/* Home fields */}
            {isHomeType && (
              <div className="space-y-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/30">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">Home Insurance Details</h4>
                <div>
                  <Label>Property Address</Label>
                  <Input value={form.propertyAddress} onChange={e => setForm({ ...form, propertyAddress: e.target.value })} placeholder="Full address" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Buildings Value (£)</Label>
                    <Input type="number" value={form.buildingsValue} onChange={e => setForm({ ...form, buildingsValue: e.target.value })} />
                  </div>
                  <div>
                    <Label>Contents Value (£)</Label>
                    <Input type="number" value={form.contentsValue} onChange={e => setForm({ ...form, contentsValue: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Holder & Notes */}
            <div>
              <Label>Policy Holder Name</Label>
              <Input value={form.holderName} onChange={e => setForm({ ...form, holderName: e.target.value })} placeholder="Name on policy" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditId(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? 'Update' : 'Add Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CLAIM GUIDE MODAL ═══ */}
      {claimGuidePolicy && (() => {
        const guide = getClaimGuide(claimGuidePolicy.type);
        return (
          <Dialog open={!!claimGuidePolicy} onOpenChange={(open) => { if (!open) setClaimGuidePolicy(null); }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  {guide.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Time limit warning */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{guide.timeLimit}</span>
                </div>

                {/* Your policy info */}
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="font-semibold">{claimGuidePolicy.providerName}</div>
                  {claimGuidePolicy.policyNumber && <div>Policy #: <span className="font-mono">{claimGuidePolicy.policyNumber}</span></div>}
                  {claimGuidePolicy.coverageAmount && <div>Coverage: {formatCurrency(claimGuidePolicy.coverageAmount)}</div>}
                  {claimGuidePolicy.excessAmount && <div>Excess: {formatCurrency(claimGuidePolicy.excessAmount)}</div>}
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" /> Step-by-Step Guide
                  </h4>
                  {guide.steps.map((step) => (
                    <div key={step.step} className={`flex gap-3 p-3 rounded-lg ${step.important ? 'bg-red-50 dark:bg-red-950/20 border border-red-200/50' : 'bg-muted/30'}`}>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step.important ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'}`}>
                        {step.step}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{step.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Documents Needed */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Documents You Will Need
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {guide.documentsNeeded.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" /> Important Tips
                  </h4>
                  <div className="space-y-1.5">
                    {guide.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                        <span className="text-muted-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClaimGuidePolicy(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ═══ EMERGENCY INFO MODAL ═══ */}
      {emergencyPolicy && (() => {
        const guide = getClaimGuide(emergencyPolicy.type);
        return (
          <Dialog open={!!emergencyPolicy} onOpenChange={(open) => { if (!open) setEmergencyPolicy(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Phone className="h-5 w-5" /> Emergency Information
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Big emergency number */}
                <div className="text-center p-6 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{guide.emergencyNumber}</div>
                  <div className="text-sm text-red-700/70 dark:text-red-300/70 mt-1">{guide.emergencyLabel}</div>
                </div>

                {/* Policy details at a glance */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <div className="font-bold text-lg">{emergencyPolicy.providerName}</div>
                  {emergencyPolicy.policyNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Policy Number</span>
                      <span className="font-mono font-bold text-lg">{emergencyPolicy.policyNumber}</span>
                    </div>
                  )}
                  {emergencyPolicy.holderName && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Policy Holder</span>
                      <span className="font-semibold">{emergencyPolicy.holderName}</span>
                    </div>
                  )}
                  {emergencyPolicy.coverageAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Coverage</span>
                      <span className="font-semibold">{formatCurrency(emergencyPolicy.coverageAmount)}</span>
                    </div>
                  )}
                  {emergencyPolicy.excessAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Excess</span>
                      <span className="font-semibold">{formatCurrency(emergencyPolicy.excessAmount)}</span>
                    </div>
                  )}
                  {(emergencyPolicy.type === 'car' || emergencyPolicy.type === 'motorcycle') && emergencyPolicy.vehicleReg && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Vehicle</span>
                      <span className="font-semibold">{emergencyPolicy.vehicleReg}</span>
                    </div>
                  )}
                  {emergencyPolicy.coverType && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Cover</span>
                      <span className="font-semibold">{COVER_TYPES.find(c => c.value === emergencyPolicy.coverType)?.label}</span>
                    </div>
                  )}
                </div>

                {/* Quick first steps */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">First Steps:</h4>
                  {guide.steps.slice(0, 3).map((step) => (
                    <div key={step.step} className="flex items-start gap-2 text-sm">
                      <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {step.step}
                      </div>
                      <span className="text-muted-foreground">{step.title}: {step.description.split('.')[0]}.</span>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmergencyPolicy(null)}>Close</Button>
                <Button onClick={() => { setEmergencyPolicy(null); setClaimGuidePolicy(emergencyPolicy); }}>
                  Full Claim Guide <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ═══ COMPARE PRICES MODAL ═══ */}
      {comparePolicy && (() => {
        const links = getComparisonLinks(comparePolicy.type);
        const typeConfig = POLICY_TYPES.find(pt => pt.value === comparePolicy.type);
        const monthly = comparePolicy.premiumFrequency === 'monthly' ? comparePolicy.premiumAmount
          : comparePolicy.premiumFrequency === 'quarterly' ? comparePolicy.premiumAmount / 3
          : comparePolicy.premiumAmount / 12;
        const assessment = getPriceAssessment(comparePolicy.type, monthly);
        return (
          <Dialog open={!!comparePolicy} onOpenChange={(open) => { if (!open) setComparePolicy(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-600" /> Compare Prices — {typeConfig?.label}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Current premium vs market */}
                <div className={`p-4 rounded-xl text-sm ${
                  assessment.status === 'low' ? 'bg-green-50 dark:bg-green-950/20 border border-green-200/50' :
                  assessment.status === 'high' ? 'bg-red-50 dark:bg-red-950/20 border border-red-200/50' :
                  'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {assessment.status === 'low' && <TrendingDown className="h-4 w-4 text-green-600" />}
                    {assessment.status === 'high' && <TrendingUp className="h-4 w-4 text-red-600" />}
                    {assessment.status === 'typical' && <Minus className="h-4 w-4" />}
                    <span className="font-semibold">Your Premium: {formatCurrency(monthly)}/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{assessment.message}</p>
                </div>

                {/* Comparison sites */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Compare on these sites:</h4>
                  {links.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <span className="font-medium text-sm">{link.name}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </a>
                  ))}
                </div>

                {/* Smart tips */}
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-sm text-amber-800 dark:text-amber-200">Pro Tips</span>
                  </div>
                  <ul className="space-y-1 text-xs text-amber-700/80 dark:text-amber-300/80">
                    <li>• Compare at least 3 sites — prices vary significantly</li>
                    <li>• Call your current insurer with the best quote — they often match it</li>
                    <li>• Start comparing 3-4 weeks before renewal</li>
                    <li>• Pay annually to save 15-20% vs monthly</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setComparePolicy(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ═══ RENEWAL TIPS MODAL ═══ */}
      <Dialog open={renewalTipsOpen} onOpenChange={setRenewalTipsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" /> Renewal & Savings Tips
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Policies expiring soon */}
            {activePolicies.filter(p => isExpiringSoon(p.endDate)).length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-200 mb-2">
                  <AlertTriangle className="h-4 w-4 inline mr-1" /> Expiring Soon
                </h4>
                {activePolicies.filter(p => isExpiringSoon(p.endDate)).map(p => {
                  const typeConfig = POLICY_TYPES.find(pt => pt.value === p.type);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1">
                      <span>{typeConfig?.label} — {p.providerName}</span>
                      <Badge variant="outline" className="text-amber-600">{new Date(p.endDate!).toLocaleDateString('en-GB')}</Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* General tips */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Money-Saving Tips:</h4>
              {RENEWAL_TIPS.general.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{tip}</span>
                </div>
              ))}
            </div>

            {/* Annual savings estimate */}
            {totalAnnualPremium > 0 && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50">
                <div className="text-sm">
                  <span className="text-muted-foreground">Your total annual insurance spend: </span>
                  <span className="font-bold text-lg">{formatCurrency(totalAnnualPremium)}</span>
                </div>
                <div className="text-xs text-green-700/80 dark:text-green-300/80 mt-1">
                  By comparing and switching, UK consumers save an average of 20-30% — that could be <strong>{formatCurrency(totalAnnualPremium * 0.25)}/year</strong> for you!
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewalTipsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this insurance policy record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
