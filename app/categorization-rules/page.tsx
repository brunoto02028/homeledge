'use client';

import { useState, useEffect } from 'react';
import {
  Brain, Plus, Search, Filter, Trash2, Edit2, Save, X, RefreshCw,
  CheckCircle2, Zap, BookOpen, Bot, TrendingUp, AlertTriangle, ChevronDown
} from 'lucide-react';

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
  category: { id: string; name: string; type: string; color?: string; icon?: string };
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
  const [form, setForm] = useState({ keyword: '', matchType: 'contains', categoryId: '', patternField: 'description', transactionType: '', description: '', priority: 5 });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadRules(), loadMetrics(), loadCategories()]);
    setLoading(false);
  };

  const loadRules = async () => {
    try {
      const res = await fetch('/api/categorization-rules');
      if (res.ok) setRules(await res.json());
    } catch { /* ignore */ }
  };

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

  const filteredRules = rules.filter(r => {
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.keyword.toLowerCase().includes(q) || r.category.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    }
    return true;
  });

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
            Categorization Intelligence
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
            <Plus className="h-4 w-4 text-purple-500" /> Create Categorization Rule
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
                <th className="text-left p-3 font-medium">Keyword</th>
                <th className="text-left p-3 font-medium">Match</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-left p-3 font-medium">Used</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    {search || sourceFilter !== 'all' ? 'No rules match your filter' : 'No categorization rules yet. Create one or run the seed script.'}
                  </td>
                </tr>
              ) : (
                filteredRules.map(rule => {
                  const sourceInfo = SOURCE_LABELS[rule.source] || SOURCE_LABELS.manual;
                  const SourceIcon = sourceInfo.icon;
                  return (
                    <tr key={rule.id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${!rule.isActive ? 'opacity-50' : ''}`}>
                      <td className="p-3">
                        <p className="font-mono font-medium text-sm">{rule.keyword}</p>
                        {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
                        {rule.transactionType && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${rule.transactionType === 'credit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {rule.transactionType}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">{MATCH_TYPE_LABELS[rule.matchType] || rule.matchType}</span>
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
                        {rule.source !== 'system' && (
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
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
      </div>
    </div>
  );
}
