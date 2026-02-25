'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';
import {
  Calculator, Plus, Trash2, Info, Package, Truck, Clock, PoundSterling,
  TrendingUp, BarChart3, HelpCircle, ChevronDown, ChevronUp, Save,
  ShoppingCart, Percent, ArrowRight, Lightbulb,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────
interface Ingredient {
  id: string;
  name: string;
  costPerUnit: number;
  quantity: number;
  unit: string;
}

interface Product {
  id: string;
  name: string;
  ingredients: Ingredient[];
  labourHours: number;
  labourRate: number;
  packagingCost: number;
  desiredGrossMargin: number;
  desiredNetMargin: number;
  sellingPrice: number;
  useManualPrice: boolean;
}

interface Overheads {
  rent: number;
  utilities: number;
  insurance: number;
  transport: number;
  marketing: number;
  equipment: number;
  other: number;
  unitsPerMonth: number;
}

// ─── Glossary ────────────────────────────────────────────────────────────
const GLOSSARY: Record<string, { term: string; definition: string }> = {
  cogs: {
    term: 'Cost of Goods Sold (COGS)',
    definition: 'The direct costs of producing your product: raw materials/ingredients, packaging, and direct labour. Does NOT include overhead costs like rent or utilities.',
  },
  grossMargin: {
    term: 'Gross Margin',
    definition: 'The percentage of revenue remaining after subtracting COGS. Formula: (Selling Price - COGS) ÷ Selling Price × 100. A 60% gross margin means £0.60 of every £1 sold covers overhead and profit.',
  },
  netMargin: {
    term: 'Net Margin',
    definition: 'The percentage of revenue remaining after subtracting ALL costs (COGS + overhead per unit). Formula: (Selling Price - Total Cost Per Unit) ÷ Selling Price × 100. This is your actual profit percentage.',
  },
  markup: {
    term: 'Markup vs Margin',
    definition: 'Markup is calculated on COST: (Selling Price - Cost) ÷ Cost × 100. Margin is calculated on SELLING PRICE: (Selling Price - Cost) ÷ Selling Price × 100. A 50% markup = 33.3% margin. A 100% markup = 50% margin. They are NOT the same!',
  },
  breakeven: {
    term: 'Break-Even Point',
    definition: 'The number of units you need to sell per month to cover ALL your costs (COGS + overheads) with zero profit. Selling more than this means profit; less means a loss.',
  },
  overhead: {
    term: 'Overhead Costs',
    definition: 'Fixed or recurring costs that are NOT directly tied to producing a single product: rent, utilities, insurance, transport, marketing, equipment depreciation. These are spread across all units produced.',
  },
  contribution: {
    term: 'Contribution Per Unit',
    definition: 'Selling Price minus COGS. This is the amount each unit "contributes" towards covering your overheads and generating profit.',
  },
};

// ─── Tooltip Component ───────────────────────────────────────────────────
function Tooltip({ glossaryKey }: { glossaryKey: string }) {
  const [show, setShow] = useState(false);
  const entry = GLOSSARY[glossaryKey];
  if (!entry) return null;

  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
        type="button"
      >
        <HelpCircle className="h-3 w-3 text-muted-foreground" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 p-3 rounded-lg bg-card border border-border shadow-lg">
          <p className="font-semibold text-xs mb-1">{entry.term}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{entry.definition}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-border" />
          </div>
        </div>
      )}
    </span>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

const STORAGE_KEY = 'homeledger-product-calculator';

const defaultOverheads: Overheads = {
  rent: 0, utilities: 0, insurance: 0, transport: 0,
  marketing: 0, equipment: 0, other: 0, unitsPerMonth: 100,
};

const createEmptyIngredient = (): Ingredient => ({
  id: genId(), name: '', costPerUnit: 0, quantity: 1, unit: 'unit',
});

const createEmptyProduct = (): Product => ({
  id: genId(),
  name: '',
  ingredients: [createEmptyIngredient()],
  labourHours: 0,
  labourRate: 12,
  packagingCost: 0,
  desiredGrossMargin: 50,
  desiredNetMargin: 30,
  sellingPrice: 0,
  useManualPrice: false,
});

