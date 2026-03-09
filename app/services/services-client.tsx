'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ModuleGuide } from '@/components/module-guide';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  ShoppingBag, Loader2, Star, Clock, CheckCircle2, Package,
  CreditCard, ArrowRight, FileText, AlertCircle, ExternalLink,
  PoundSterling, Truck, XCircle, RotateCcw, Plus, Pencil, Trash2,
  Eye, Settings2,
} from 'lucide-react';

interface ServicePackage {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  priceGbp: number;
  originalPriceGbp: number | null;
  currency: string;
  deliverables: string[];
  requirements: string[];
  estimatedDays: number | null;
  category: string | null;
  iconEmoji: string | null;
  isFeatured: boolean;
  sortOrder: number;
  isActive: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
}

const emptyForm = {
  title: '', slug: '', description: '', shortDescription: '',
  priceGbp: '', originalPriceGbp: '', currency: 'GBP',
  deliverables: '', requirements: '',
  estimatedDays: '', category: 'relocation',
  iconEmoji: '📦', isFeatured: false, sortOrder: '0', isActive: true,
};

interface Purchase {
  id: string;
  status: string;
  amountPaid: number;
  currency: string;
  paidAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  servicePackage: {
    title: string;
    slug: string;
    iconEmoji: string | null;
    category: string | null;
    estimatedDays: number | null;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending Payment', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400', icon: Clock },
  paid: { label: 'Paid', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', icon: CreditCard },
  in_progress: { label: 'In Progress', color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400', icon: Package },
  delivered: { label: 'Delivered', color: 'bg-green-500/20 text-green-600 dark:text-green-400', icon: CheckCircle2 },
  refunded: { label: 'Refunded', color: 'bg-slate-500/20 text-slate-600 dark:text-slate-400', icon: RotateCcw },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-600 dark:text-red-400', icon: XCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
  relocation: 'Relocation',
  company_formation: 'Company Formation',
  tax: 'Tax Services',
  visa: 'Visa Support',
};

export function ServicesClient() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'store' | 'purchases'>('store');
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Admin state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewPkg, setPreviewPkg] = useState<ServicePackage | null>(null);

