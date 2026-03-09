'use client';

import { useState, useEffect } from 'react';
import {
  Brain, Plus, Search, Filter, Trash2, Edit2, Save, X, RefreshCw,
  CheckCircle2, Zap, BookOpen, Bot, TrendingUp, AlertTriangle, ChevronDown,
  ChevronUp, HelpCircle, Info, ArrowRight, Shield, Lightbulb, MessageSquare, RotateCcw,
  ArrowUpDown, ArrowUp, ArrowDown, Building2, Globe
} from 'lucide-react';

type SortField = 'keyword' | 'matchType' | 'category' | 'source' | 'usageCount' | 'isActive';
type SortDir = 'asc' | 'desc';

interface Rule {
  id: string;
  keyword: string;
  matchType: string;
  patternField: string;
  transactionType: string | null;
  confidence: number;
  autoApprove: boolean;
  priority: number;
  source: string;
  description: string | null;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  entityId: string | null;
  userId: string | null;
  category: { id: string; name: string; type: string; color?: string; icon?: string };
}

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface Metrics {
  totalRules: number;
  systemRules: number;
  userRules: number;
  autoLearnedRules: number;
  totalFeedback: number;
  corrections: number;
  correctionRate: string;
  topCorrected: Array<{ text: string; count: number }>;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

const SOURCE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  system: { label: 'System', icon: Zap, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  manual: { label: 'Manual', icon: BookOpen, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  auto_learned: { label: 'Auto-Learned', icon: Bot, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
};

const MATCH_TYPE_LABELS: Record<string, string> = {
  contains: 'Contains',
  exact: 'Exact Match',
  starts_with: 'Starts With',
  regex: 'Regex',
};

export default function CategorizationRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ keyword: '', matchType: 'contains', categoryId: '', patternField: 'description', transactionType: '', description: '', priority: 5 });
  const [form, setForm] = useState({ keyword: '', matchType: 'contains', categoryId: '', patternField: 'description', transactionType: '', description: '', priority: 5 });
  const [savingEdit, setSavingEdit] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityFilter, setEntityFilter] = useState<string>('all');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadRules(), loadMetrics(), loadCategories(), loadEntities()]);
    setLoading(false);
  };

  const loadRules = async () => {
    try {
      const url = entityFilter && entityFilter !== 'all'
        ? `/api/categorization-rules?entityId=${entityFilter}`
        : '/api/categorization-rules';
      const res = await fetch(url);
      if (res.ok) setRules(await res.json());
    } catch { /* ignore */ }
  };

  const loadEntities = async () => {
    try {
      const res = await fetch('/api/entities');
      if (res.ok) {
        const data = await res.json();
        setEntities(Array.isArray(data) ? data : data.entities || []);
      }
    } catch { /* ignore */ }
  };

  // Reload rules when entity filter changes
  useEffect(() => {
    loadRules();
  }, [entityFilter]);

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/categorization/metrics');
      if (res.ok) setMetrics(await res.json());
    } catch { /* ignore */ }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch { /* ignore */ }
  };

  const createRule = async () => {
    if (!form.keyword || !form.categoryId) return;
    try {
      const res = await fetch('/api/categorization-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          transactionType: form.transactionType || null,
          entityId: entityFilter !== 'all' ? entityFilter : null,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ keyword: '', matchType: 'contains', categoryId: '', patternField: 'description', transactionType: '', description: '', priority: 5 });
        loadRules();
        loadMetrics();
      }
    } catch { /* ignore */ }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await fetch(`/api/categorization-rules/${id}`, { method: 'DELETE' });
      loadRules();
      loadMetrics();
    } catch { /* ignore */ }
  };

  const toggleActive = async (rule: Rule) => {
    try {
      await fetch(`/api/categorization-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      loadRules();
    } catch { /* ignore */ }
  };

  const startEditing = (rule: Rule) => {
    setEditingId(rule.id);
    setEditForm({
      keyword: rule.keyword,
      matchType: rule.matchType,
      categoryId: rule.category.id,
      patternField: rule.patternField,
      transactionType: rule.transactionType || '',
      description: rule.description || '',
      priority: rule.priority,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setSavingEdit(false);
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.keyword || !editForm.categoryId) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/categorization-rules/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: editForm.keyword,
          matchType: editForm.matchType,
          categoryId: editForm.categoryId,
          patternField: editForm.patternField,
          transactionType: editForm.transactionType || null,
          description: editForm.description || null,
          priority: editForm.priority,
          // Pass entityId so system rules get entity-scoped overrides instead of global mutation
          entityId: entityFilter !== 'all' ? entityFilter : null,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        loadRules();
        loadMetrics();
      }
    } catch { /* ignore */ }
    setSavingEdit(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-purple-500" />
      : <ArrowDown className="h-3 w-3 ml-1 text-purple-500" />;
  };

  const MATCH_ORDER: Record<string, number> = { exact: 0, starts_with: 1, contains: 2, regex: 3 };
  const SOURCE_ORDER: Record<string, number> = { system: 0, manual: 1, auto_learned: 2 };

  const filteredRules = rules.filter(r => {
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.keyword.toLowerCase().includes(q) || r.category.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (sortField) {
    filteredRules.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'keyword':
          cmp = a.keyword.localeCompare(b.keyword, undefined, { sensitivity: 'base' });
          break;
        case 'category':
          cmp = a.category.name.localeCompare(b.category.name, undefined, { sensitivity: 'base' });
          break;
        case 'matchType':
          cmp = (MATCH_ORDER[a.matchType] ?? 9) - (MATCH_ORDER[b.matchType] ?? 9);
          break;
        case 'source':
          cmp = (SOURCE_ORDER[a.source] ?? 9) - (SOURCE_ORDER[b.source] ?? 9);
          break;
        case 'usageCount':
          cmp = a.usageCount - b.usageCount;
          break;
        case 'isActive':
          cmp = (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1;
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-500" />
            Categorisation Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">4-layer engine: Rules → Patterns → AI → Learning</p>
        </div>
        <button onClick={loadAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <Zap className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{metrics.systemRules}</p>
            <p className="text-xs text-muted-foreground">System Rules</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <BookOpen className="h-5 w-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{metrics.userRules}</p>
            <p className="text-xs text-muted-foreground">Your Rules</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <Bot className="h-5 w-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{metrics.autoLearnedRules}</p>
            <p className="text-xs text-muted-foreground">Auto-Learned</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <TrendingUp className="h-5 w-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{metrics.correctionRate}%</p>
            <p className="text-xs text-muted-foreground">Correction Rate</p>
          </div>
        </div>
      )}

      {/* Top Corrected (if any) */}
      {metrics && metrics.topCorrected.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Most Corrected Transactions
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.topCorrected.slice(0, 5).map((t, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {t.text.substring(0, 40)} ({t.count}x)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* How It Works Guide */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-500" />
            <span className="font-semibold text-sm">How does Categorisation Intelligence work?</span>
          </div>
          {showGuide ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showGuide && (
          <div className="px-4 pb-5 space-y-5 border-t">
            {/* Overview */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every time a bank transaction is imported, it passes through a <strong>4-layer intelligent engine</strong> that automatically assigns a category. The system gets smarter over time as you correct categories.
              </p>
            </div>

            {/* 4 Layers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Layer 1 */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Layer 1 — Deterministic Rules</p>
                    <p className="text-[11px] text-green-500 font-medium">100% confidence</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Keyword-based rules (contains, exact, starts with, regex) checked against each transaction. System rules cover 96+ common UK merchants. You can also create your own.
                </p>
              </div>

              {/* Layer 2 */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                    <RotateCcw className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Layer 2 — Smart Patterns</p>
                    <p className="text-[11px] text-amber-500 font-medium">70-95% confidence</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compares the transaction text with your past corrections using fuzzy matching (≥50% word overlap). The more you correct, the smarter it gets.
                </p>
              </div>

              {/* Layer 3 */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Layer 3 — AI Classification</p>
                    <p className="text-[11px] text-purple-500 font-medium">Variable confidence</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If no rule or pattern matches, AI analyses the description with your full category list. It returns a confidence score and justification for each suggestion.
                </p>
              </div>

              {/* Layer 4 */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Layer 4 — Feedback Loop</p>
                    <p className="text-[11px] text-green-500 font-medium">Auto-learning</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When you correct a category, the system records it. After <strong>3+ identical corrections</strong> for the same merchant, a new auto-learned rule is created automatically.
                </p>
              </div>
            </div>

            {/* Modes */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" /> Categorisation Modes</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-500">Conservative</p>
                  <p className="text-muted-foreground">Nothing auto-approved. Every transaction requires your manual review.</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-blue-500">Smart (default)</p>
                  <p className="text-muted-foreground">Auto-approve ≥90% confidence. Suggest 70-90%. Review &lt;70%.</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-green-500">Autonomous</p>
                  <p className="text-muted-foreground">AI governs all. Only flags very low confidence (&lt;50%) for review.</p>
                </div>
              </div>
            </div>

            {/* Rule Sources */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-purple-500" /> Rule Sources</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border text-blue-500 bg-blue-500/10 border-blue-500/20"><Zap className="h-3 w-3" /> System</span>
                  <p className="text-xs text-muted-foreground">96+ pre-built UK rules (TESCO, AMAZON, HMRC, NETFLIX, etc). Cannot be deleted, but can be disabled.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border text-purple-500 bg-purple-500/10 border-purple-500/20"><BookOpen className="h-3 w-3" /> Manual</span>
                  <p className="text-xs text-muted-foreground">Rules you create manually via the "+ New Rule" button. Full control over keyword, match type, and category.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border text-green-500 bg-green-500/10 border-green-500/20"><Bot className="h-3 w-3" /> Auto-Learned</span>
                  <p className="text-xs text-muted-foreground">Created automatically when you correct the same merchant 3+ times. 95% confidence. These prove the system is learning.</p>
                </div>
              </div>
            </div>

            {/* Entity-Scoped Rules — KEY CONCEPT */}
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" />
                <p className="text-sm font-semibold text-indigo-300">Rules per Entity — How it works</p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                You may have multiple entities (e.g. a <strong className="text-foreground">personal account</strong> and a <strong className="text-foreground">limited company</strong>). The same merchant — like McDonald's — can mean very different things depending on which entity you are managing:
              </p>

              {/* Visual example */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-background p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-amber-400">P</span>
                    </div>
                    <p className="text-xs font-semibold">Personal (Individual)</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono">mcdonalds</code>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-amber-400 font-medium">Dining & Takeaway</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">A personal meal out — it's a personal expense.</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-background p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-indigo-400">C</span>
                    </div>
                    <p className="text-xs font-semibold">Company (Ltd)</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono">mcdonalds</code>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-blue-400 font-medium">Office Expenses</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">A team lunch paid by the company — it's a business expense.</p>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">How to set entity-specific rules:</p>
                <ol className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                    <span>Select the entity you want to configure using the <strong className="text-foreground">entity dropdown</strong> in the filter bar above (e.g. "Patricia Pizzonia — individual").</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                    <span>Click the <strong className="text-foreground">✏️ edit icon</strong> next to any rule in the table, change the category, then click <strong className="text-foreground">Save</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                    <span>The system creates a <strong className="text-foreground">private override</strong> for that entity — the original system rule is <strong className="text-foreground">not changed</strong> for your other entities.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">4</span>
                    <span>Repeat for other entities — each one keeps its own independent category mapping.</span>
                  </li>
                </ol>
              </div>

              {/* Priority note */}
              <div className="rounded-md bg-background border border-white/10 p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Priority order:</strong> Entity rule → Your global rule → System rule. When a transaction is categorised, the engine always checks entity-specific rules first, ensuring the most relevant category wins.
                </p>
              </div>

              {/* Visual badge explanation */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                    <Building2 className="h-2.5 w-2.5" /> Entity name
                  </span>
                  = rule applies only to that entity
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px]">
                    <Globe className="h-2.5 w-2.5" /> All
                  </span>
                  = rule applies to all your entities
                </span>
              </div>
            </div>

            {/* Practical tips */}
            <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-4">
              <p className="text-sm font-semibold flex items-center gap-2 text-purple-500 mb-2"><MessageSquare className="h-4 w-4" /> Practical Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-purple-400" />Always select the correct entity before creating or editing rules — this determines which entity the rule applies to.</li>
                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-purple-400" />Correct categories on the Statements page — the engine learns from every correction.</li>
                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-purple-400" />After 3 corrections for the same merchant, an auto-rule appears in the table above with a green "Auto-Learned" badge.</li>
                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-purple-400" />Use "+ New Rule" to manually add rules for merchants the system hasn't learned yet.</li>
                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-purple-400" />The "Most Corrected Transactions" section above shows which merchants need attention — create rules for them.</li>
                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-purple-400" />Disable rules you don't need instead of deleting them — you can re-enable later.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search rules by keyword, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="px-3 py-2 rounded-lg border bg-card text-sm">
          <option value="all">All Entities</option>
          {entities.map(e => (
            <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
          ))}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2 rounded-lg border bg-card text-sm">
          <option value="all">All Sources</option>
          <option value="system">System</option>
          <option value="manual">Manual</option>
          <option value="auto_learned">Auto-Learned</option>
        </select>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Rule
        </button>
      </div>

      {/* Create Rule Form */}
      {showCreate && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-purple-500" /> Create Categorisation Rule
            {entityFilter !== 'all' ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-normal">
                <Building2 className="h-3 w-3" /> {entities.find(e => e.id === entityFilter)?.name || 'Entity'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 font-normal">
                <Globe className="h-3 w-3" /> All entities
              </span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Keyword / Pattern *</label>
              <input
                type="text"
                placeholder="e.g. NETFLIX, TESCO, HMRC..."
                value={form.keyword}
                onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category *</label>
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Match Type</label>
              <select
                value={form.matchType}
                onChange={e => setForm(f => ({ ...f, matchType: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="contains">Contains</option>
                <option value="exact">Exact Match</option>
                <option value="starts_with">Starts With</option>
                <option value="regex">Regex</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Transaction Type</label>
              <select
                value={form.transactionType}
                onChange={e => setForm(f => ({ ...f, transactionType: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="">Both (credit & debit)</option>
                <option value="credit">Income only</option>
                <option value="debit">Expense only</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
              <input
                type="text"
                placeholder="e.g. Netflix streaming subscription"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createRule} disabled={!form.keyword || !form.categoryId} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> Create Rule
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border text-sm hover:bg-muted/50">Cancel</button>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium">
                  <button onClick={() => toggleSort('keyword')} className="inline-flex items-center hover:text-purple-500 transition-colors">
                    Keyword <SortIcon field="keyword" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium">
                  <button onClick={() => toggleSort('matchType')} className="inline-flex items-center hover:text-purple-500 transition-colors">
                    Match <SortIcon field="matchType" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium">
                  <button onClick={() => toggleSort('category')} className="inline-flex items-center hover:text-purple-500 transition-colors">
                    Category <SortIcon field="category" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium">
                  <button onClick={() => toggleSort('source')} className="inline-flex items-center hover:text-purple-500 transition-colors">
                    Source <SortIcon field="source" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium">
                  <button onClick={() => toggleSort('usageCount')} className="inline-flex items-center hover:text-purple-500 transition-colors">
                    Used <SortIcon field="usageCount" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium">
                  <button onClick={() => toggleSort('isActive')} className="inline-flex items-center hover:text-purple-500 transition-colors">
                    Status <SortIcon field="isActive" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    {search || sourceFilter !== 'all' ? 'No rules match your filter' : 'No categorisation rules yet. Create one or run the seed script.'}
                  </td>
                </tr>
              ) : (
                filteredRules.map(rule => {
                  const sourceInfo = SOURCE_LABELS[rule.source] || SOURCE_LABELS.manual;
                  const SourceIcon = sourceInfo.icon;
                  const isEditing = editingId === rule.id;

                  if (isEditing) {
                    return (
                      <tr key={rule.id} className="border-b last:border-0 bg-purple-500/5">
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.keyword}
                            onChange={e => setEditForm(f => ({ ...f, keyword: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Keyword..."
                          />
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full px-2 py-1 rounded border bg-background text-xs mt-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="Description (optional)"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={editForm.matchType}
                            onChange={e => setEditForm(f => ({ ...f, matchType: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="contains">Contains</option>
                            <option value="exact">Exact Match</option>
                            <option value="starts_with">Starts With</option>
                            <option value="regex">Regex</option>
                          </select>
                          <select
                            value={editForm.transactionType}
                            onChange={e => setEditForm(f => ({ ...f, transactionType: e.target.value }))}
                            className="w-full px-2 py-1 rounded border bg-background text-xs mt-1"
                          >
                            <option value="">Both</option>
                            <option value="credit">Income</option>
                            <option value="debit">Expense</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={editForm.categoryId}
                            onChange={e => setEditForm(f => ({ ...f, categoryId: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select...</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sourceInfo.color}`}>
                            <SourceIcon className="h-3 w-3" /> {sourceInfo.label}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{rule.usageCount}x</td>
                        <td className="p-2">
                          <button
                            onClick={() => toggleActive(rule)}
                            className={`text-xs px-2 py-0.5 rounded-full border ${rule.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                          >
                            {rule.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={savingEdit || !editForm.keyword || !editForm.categoryId}
                              className="p-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                              title="Save changes"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const entityName = rule.entityId ? entities.find(e => e.id === rule.entityId)?.name : null;

                  return (
                    <tr key={rule.id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${!rule.isActive ? 'opacity-50' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono font-medium text-sm">{rule.keyword}</p>
                          {entityName ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" title={`Scoped to ${entityName}`}>
                              <Building2 className="h-2.5 w-2.5" />{entityName}
                            </span>
                          ) : rule.userId ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20" title="Applies to all your entities">
                              <Globe className="h-2.5 w-2.5" />All
                            </span>
                          ) : null}
                        </div>
                        {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
                        {rule.transactionType && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${rule.transactionType === 'credit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {rule.transactionType}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
                          rule.matchType === 'exact' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          rule.matchType === 'starts_with' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                          rule.matchType === 'regex' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-muted border-transparent'
                        }`}>{MATCH_TYPE_LABELS[rule.matchType] || rule.matchType}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{rule.category.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">({rule.category.type})</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sourceInfo.color}`}>
                          <SourceIcon className="h-3 w-3" /> {sourceInfo.label}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{rule.usageCount}x</td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleActive(rule)}
                          className={`text-xs px-2 py-0.5 rounded-full border ${rule.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                        >
                          {rule.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(rule)}
                            className="p-1.5 rounded hover:bg-purple-500/10 text-muted-foreground hover:text-purple-500 transition-colors"
                            title="Edit rule"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {rule.source !== 'system' && (
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                              title="Delete rule"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-blue-500" /> System = Built-in UK rules</span>
        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-purple-500" /> Manual = Created by you</span>
        <span className="flex items-center gap-1"><Bot className="h-3 w-3 text-green-500" /> Auto-Learned = From 3+ corrections</span>
        <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-indigo-400" /> Entity-scoped = Applies only to that company</span>
        <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-slate-400" /> All = Applies to all your entities</span>
      </div>
    </div>
  );
}
