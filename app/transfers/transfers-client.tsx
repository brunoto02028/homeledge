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
import {
  ArrowLeftRight, Plus, Pencil, Trash2, Loader2, CreditCard, Building2,
  Repeat, Calendar, Pause, Play, Wallet, ArrowDown, ArrowUp, Banknote,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string | null;
  accountType: string;
  balance: number;
  currency: string;
  isActive: boolean;
  provider: { id: string; name: string; type: string; logoUrl: string | null };
}

interface Transfer {
  id: string;
  name: string;
  type: string;
  fromAccount: string | null;
  toAccount: string | null;
  toName: string | null;
  reference: string | null;
  amount: number;
  currency: string;
  frequency: string;
  dayOfMonth: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  categoryId: string | null;
  category: Category | null;
  notes: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  inter_account: { label: 'Inter-Account', icon: ArrowLeftRight, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  standing_order: { label: 'Standing Order', icon: Banknote, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  direct_debit: { label: 'Direct Debit', icon: CreditCard, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  scheduled_transfer: { label: 'Scheduled Transfer', icon: Repeat, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const FREQ_LABELS: Record<string, string> = {
  one_time: 'One-time', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
};

const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

const emptyForm = { name: '', type: 'inter_account', fromAccount: '', toAccount: '', toName: '', reference: '', amount: '', frequency: 'one_time', dayOfMonth: '', categoryId: '', notes: '' };

function monthlyEquiv(amount: number, freq: string): number {
  if (freq === 'monthly') return amount;
  if (freq === 'weekly') return (amount * 52) / 12;
  if (freq === 'quarterly') return (amount * 4) / 12;
  if (freq === 'yearly') return amount / 12;
  return 0; // one_time
}

export function TransfersClient() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterType, setFilterType] = useState('all');
  const [tab, setTab] = useState<'transfers' | 'reconciliation'>('transfers');

  const fetchData = async () => {
    try {
      const [tRes, cRes, aRes] = await Promise.all([
        fetch('/api/recurring-transfers'),
        fetch('/api/categories'),
        fetch('/api/accounts'),
      ]);
      if (tRes.ok) setTransfers(await tRes.json());
      if (cRes.ok) setCategories(await cRes.json());
      if (aRes.ok) setAccounts(await aRes.json());
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getAccountLabel = (id: string | null) => {
    if (!id) return null;
    const acc = accounts.find(a => a.id === id);
    if (acc) return `${acc.provider.name} — ${acc.accountName}`;
    return id; // fallback to raw text
  };

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.frequency) {
      toast({ title: 'Required', description: 'Name, amount, and frequency are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/recurring-transfers/${editId}` : '/api/recurring-transfers';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: editId ? 'Updated' : 'Created' });
      setShowDialog(false);
      setEditId(null);
      setForm(emptyForm);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (t: Transfer) => {
    try {
      const res = await fetch(`/api/recurring-transfers/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      if (!res.ok) throw new Error();
      toast({ title: t.isActive ? 'Paused' : 'Activated' });
      fetchData();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/recurring-transfers/${deleteId}`, { method: 'DELETE' });
      toast({ title: 'Deleted' });
      setDeleteId(null);
      fetchData();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const openEdit = (tr: Transfer) => {
    setEditId(tr.id);
    setForm({
      name: tr.name,
      type: tr.type,
      fromAccount: tr.fromAccount || '',
      toAccount: tr.toAccount || '',
      toName: tr.toName || '',
      reference: tr.reference || '',
      amount: tr.amount.toString(),
      frequency: tr.frequency,
      dayOfMonth: tr.dayOfMonth?.toString() || '',
      categoryId: tr.categoryId || '',
      notes: tr.notes || '',
    });
    setShowDialog(true);
  };

  if (loading) return <LoadingSpinner />;

  const filtered = filterType === 'all' ? transfers : transfers.filter(tr => tr.type === filterType);
  const active = filtered.filter(tr => tr.isActive);
  const inactive = filtered.filter(tr => !tr.isActive);
  const monthlyTotal = active.reduce((s, tr) => s + monthlyEquiv(tr.amount, tr.frequency), 0);
  const activeAccounts = accounts.filter(a => a.isActive);

  // Build reconciliation: net monthly impact per account
  const accountImpact: Record<string, { outgoing: number; incoming: number }> = {};
  for (const acc of activeAccounts) {
    accountImpact[acc.id] = { outgoing: 0, incoming: 0 };
  }
  for (const tr of transfers.filter(t => t.isActive)) {
    const mo = monthlyEquiv(tr.amount, tr.frequency);
    if (tr.fromAccount && accountImpact[tr.fromAccount]) {
      accountImpact[tr.fromAccount].outgoing += mo;
    }
    if (tr.toAccount && accountImpact[tr.toAccount]) {
      accountImpact[tr.toAccount].incoming += mo;
    }
  }

  const isInterAccount = form.type === 'inter_account';

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-7 w-7 text-primary" />
            {t('transfers.title')}
          </h1>
          <p className="text-muted-foreground mt-1">Track inter-account transfers and reconcile balances across all your accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setEditId(null); setForm(emptyForm); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Transfer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <button onClick={() => setTab('transfers')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'transfers' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Transfers ({transfers.length})
        </button>
        <button onClick={() => setTab('reconciliation')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'reconciliation' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Balance Reconciliation
        </button>
      </div>

      {tab === 'transfers' && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Repeat className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{active.length}</p><p className="text-xs text-muted-foreground">Active</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                <div><p className="text-2xl font-bold">{fmt(monthlyTotal)}</p><p className="text-xs text-muted-foreground">Monthly equiv.</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><ArrowLeftRight className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                <div><p className="text-2xl font-bold">{transfers.filter(t => t.type === 'inter_account').length}</p><p className="text-xs text-muted-foreground">Inter-Account</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><Pause className="h-5 w-5 text-muted-foreground" /></div>
                <div><p className="text-2xl font-bold">{inactive.length}</p><p className="text-xs text-muted-foreground">Paused</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inter_account">Inter-Account</SelectItem>
                <SelectItem value="standing_order">Standing Orders</SelectItem>
                <SelectItem value="direct_debit">Direct Debits</SelectItem>
                <SelectItem value="scheduled_transfer">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transfer List */}
          {filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No transfers yet</h3>
                <p className="text-muted-foreground mb-4">Track money moving between your accounts, standing orders, and direct debits.</p>
                <Button onClick={() => { setEditId(null); setForm(emptyForm); setShowDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Transfer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((tr) => {
                const config = TYPE_CONFIG[tr.type] || TYPE_CONFIG.standing_order;
                const TypeIcon = config.icon;
                const fromLabel = getAccountLabel(tr.fromAccount);
                const toLabel = getAccountLabel(tr.toAccount);

                return (
                  <Card key={tr.id} className={!tr.isActive ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{tr.name}</h3>
                              {!tr.isActive && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                              <span>{FREQ_LABELS[tr.frequency] || tr.frequency}</span>
                              {tr.dayOfMonth && <span>· Day {tr.dayOfMonth}</span>}
                              {fromLabel && <span className="flex items-center gap-0.5"><ArrowUp className="h-3 w-3 text-red-400" />{fromLabel}</span>}
                              {toLabel && <span className="flex items-center gap-0.5"><ArrowDown className="h-3 w-3 text-emerald-400" />{toLabel}</span>}
                              {!toLabel && tr.toName && <span>→ {tr.toName}</span>}
                              {tr.category && <span>· {tr.category.name}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold whitespace-nowrap">{fmt(tr.amount)}</p>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggle(tr)}>
                            {tr.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(tr)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => setDeleteId(tr.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'reconciliation' && (
        <>
          <p className="text-sm text-muted-foreground">Monthly impact of active transfers on each account. Set up your accounts in <strong>Providers</strong> first.</p>
          {activeAccounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No accounts found</h3>
                <p className="text-muted-foreground">Go to <strong>Providers</strong> to add your bank accounts first.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAccounts.map(acc => {
                const impact = accountImpact[acc.id] || { outgoing: 0, incoming: 0 };
                const net = impact.incoming - impact.outgoing;
                return (
                  <Card key={acc.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{acc.provider.name}</h3>
                          <p className="text-xs text-muted-foreground">{acc.accountName} · {acc.accountType}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current Balance</span>
                          <span className="font-semibold">{fmt(acc.balance)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1"><ArrowDown className="h-3 w-3 text-emerald-500" /> Monthly In</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{fmt(impact.incoming)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1"><ArrowUp className="h-3 w-3 text-red-500" /> Monthly Out</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">-{fmt(impact.outgoing)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                          <span>Net Monthly Impact</span>
                          <span className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {net >= 0 ? '+' : ''}{fmt(net)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Projected (3 months)</span>
                          <span className="font-medium">{fmt(acc.balance + net * 3)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Transfer' : 'New Transfer'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input placeholder="e.g. Savings, Rent" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter_account">Inter-Account Transfer</SelectItem>
                    <SelectItem value="standing_order">Standing Order</SelectItem>
                    <SelectItem value="direct_debit">Direct Debit</SelectItem>
                    <SelectItem value="scheduled_transfer">Scheduled Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Account selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From Account</Label>
                <Select value={form.fromAccount || 'none'} onValueChange={v => setForm({ ...form, fromAccount: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {activeAccounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.provider.name} — {a.accountName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isInterAccount ? 'To Account' : 'To Account (optional)'}</Label>
                {isInterAccount ? (
                  <Select value={form.toAccount || 'none'} onValueChange={v => setForm({ ...form, toAccount: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {activeAccounts.filter(a => a.id !== form.fromAccount).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.provider.name} — {a.accountName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Payee name" value={form.toName} onChange={e => setForm({ ...form, toName: e.target.value })} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (£) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Frequency *</Label>
                <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Day of Month</Label>
                <Input type="number" min="1" max="31" value={form.dayOfMonth} onChange={e => setForm({ ...form, dayOfMonth: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input placeholder="Payment reference" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.categoryId || 'none'} onValueChange={v => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
              {editId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
