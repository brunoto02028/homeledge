'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  ShoppingBag, Loader2, Star, Clock, CheckCircle2, Package,
  CreditCard, ArrowRight, FileText, AlertCircle, ExternalLink,
  PoundSterling, Truck, XCircle, RotateCcw,
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
}

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
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'store' | 'purchases'>('store');
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pkgRes, purRes] = await Promise.all([
        fetch('/api/services'),
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-purple-500" />
          Services
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Professional support for your UK journey — relocation, tax, company formation
        </p>
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
                  className={`transition-all hover:shadow-lg ${pkg.isFeatured ? 'ring-2 ring-purple-500/30' : ''} ${isExpanded ? 'md:col-span-2' : ''}`}
                >
                  <CardContent className="p-6 space-y-4">
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
            Secure payments powered by Stripe (coming soon). Currently, purchases are tracked manually — our team will contact you to arrange payment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
