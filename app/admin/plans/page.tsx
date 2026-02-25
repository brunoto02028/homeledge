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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard, Plus, Pencil, Trash2, Loader2, Check, Users, Crown,
  UserPlus, Search,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  interval: string;
  features: string[] | null;
  limits: Record<string, number> | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  plan: string;
  planExpiresAt: string | null;
}

const emptyPlan = {
  name: '', displayName: '', price: 0, interval: 'monthly',
  features: '', limits: '', isActive: true, isDefault: false, sortOrder: 0,
};

export default function AdminPlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyPlan);

  // Assign plan dialog
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPlan, setAssignPlan] = useState('');
  const [assignExpiry, setAssignExpiry] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') router.replace('/dashboard');
  }, [status, session, router]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) setPlans(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchUsers()]).finally(() => setLoading(false));
  }, [fetchPlans, fetchUsers]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let features: string[] = [];
      let limits: Record<string, number> = {};

      try {
        features = form.features ? form.features.split('\n').filter(Boolean) : [];
      } catch { /* ignore */ }
      try {
        limits = form.limits ? JSON.parse(form.limits) : {};
      } catch {
        toast({ title: 'Invalid JSON', description: 'Limits must be valid JSON.', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const body = {
        name: form.name,
        displayName: form.displayName,
        price: Number(form.price),
        interval: form.interval,
        features,
        limits,
        isActive: form.isActive,
        isDefault: form.isDefault,
        sortOrder: Number(form.sortOrder),
      };

      const url = editId ? `/api/admin/plans/${editId}` : '/api/admin/plans';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({ title: editId ? 'Plan Updated' : 'Plan Created' });
        setShowDialog(false);
        fetchPlans();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save plan', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"? Users on this plan will keep their current access until you reassign them.`)) return;
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Plan Deleted' });
        fetchPlans();
      }
    } catch { /* ignore */ }
  };

  const handleAssign = async () => {
    if (!assignUserId || !assignPlan) return;
    setAssignSaving(true);
    try {
      const res = await fetch('/api/admin/plans/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignUserId,
          planName: assignPlan,
          expiresAt: assignExpiry || null,
        }),
      });
      if (res.ok) {
        toast({ title: 'Plan Assigned' });
        setShowAssign(false);
        setAssignUserId('');
        setAssignPlan('');
        setAssignExpiry('');
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to assign plan', variant: 'destructive' });
    }
    setAssignSaving(false);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyPlan);
    setShowDialog(true);
  };

  const openEdit = (plan: Plan) => {
    setEditId(plan.id);
    setForm({
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      interval: plan.interval,
      features: (plan.features || []).join('\n'),
      limits: JSON.stringify(plan.limits || {}, null, 2),
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      sortOrder: plan.sortOrder,
    });
    setShowDialog(true);
  };

  const usersOnPlan = (planName: string) => users.filter(u => u.plan === planName).length;

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.fullName.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading || status === 'loading') return <LoadingSpinner />;
  if ((session?.user as any)?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" />
            Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage plans, assign to users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAssign(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Assign Plan
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> New Plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                  {plan.isDefault && <Badge variant="secondary"><Crown className="h-3 w-3 mr-1" /> Default</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(plan)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(plan.id, plan.displayName)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">£{plan.price}</span>
                <span className="text-sm text-muted-foreground">/{plan.interval === 'yearly' ? 'year' : 'mo'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{usersOnPlan(plan.name)} users on this plan</span>
              </div>

              {!plan.isActive && <Badge variant="outline" className="text-red-600">Inactive</Badge>}

              {plan.features && (plan.features as string[]).length > 0 && (
                <ul className="space-y-1.5 pt-2 border-t">
                  {(plan.features as string[]).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              {plan.limits && Object.keys(plan.limits as object).length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Limits</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(plan.limits as Record<string, number>).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="text-xs">
                        {k}: {v === -1 ? '∞' : v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No plans created yet. Click "New Plan" to get started.</p>
          </div>
        )}
      </div>

      {/* Users on Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" /> Users & Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredUsers.slice(0, 50).map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.plan === 'free' ? 'outline' : 'default'}>
                    {plans.find(p => p.name === u.plan)?.displayName || u.plan}
                  </Badge>
                  {u.planExpiresAt && (
                    <span className="text-xs text-muted-foreground">
                      exp {new Date(u.planExpiresAt).toLocaleDateString('en-GB')}
                    </span>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => {
                    setAssignUserId(u.id);
                    setAssignPlan(u.plan);
                    setAssignExpiry('');
                    setShowAssign(true);
                  }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Internal Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. pro"
                  disabled={!!editId}
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  placeholder="e.g. Pro"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Interval</Label>
                <Select value={form.interval} onValueChange={v => setForm({ ...form, interval: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea
                value={form.features}
                onChange={e => setForm({ ...form, features: e.target.value })}
                rows={4}
                placeholder="Unlimited statements&#10;Unlimited invoices&#10;Full HMRC reports"
              />
            </div>
            <div className="space-y-2">
              <Label>Limits (JSON)</Label>
              <Textarea
                value={form.limits}
                onChange={e => setForm({ ...form, limits: e.target.value })}
                rows={3}
                className="font-mono text-xs"
                placeholder='{"statements": 3, "invoices": 5, "vault": 10}'
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isDefault} onCheckedChange={v => setForm({ ...form, isDefault: v })} />
                <Label>Default for new users</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {editId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Plan Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Plan to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={assignPlan} onValueChange={setAssignPlan}>
                <SelectTrigger><SelectValue placeholder="Select plan..." /></SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.displayName} — £{p.price}/{p.interval === 'yearly' ? 'yr' : 'mo'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date (optional)</Label>
              <Input
                type="date"
                value={assignExpiry}
                onChange={e => setAssignExpiry(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assignSaving || !assignUserId || !assignPlan}>
              {assignSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