  useEffect(() => { fetchData(); }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [pkgRes, purRes] = await Promise.all([
        fetch(isAdmin ? '/api/admin/services' : '/api/services'),
        fetch('/api/services/purchases'),
      ]);
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        setPackages(pkgData.packages || []);
      }
      if (purRes.ok) {
        const purData = await purRes.json();
        setPurchases(purData.purchases || []);
      }
    } catch {
      toast({ title: 'Failed to load services', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (pkg: ServicePackage) => {
    setEditId(pkg.id);
    setForm({
      title: pkg.title,
      slug: pkg.slug,
      description: pkg.description,
      shortDescription: pkg.shortDescription || '',
      priceGbp: pkg.priceGbp.toString(),
      originalPriceGbp: pkg.originalPriceGbp?.toString() || '',
      currency: pkg.currency,
      deliverables: pkg.deliverables.join('\n'),
      requirements: pkg.requirements.join('\n'),
      estimatedDays: pkg.estimatedDays?.toString() || '',
      category: pkg.category || 'relocation',
      iconEmoji: pkg.iconEmoji || '📦',
      isFeatured: pkg.isFeatured,
      sortOrder: pkg.sortOrder.toString(),
      isActive: pkg.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.priceGbp) {
      toast({ title: 'Title and price are required', variant: 'destructive' });
      return;
    }
    if (!form.slug) form.slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setSaving(true);
    try {
      const payload = {
        ...form,
        deliverables: form.deliverables.split('\n').map(s => s.trim()).filter(Boolean),
        requirements: form.requirements.split('\n').map(s => s.trim()).filter(Boolean),
      };
      const url = editId ? `/api/admin/services/${editId}` : '/api/admin/services';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: editId ? 'Service updated' : 'Service created',
        description: data.stripeSync ? '✓ Synced to Stripe' : 'Stripe not configured',
      });
      setShowForm(false);
      setEditId(null);
      fetchData();
    } catch (e: any) {
      toast({ title: e.message || 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idToDelete?: string) => {
    const targetId = idToDelete || deleteId;
    if (!targetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/services/${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: 'Service deleted',
        description: data.stripeSync ? '✓ Deleted from Stripe' : '',
      });
      setPackages(prev => prev.filter(p => p.id !== targetId));
      setDeleteId(null);
    } catch (e: any) {
      toast({ title: e.message || 'Failed', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handlePurchase = async (pkgId: string) => {
    setPurchasing(pkgId);
    try {
      const res = await fetch('/api/services/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicePackageId: pkgId }),
      });
      const data = await res.json();

      if (res.status === 409) {
        toast({ title: 'You already have an active purchase for this service', variant: 'destructive' });
        return;
      }
      if (!res.ok) throw new Error(data.error);

      // If Stripe checkout URL returned, redirect to payment
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      toast({ title: 'Purchase created!', description: 'Our team will be in touch shortly.' });
      setPurchases(prev => [data.purchase, ...prev]);
      setActiveTab('purchases');
    } catch (e: any) {
      toast({ title: e.message || 'Failed to purchase', variant: 'destructive' });
    } finally {
      setPurchasing(null);
    }
  };

  const categories = ['all', ...Array.from(new Set(packages.map(p => p.category).filter(Boolean)))];
  const filteredPackages = categoryFilter === 'all' ? packages : packages.filter(p => p.category === categoryFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <ModuleGuide moduleKey="services" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-purple-500" />
            Services
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Professional support for your UK journey — relocation, tax, company formation
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="flex-shrink-0 gap-2">
            <Plus className="h-4 w-4" /> New Service
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-1">
        {([
          { id: 'store' as const, label: 'Service Store', icon: ShoppingBag, count: packages.length },
          { id: 'purchases' as const, label: 'My Purchases', icon: Package, count: purchases.length },
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-card border border-b-0 border-border text-foreground -mb-[1px]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-1">{tab.count}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* STORE TAB */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat || 'all'}
                onClick={() => setCategoryFilter(cat || 'all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-gradient-to-r from-slate-800 to-slate-600 text-white dark:from-purple-500 dark:to-purple-400 dark:text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'all' ? 'All Services' : CATEGORY_LABELS[cat as string] || cat}
              </button>
            ))}
          </div>

          {/* Packages grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredPackages.map(pkg => {
              const isExpanded = expandedPkg === pkg.id;
              const hasDiscount = pkg.originalPriceGbp && pkg.originalPriceGbp > pkg.priceGbp;

              return (
                <Card
                  key={pkg.id}
                  className={`transition-all hover:shadow-lg ${pkg.isFeatured ? 'ring-2 ring-purple-500/30' : ''} ${isExpanded ? 'md:col-span-2' : ''} ${isAdmin && !pkg.isActive ? 'opacity-60 border-dashed' : ''}`}
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Admin badges */}
                    {isAdmin && (
                      <div className="flex items-center justify-between -mb-2">
                        <div className="flex gap-1.5">
                          {!pkg.isActive && <Badge variant="outline" className="text-[10px] border-red-400 text-red-400">Inactive</Badge>}
                          {pkg.stripeProductId && <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-500 gap-1"><CreditCard className="h-2.5 w-2.5" />Stripe</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setPreviewPkg(pkg)} title="Preview as user">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(pkg)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteId(pkg.id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{pkg.iconEmoji || '📦'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{pkg.title}</h3>
                            {pkg.isFeatured && (
                              <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px]">
                                <Star className="h-3 w-3 mr-0.5" /> Featured
                              </Badge>
                            )}
                          </div>
                          {pkg.category && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {CATEGORY_LABELS[pkg.category] || pkg.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {hasDiscount && (
                          <p className="text-xs text-muted-foreground line-through">£{pkg.originalPriceGbp}</p>
                        )}
                        <p className="text-2xl font-bold">£{pkg.priceGbp}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">{pkg.shortDescription || pkg.description.substring(0, 120) + '...'}</p>

                    {/* Quick stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {pkg.estimatedDays && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> ~{pkg.estimatedDays} days
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {pkg.deliverables.length} deliverables
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={purchasing === pkg.id}
                      >
                        {purchasing === pkg.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-1" />
                        )}
                        Get Started — £{pkg.priceGbp}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)}
                      >
                        {isExpanded ? 'Less' : 'Details'}
                      </Button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="space-y-4 border-t pt-4">
                        <p className="text-sm whitespace-pre-line leading-relaxed">{pkg.description}</p>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Deliverables */}
                          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
                            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /> What You Get
                            </h4>
                            <ul className="space-y-1">
                              {pkg.deliverables.map((d, i) => (
                                <li key={i} className="text-xs flex items-start gap-1.5">
                                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Requirements */}
                          {pkg.requirements.length > 0 && (
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" /> What You Need
                              </h4>
                              <ul className="space-y-1">
                                {pkg.requirements.map((r, i) => (
                                  <li key={i} className="text-xs flex items-start gap-1.5">
                                    <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredPackages.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No services in this category yet.</p>
            </div>
          )}
        </div>
      )}

      {/* PURCHASES TAB */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No purchases yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab('store')}>
                Browse Services <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            purchases.map(purchase => {
              const config = STATUS_CONFIG[purchase.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              return (
                <Card key={purchase.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{purchase.servicePackage.iconEmoji || '📦'}</span>
                        <div>
                          <h3 className="font-semibold">{purchase.servicePackage.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={config.color}>
                              <StatusIcon className="h-3 w-3 mr-1" /> {config.label}
                            </Badge>
                            {purchase.servicePackage.category && (
                              <Badge variant="outline" className="text-[10px]">
                                {CATEGORY_LABELS[purchase.servicePackage.category] || purchase.servicePackage.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Ordered: {new Date(purchase.createdAt).toLocaleDateString('en-GB')}</span>
                            {purchase.paidAt && <span>Paid: {new Date(purchase.paidAt).toLocaleDateString('en-GB')}</span>}
                            {purchase.deliveredAt && <span>Delivered: {new Date(purchase.deliveredAt).toLocaleDateString('en-GB')}</span>}
                            {purchase.servicePackage.estimatedDays && purchase.status === 'in_progress' && (
                              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                <Truck className="h-3 w-3" /> ~{purchase.servicePackage.estimatedDays} days
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">£{purchase.amountPaid}</p>
                        <p className="text-xs text-muted-foreground">{purchase.currency}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Stripe notice */}
      <Card className="bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="p-4 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Secure payments powered by Stripe. Purchases redirect to Stripe checkout for payment.
          </p>
        </CardContent>
      </Card>

      {/* ── ADMIN: Create/Edit Dialog ── */}
      {isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                {editId ? 'Edit Service' : 'New Service'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="NIN Registration Support" />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated if empty" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Price (£) *</Label>
                  <Input type="number" value={form.priceGbp} onChange={e => setForm(p => ({ ...p, priceGbp: e.target.value }))} placeholder="149" />
                </div>
                <div className="space-y-1.5">
                  <Label>Original Price (£)</Label>
                  <Input type="number" value={form.originalPriceGbp} onChange={e => setForm(p => ({ ...p, originalPriceGbp: e.target.value }))} placeholder="299" />
                </div>
                <div className="space-y-1.5">
                  <Label>Est. Days</Label>
                  <Input type="number" value={form.estimatedDays} onChange={e => setForm(p => ({ ...p, estimatedDays: e.target.value }))} placeholder="14" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="relocation">Relocation</option>
                    <option value="company_formation">Company Formation</option>
                    <option value="tax">Tax Services</option>
                    <option value="visa">Visa Support</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Icon Emoji</Label>
                  <Input value={form.iconEmoji} onChange={e => setForm(p => ({ ...p, iconEmoji: e.target.value }))} placeholder="📦" />
                </div>
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} placeholder="0" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Short Description</Label>
                <Input value={form.shortDescription} onChange={e => setForm(p => ({ ...p, shortDescription: e.target.value }))} placeholder="One-line summary for the card" />
              </div>

              <div className="space-y-1.5">
                <Label>Full Description</Label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  placeholder="Detailed description shown when user clicks Details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Deliverables (one per line)</Label>
                  <textarea
                    value={form.deliverables}
                    onChange={e => setForm(p => ({ ...p, deliverables: e.target.value }))}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="NIN Application submitted&#10;Confirmation letter&#10;Follow-up support"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Requirements (one per line)</Label>
                  <textarea
                    value={form.requirements}
                    onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="Valid passport&#10;Proof of address"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="rounded" />
                  <span className="text-sm">Featured (shows purple ring)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                  <span className="text-sm">Active (visible to users)</span>
                </label>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                <CreditCard className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Saving will automatically create/update this service as a Stripe Product + Price. Price changes create a new Stripe Price (old one archived).</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editId ? 'Save Changes' : 'Create Service'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── ADMIN: Delete Confirm ── */}
      {isAdmin && (
        <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this service?</AlertDialogTitle>
              <AlertDialogDescription>
                The service will be permanently deleted from the database and removed from Stripe. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deleteId!)}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* ── ADMIN: Preview Modal ── */}
      {isAdmin && previewPkg && (
        <Dialog open={!!previewPkg} onOpenChange={open => !open && setPreviewPkg(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Preview — as seen by user
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Stripe info */}
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Stripe info</p>
                <p>Product ID: <span className="font-mono">{previewPkg.stripeProductId || '— not synced yet'}</span></p>
                <p>Price ID: <span className="font-mono">{previewPkg.stripePriceId || '— not synced yet'}</span></p>
                {previewPkg.stripeProductId && (
                  <a
                    href={`https://dashboard.stripe.com/products/${previewPkg.stripeProductId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-500 hover:underline mt-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Open in Stripe Dashboard
                  </a>
                )}
              </div>

              {/* Card preview */}
              <div className={`rounded-xl border p-5 space-y-3 ${previewPkg.isFeatured ? 'ring-2 ring-purple-500/30' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{previewPkg.iconEmoji || '📦'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{previewPkg.title}</h3>
                        {previewPkg.isFeatured && <Badge className="bg-purple-500/20 text-purple-600 text-[10px]"><Star className="h-3 w-3 mr-0.5" /> Featured</Badge>}
                      </div>
                      {previewPkg.category && <Badge variant="outline" className="text-[10px] mt-1">{CATEGORY_LABELS[previewPkg.category] || previewPkg.category}</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    {previewPkg.originalPriceGbp && previewPkg.originalPriceGbp > previewPkg.priceGbp && (
                      <p className="text-xs line-through text-muted-foreground">£{previewPkg.originalPriceGbp}</p>
                    )}
                    <p className="text-2xl font-bold">£{previewPkg.priceGbp}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{previewPkg.shortDescription || previewPkg.description.substring(0, 120) + '...'}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {previewPkg.estimatedDays && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{previewPkg.estimatedDays} days</span>}
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {previewPkg.deliverables.length} deliverables</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    <CreditCard className="h-4 w-4 mr-1" /> Get Started — £{previewPkg.priceGbp}
                  </div>
                  <div className="h-9 px-4 rounded-md border flex items-center text-sm">Details</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">Clicking "Get Started" redirects to Stripe checkout with the Price ID above.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