// ─── Calculations ────────────────────────────────────────────────────────
function calcProduct(product: Product, overheads: Overheads) {
  const ingredientCost = product.ingredients.reduce(
    (sum, ing) => sum + ing.costPerUnit * ing.quantity, 0
  );
  const labourCost = product.labourHours * product.labourRate;
  const cogs = ingredientCost + labourCost + product.packagingCost;

  const totalMonthlyOverhead =
    overheads.rent + overheads.utilities + overheads.insurance +
    overheads.transport + overheads.marketing + overheads.equipment + overheads.other;
  const overheadPerUnit = overheads.unitsPerMonth > 0
    ? totalMonthlyOverhead / overheads.unitsPerMonth
    : 0;

  const totalCostPerUnit = cogs + overheadPerUnit;

  // Calculate selling prices based on margin targets
  const priceForGrossMargin = product.desiredGrossMargin < 100
    ? cogs / (1 - product.desiredGrossMargin / 100)
    : 0;
  const priceForNetMargin = product.desiredNetMargin < 100
    ? totalCostPerUnit / (1 - product.desiredNetMargin / 100)
    : 0;

  const sellingPrice = product.useManualPrice
    ? product.sellingPrice
    : priceForNetMargin;

  const grossProfit = sellingPrice - cogs;
  const netProfit = sellingPrice - totalCostPerUnit;
  const actualGrossMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const actualNetMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const markup = cogs > 0 ? ((sellingPrice - cogs) / cogs) * 100 : 0;
  const contribution = sellingPrice - cogs;
  const breakEvenUnits = contribution > 0
    ? Math.ceil(totalMonthlyOverhead / contribution)
    : Infinity;

  return {
    ingredientCost,
    labourCost,
    cogs,
    overheadPerUnit,
    totalCostPerUnit,
    priceForGrossMargin,
    priceForNetMargin,
    sellingPrice,
    grossProfit,
    netProfit,
    actualGrossMargin,
    actualNetMargin,
    markup,
    contribution,
    breakEvenUnits,
    totalMonthlyOverhead,
  };
}

