'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useTranslation } from '@/lib/i18n';
import {
  Home, Plus, Pencil, Trash2, Loader2, TrendingUp, TrendingDown,
  Banknote, MapPin, Building2, Percent,
} from 'lucide-react';
import { FirstHomeGuide } from '@/components/first-home-guide';
import { PropertyIntelligence } from '@/components/property-intelligence';
import { MortgageSimulator } from '@/components/mortgage-simulator';
import { PropertyPurchasePlanner } from '@/components/property-purchase-planner';

interface Property {
  id: string;
  name: string;
  type: string;
  address: string | null;
  postcode: string | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  currentValue: number | null;
  mortgageBalance: number | null;
  mortgageRate: number | null;
  mortgageType: string | null;
  monthlyPayment: number | null;
  rentalIncome: number | null;
  isActive: boolean;
  notes: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  residential: { label: 'Residential', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  buy_to_let: { label: 'Buy to Let', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  commercial: { label: 'Commercial', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  holiday_let: { label: 'Holiday Let', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);

const emptyForm = {
  name: '', type: 'residential', address: '', postcode: '', purchasePrice: '', currentValue: '',
  mortgageBalance: '', mortgageRate: '', mortgageType: '', monthlyPayment: '', rentalIncome: '', notes: '',
};

export function PropertiesClient() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/properties');
      if (res.ok) setProperties(await res.json());
    } catch {
      toast({ title: 'Error', description: 'Failed to load properties', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/properties/${editId}` : '/api/properties';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: editId ? 'Property updated' : 'Property added' });
      setShowDialog(false);
      setEditId(null);
      setForm(emptyForm);
      fetchData();
    } catch (err: any) {
      toast({ title: err.message || 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/properties/${deleteId}`, { method: 'DELETE' });
      toast({ title: 'Property deleted' });
      setDeleteId(null);
      fetchData();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const openEdit = (p: Property) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      type: p.type,
      address: p.address || '',
      postcode: p.postcode || '',
      purchasePrice: p.purchasePrice?.toString() || '',
      currentValue: p.currentValue?.toString() || '',
      mortgageBalance: p.mortgageBalance?.toString() || '',
      mortgageRate: p.mortgageRate?.toString() || '',
      mortgageType: p.mortgageType || '',
      monthlyPayment: p.monthlyPayment?.toString() || '',
      rentalIncome: p.rentalIncome?.toString() || '',
      notes: p.notes || '',
    });
    setShowDialog(true);
  };

  if (loading) return <LoadingSpinner />;

  const active = properties.filter(p => p.isActive);
  const totalValue = active.reduce((s, p) => s + (p.currentValue || 0), 0);
  const totalMortgage = active.reduce((s, p) => s + (p.mortgageBalance || 0), 0);
  const totalEquity = totalValue - totalMortgage;
  const monthlyRental = active.reduce((s, p) => s + (p.rentalIncome || 0), 0);
  const monthlyMortgage = active.reduce((s, p) => s + (p.monthlyPayment || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Home className="h-7 w-7 text-primary" />
            {t('properties.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('properties.subtitle')}</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Property
        </Button>
      </div>

      {/* First Home Buying Guide */}
      <FirstHomeGuide />

      {/* Property Purchase Intelligence */}
      <PropertyIntelligence />

      {/* Mortgage Approval Simulator */}
      <MortgageSimulator />

      {/* Property Purchase Planner */}
      <PropertyPurchasePlanner />

      {/* Portfolio Summary */}
      {active.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{fmt(totalValue)}</p>
                  <p className="text-xs text-muted-foreground">{t('properties.totalValue')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{fmt(totalEquity)}</p>
                  <p className="text-xs text-muted-foreground">{t('properties.totalEquity')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{fmt(totalMortgage)}</p>
                  <p className="text-xs text-muted-foreground">{t('properties.mortgageDebt')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{fmt(monthlyRental - monthlyMortgage)}/mo</p>
                  <p className="text-xs text-muted-foreground">{t('properties.netCashFlow')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Property List */}
      {properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-4">Track residential properties, buy-to-lets, and commercial units</p>
            <Button onClick={() => { setEditId(null); setForm(emptyForm); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {properties.map((p) => {
            const config = TYPE_CONFIG[p.type] || TYPE_CONFIG.residential;
            const equity = (p.currentValue || 0) - (p.mortgageBalance || 0);
            const ltv = p.currentValue && p.mortgageBalance ? Math.round((p.mortgageBalance / p.currentValue) * 100) : null;
            const gain = p.purchasePrice && p.currentValue ? p.currentValue - p.purchasePrice : null;

            return (
              <Card key={p.id} className={!p.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{p.name}</h3>
                        {!p.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                        {p.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}</span>}
                        {p.postcode && <span>{p.postcode}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm font-bold">{p.currentValue ? fmt(p.currentValue) : '-'}</p>
                      <p className="text-[10px] text-muted-foreground">Value</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm font-bold">{p.mortgageBalance ? fmt(p.mortgageBalance) : '-'}</p>
                      <p className="text-[10px] text-muted-foreground">Mortgage</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className={`text-sm font-bold ${equity >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(equity)}</p>
                      <p className="text-[10px] text-muted-foreground">Equity</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                    {p.mortgageRate && (
                      <span className="flex items-center gap-1"><Percent className="h-3 w-3" />{p.mortgageRate}% {p.mortgageType || ''}</span>
                    )}
                    {ltv !== null && <span>LTV: {ltv}%</span>}
                    {p.monthlyPayment && <span>Payment: {fmt(p.monthlyPayment)}/mo</span>}
                    {p.rentalIncome && <span className="text-emerald-600">Rental: {fmt(p.rentalIncome)}/mo</span>}
                    {gain !== null && (
                      <span className={gain >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {gain >= 0 ? '+' : ''}{fmt(gain)} since purchase
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Property' : 'Add Property'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Property Name</Label>
                <Input placeholder="e.g. 42 Oak Avenue" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="buy_to_let">Buy to Let</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="holiday_let">Holiday Let</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input placeholder="Full address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Postcode</Label>
                <Input placeholder="e.g. SW1A 1AA" value={form.postcode} onChange={e => setForm({ ...form, postcode: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Purchase Price (£)</Label>
                <Input type="number" step="1000" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Current Value (£)</Label>
                <Input type="number" step="1000" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Mortgage Balance (£)</Label>
                <Input type="number" step="1000" value={form.mortgageBalance} onChange={e => setForm({ ...form, mortgageBalance: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Rate (%)</Label>
                <Input type="number" step="0.01" value={form.mortgageRate} onChange={e => setForm({ ...form, mortgageRate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.mortgageType || 'none'} onValueChange={v => setForm({ ...form, mortgageType: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                    <SelectItem value="tracker">Tracker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monthly Payment (£)</Label>
                <Input type="number" step="1" value={form.monthlyPayment} onChange={e => setForm({ ...form, monthlyPayment: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Rental Income (£)</Label>
                <Input type="number" step="1" value={form.rentalIncome} onChange={e => setForm({ ...form, rentalIncome: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Optional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? 'Update' : 'Add Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this property from your portfolio.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-sm">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