// ─── Main Component ──────────────────────────────────────────────────────
export function ProductCalculatorClient() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([createEmptyProduct()]);
  const [overheads, setOverheads] = useState<Overheads>(defaultOverheads);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showOverheads, setShowOverheads] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.products?.length) setProducts(data.products);
        if (data.overheads) setOverheads(data.overheads);
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-save to localStorage
  const saveData = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, overheads }));
    } catch { /* ignore */ }
  }, [products, overheads]);

  useEffect(() => {
    const timer = setTimeout(saveData, 500);
    return () => clearTimeout(timer);
  }, [saveData]);

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addIngredient = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, ingredients: [...p.ingredients, createEmptyIngredient()] }
        : p
    ));
  };

  const updateIngredient = (productId: string, ingredientId: string, updates: Partial<Ingredient>) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, ingredients: p.ingredients.map(i => i.id === ingredientId ? { ...i, ...updates } : i) }
        : p
    ));
  };

  const removeIngredient = (productId: string, ingredientId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, ingredients: p.ingredients.filter(i => i.id !== ingredientId) }
        : p
    ));
  };

  const removeProduct = (id: string) => {
    if (products.length <= 1) {
      toast({ title: 'You need at least one product', variant: 'destructive' });
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            {t('productCalculator.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate your product costs, margins, and selling prices
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGlossary(!showGlossary)}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Glossary
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setProducts(prev => [...prev, createEmptyProduct()]);
              toast({ title: 'New product added' });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Glossary Panel */}
      {showGlossary && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Financial Glossary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(GLOSSARY).map((entry) => (
                <div key={entry.term} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="font-semibold text-sm">{entry.term}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.definition}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Overheads */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowOverheads(!showOverheads)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Monthly Overhead Costs
              <Tooltip glossaryKey="overhead" />
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {fmt(
                  overheads.rent + overheads.utilities + overheads.insurance +
                  overheads.transport + overheads.marketing + overheads.equipment + overheads.other
                )}/mo
              </Badge>
              {showOverheads ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CardHeader>
        {showOverheads && (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These fixed costs are distributed across all units you produce per month.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { key: 'rent', label: 'Rent / Workspace' },
                { key: 'utilities', label: 'Utilities' },
                { key: 'insurance', label: 'Insurance' },
                { key: 'transport', label: 'Transport / Delivery' },
                { key: 'marketing', label: 'Marketing / Ads' },
                { key: 'equipment', label: 'Equipment / Depreciation' },
                { key: 'other', label: 'Other Costs' },
                { key: 'unitsPerMonth', label: 'Units Produced / Month' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <div className="relative">
                    {key !== 'unitsPerMonth' && (
                      <PoundSterling className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Input
                      type="number"
                      step={key === 'unitsPerMonth' ? '1' : '0.01'}
                      min="0"
                      value={overheads[key] || ''}
                      onChange={e => setOverheads(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className={key !== 'unitsPerMonth' ? 'pl-8' : ''}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Products */}
      {products.map((product) => {
        const calc = calcProduct(product, overheads);
        const isExpanded = expandedProduct === product.id;

        return (
          <Card key={product.id} className="overflow-hidden">
            {/* Product Header */}
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      value={product.name}
                      onChange={e => { e.stopPropagation(); updateProduct(product.id, { name: e.target.value }); }}
                      onClick={e => e.stopPropagation()}
                      placeholder="Product name (e.g. Homemade Brownie)"
                      className="font-semibold border-none shadow-none px-0 h-7 focus-visible:ring-0"
                    />
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>COGS: {fmt(calc.cogs)}</span>
                      <span>Sell: {fmt(calc.sellingPrice)}</span>
                      <span className={calc.actualNetMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        Net: {pct(calc.actualNetMargin)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    onClick={e => { e.stopPropagation(); removeProduct(product.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-6 border-t border-border pt-6">
                {/* Ingredients / Raw Materials */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Ingredients / Raw Materials
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIngredient(product.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_100px_80px_80px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                      <span>Item</span>
                      <span>Cost/Unit (£)</span>
                      <span>Qty</span>
                      <span>Unit</span>
                      <span></span>
                    </div>
                    {product.ingredients.map((ing) => (
                      <div key={ing.id} className="grid grid-cols-[1fr_100px_80px_80px_40px] gap-2 items-center">
                        <Input
                          value={ing.name}
                          onChange={e => updateIngredient(product.id, ing.id, { name: e.target.value })}
                          placeholder="e.g. Flour"
                          className="h-9 text-sm"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ing.costPerUnit || ''}
                          onChange={e => updateIngredient(product.id, ing.id, { costPerUnit: parseFloat(e.target.value) || 0 })}
                          className="h-9 text-sm"
                          placeholder="0.00"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ing.quantity || ''}
                          onChange={e => updateIngredient(product.id, ing.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="h-9 text-sm"
                          placeholder="1"
                        />
                        <Input
                          value={ing.unit}
                          onChange={e => updateIngredient(product.id, ing.id, { unit: e.target.value })}
                          className="h-9 text-sm"
                          placeholder="kg"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-red-500"
                          onClick={() => removeIngredient(product.id, ing.id)}
                          disabled={product.ingredients.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="text-right text-sm font-medium mt-2 pr-12">
                    Ingredients Total: <span className="font-bold">{fmt(calc.ingredientCost)}</span>
                  </div>
                </div>

                {/* Labour & Packaging */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Labour Hours
                    </Label>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={product.labourHours || ''}
                      onChange={e => updateProduct(product.id, { labourHours: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hourly Rate (£)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={product.labourRate || ''}
                      onChange={e => updateProduct(product.id, { labourRate: parseFloat(e.target.value) || 0 })}
                      placeholder="12.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Packaging Cost (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.packagingCost || ''}
                      onChange={e => updateProduct(product.id, { packagingCost: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex flex-col justify-center">
                    <p className="text-[10px] text-muted-foreground">Labour Cost</p>
                    <p className="text-sm font-bold">{fmt(calc.labourCost)}</p>
                  </div>
                </div>

                {/* Margin Controls */}
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Margin & Pricing
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Target Gross Margin <Tooltip glossaryKey="grossMargin" />
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="99"
                          value={product.desiredGrossMargin || ''}
                          onChange={e => updateProduct(product.id, { desiredGrossMargin: parseFloat(e.target.value) || 0 })}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Sell at {fmt(calc.priceForGrossMargin)} for this gross margin
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Target Net Margin <Tooltip glossaryKey="netMargin" />
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="99"
                          value={product.desiredNetMargin || ''}
                          onChange={e => updateProduct(product.id, { desiredNetMargin: parseFloat(e.target.value) || 0 })}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Sell at {fmt(calc.priceForNetMargin)} for this net margin
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Manual Selling Price
                        <input
                          type="checkbox"
                          checked={product.useManualPrice}
                          onChange={e => updateProduct(product.id, { useManualPrice: e.target.checked })}
                          className="ml-1"
                        />
                      </Label>
                      <div className="relative">
                        <PoundSterling className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={product.sellingPrice || ''}
                          onChange={e => updateProduct(product.id, { sellingPrice: parseFloat(e.target.value) || 0 })}
                          disabled={!product.useManualPrice}
                          className="pl-8"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {product.useManualPrice ? 'Enter your price to see actual margins' : 'Using net margin target'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results Dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      COGS <Tooltip glossaryKey="cogs" />
                    </p>
                    <p className="text-lg font-bold">{fmt(calc.cogs)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      Overhead/Unit <Tooltip glossaryKey="overhead" />
                    </p>
                    <p className="text-lg font-bold">{fmt(calc.overheadPerUnit)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                    <p className="text-[10px] text-muted-foreground">Total Cost/Unit</p>
                    <p className="text-lg font-bold">{fmt(calc.totalCostPerUnit)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Selling Price</p>
                    <p className="text-lg font-bold text-primary">{fmt(calc.sellingPrice)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      Gross Margin <Tooltip glossaryKey="grossMargin" />
                    </p>
                    <p className={`text-lg font-bold ${calc.actualGrossMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {pct(calc.actualGrossMargin)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{fmt(calc.grossProfit)} profit</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      Net Margin <Tooltip glossaryKey="netMargin" />
                    </p>
                    <p className={`text-lg font-bold ${calc.actualNetMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {pct(calc.actualNetMargin)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{fmt(calc.netProfit)} profit</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      Markup <Tooltip glossaryKey="markup" />
                    </p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{pct(calc.markup)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      Contribution <Tooltip glossaryKey="contribution" />
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{fmt(calc.contribution)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      Break-Even <Tooltip glossaryKey="breakeven" />
                    </p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {calc.breakEvenUnits === Infinity ? '—' : `${calc.breakEvenUnits} units`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">per month</p>
                  </div>
                </div>

                {/* Visual Cost Breakdown Bar */}
                {calc.sellingPrice > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Cost Breakdown per Unit</p>
                    <div className="h-8 rounded-full overflow-hidden flex">
                      <div
                        className="bg-red-400 dark:bg-red-500 flex items-center justify-center text-[9px] text-white font-medium"
                        style={{ width: `${Math.max((calc.ingredientCost / calc.sellingPrice) * 100, 0)}%` }}
                        title={`Ingredients: ${fmt(calc.ingredientCost)}`}
                      >
                        {(calc.ingredientCost / calc.sellingPrice) * 100 > 10 ? 'Ingredients' : ''}
                      </div>
                      <div
                        className="bg-orange-400 dark:bg-orange-500 flex items-center justify-center text-[9px] text-white font-medium"
                        style={{ width: `${Math.max((calc.labourCost / calc.sellingPrice) * 100, 0)}%` }}
                        title={`Labour: ${fmt(calc.labourCost)}`}
                      >
                        {(calc.labourCost / calc.sellingPrice) * 100 > 8 ? 'Labour' : ''}
                      </div>
                      <div
                        className="bg-amber-400 dark:bg-amber-500 flex items-center justify-center text-[9px] text-white font-medium"
                        style={{ width: `${Math.max((product.packagingCost / calc.sellingPrice) * 100, 0)}%` }}
                        title={`Packaging: ${fmt(product.packagingCost)}`}
                      >
                        {(product.packagingCost / calc.sellingPrice) * 100 > 8 ? 'Pkg' : ''}
                      </div>
                      <div
                        className="bg-blue-400 dark:bg-blue-500 flex items-center justify-center text-[9px] text-white font-medium"
                        style={{ width: `${Math.max((calc.overheadPerUnit / calc.sellingPrice) * 100, 0)}%` }}
                        title={`Overhead: ${fmt(calc.overheadPerUnit)}`}
                      >
                        {(calc.overheadPerUnit / calc.sellingPrice) * 100 > 8 ? 'Overhead' : ''}
                      </div>
                      <div
                        className="bg-emerald-500 dark:bg-emerald-400 flex items-center justify-center text-[9px] text-white font-medium"
                        style={{ width: `${Math.max((calc.netProfit / calc.sellingPrice) * 100, 0)}%` }}
                        title={`Profit: ${fmt(calc.netProfit)}`}
                      >
                        {(calc.netProfit / calc.sellingPrice) * 100 > 8 ? 'Profit' : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Ingredients</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Labour</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Packaging</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Overhead</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Profit</span>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Auto-save indicator */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Save className="h-3 w-3" /> Data auto-saved to your browser
        </p>
      </div>
    </div>
  );
}
