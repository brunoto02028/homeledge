'use client';

import { useState, useEffect } from 'react';
import {
  Zap, Plus, Play, Trash2, ToggleLeft, ToggleRight, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, RefreshCw,
  Mail, Bell, Webhook, Flag, ListTodo, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  triggerConfig: any;
  action: string;
  actionConfig: any;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runCount: number;
  createdAt: string;
  _count: { logs: number };
  logs: { status: string; message: string | null; runAt: string }[];
}

interface AutomationLog {
  id: string;
  ruleId: string;
  status: string;
  message: string | null;
  runAt: string;
  rule: { name: string; trigger: string; action: string };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRIGGERS = [
  { value: 'schedule_daily',   label: 'Every Day',          icon: '📅', desc: 'Runs once per day' },
  { value: 'schedule_weekly',  label: 'Every Week',         icon: '📆', desc: 'Runs once per week' },
  { value: 'schedule_monthly', label: 'Every Month',        icon: '🗓',  desc: 'Runs on the 1st of each month' },
  { value: 'bill_due',         label: 'Bill Due Soon',      icon: '💳', desc: 'When a bill is due within N days' },
  { value: 'invoice_overdue',  label: 'Invoice Overdue',    icon: '📄', desc: 'When an invoice passes its due date' },
  { value: 'budget_exceeded',  label: 'Budget Exceeded',    icon: '💰', desc: 'When spending exceeds a budget' },
  { value: 'statement_imported', label: 'Statement Imported', icon: '🏦', desc: 'When a bank statement is imported' },
];

const ACTIONS = [
  { value: 'send_reminder', label: 'Send Reminder Email', icon: Bell,    desc: 'Email with context data (bills, invoices)' },
  { value: 'send_email',    label: 'Send Custom Email',   icon: Mail,    desc: 'Send a custom email message' },
  { value: 'create_action', label: 'Create Task',         icon: ListTodo, desc: 'Add a task/reminder to your Actions list' },
  { value: 'flag_transaction', label: 'Flag Transactions', icon: Flag,   desc: 'Flag uncategorized transactions for review' },
  { value: 'webhook',       label: 'Call Webhook',        icon: Webhook, desc: 'POST data to an external URL' },
];

const BLANK_FORM = {
  name: '', description: '', trigger: 'schedule_daily', action: 'send_reminder',
  triggerConfig: {} as any, actionConfig: {} as any,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AutomationClient() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'rules' | 'logs'>('rules');
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [rRes, lRes] = await Promise.all([
        fetch('/api/automation/rules'),
        fetch('/api/automation/logs?limit=50'),
      ]);
      if (rRes.ok) setRules(await rRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } finally { setLoading(false); }
  }

  function openCreate() {
    setEditRule(null);
    setForm({ ...BLANK_FORM });
    setShowForm(true);
  }

  function openEdit(rule: AutomationRule) {
    setEditRule(rule);
    setForm({
      name: rule.name,
      description: rule.description || '',
      trigger: rule.trigger,
      action: rule.action,
      triggerConfig: rule.triggerConfig || {},
      actionConfig: rule.actionConfig || {},
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editRule ? `/api/automation/rules/${editRule.id}` : '/api/automation/rules';
      const method = editRule ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast({ title: editRule ? 'Rule updated' : 'Rule created' });
      setShowForm(false);
      loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  }

  async function toggleActive(rule: AutomationRule) {
    await fetch(`/api/automation/rules/${rule.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
    toast({ title: rule.isActive ? 'Rule paused' : 'Rule activated' });
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this automation rule?')) return;
    await fetch(`/api/automation/rules/${id}`, { method: 'DELETE' });
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Rule deleted' });
  }

  async function runNow(rule: AutomationRule) {
    setRunningId(rule.id);
    try {
      const res = await fetch(`/api/automation/run?ruleId=${rule.id}`, { method: 'POST' });
      const data = await res.json();
      const result = data.results?.[0];
      if (result?.status === 'success') toast({ title: `✓ ${rule.name}`, description: result.message });
      else if (result?.status === 'skipped') toast({ title: `Skipped`, description: result.reason });
      else toast({ title: 'Failed', description: result?.error || 'Unknown error', variant: 'destructive' });
      loadAll();
    } catch (err: any) {
      toast({ title: 'Run failed', description: err.message, variant: 'destructive' });
    } finally { setRunningId(null); }
  }

  const triggerInfo = (t: string) => TRIGGERS.find(x => x.value === t);
  const actionInfo = (a: string) => ACTIONS.find(x => x.value === a);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Automation Hub</h1>
            <p className="text-sm text-muted-foreground">Automate repetitive tasks — bills, invoices, emails, reminders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={loadAll} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-1" />New Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Rules', value: rules.length, icon: Zap, color: 'violet' },
          { label: 'Active', value: rules.filter(r => r.isActive).length, icon: CheckCircle2, color: 'green' },
          { label: 'Runs Today', value: logs.filter(l => new Date(l.runAt).toDateString() === new Date().toDateString()).length, icon: Clock, color: 'blue' },
        ].map(s => (
          <div key={s.label} className="border rounded-xl p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <s.icon className="h-4 w-4" />
              <span className="text-xs">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4">
        {(['rules', 'logs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-violet-500 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t === 'rules' ? `Rules (${rules.length})` : `Run History (${logs.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tab === 'rules' ? (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center">
              <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No automation rules yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first rule to automate tasks</p>
              <Button onClick={openCreate} variant="outline"><Plus className="h-4 w-4 mr-1" />Create Rule</Button>
            </div>
          ) : rules.map(rule => {
            const tri = triggerInfo(rule.trigger);
            const act = actionInfo(rule.action);
            const ActIcon = act?.icon || Zap;
            const lastLog = rule.logs?.[0];
            const isExpanded = expandedId === rule.id;

            return (
              <div key={rule.id} className={`border rounded-xl bg-card transition-all ${!rule.isActive ? 'opacity-60' : ''}`}>
                <div className="p-4 flex items-center gap-3">
                  <div className="text-2xl w-10 text-center shrink-0">{tri?.icon || '⚡'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium truncate">{rule.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {rule.isActive ? 'Active' : 'Paused'}
                      </span>
                      {lastLog && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${lastLog.status === 'success' ? 'bg-green-50 text-green-600' : lastLog.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                          {lastLog.status === 'success' ? '✓' : lastLog.status === 'failed' ? '✗' : '—'} last run
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{tri?.label}</span>
                      <span>→</span>
                      <span className="flex items-center gap-1"><ActIcon className="h-3 w-3" />{act?.label}</span>
                      <span>·</span>
                      <span>{rule.runCount} run{rule.runCount !== 1 ? 's' : ''}</span>
                      {rule.lastRunAt && <span>· last {new Date(rule.lastRunAt).toLocaleDateString('en-GB')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => runNow(rule)} disabled={runningId === rule.id} title="Run now">
                      {runningId === rule.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(rule)} title={rule.isActive ? 'Pause' : 'Activate'}>
                      {rule.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rule)} title="Edit">
                      <span className="text-xs">✏</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => deleteRule(rule.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(isExpanded ? null : rule.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-muted/20 rounded-b-xl space-y-2">
                    {rule.description && <p className="text-sm text-muted-foreground">{rule.description}</p>}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-card border rounded-lg p-2">
                        <p className="text-muted-foreground mb-1 font-medium">TRIGGER</p>
                        <p className="font-medium">{tri?.label}</p>
                        <p className="text-muted-foreground">{tri?.desc}</p>
                        {rule.triggerConfig && Object.keys(rule.triggerConfig).length > 0 && (
                          <pre className="mt-1 text-xs bg-muted rounded p-1 overflow-auto">{JSON.stringify(rule.triggerConfig, null, 2)}</pre>
                        )}
                      </div>
                      <div className="bg-card border rounded-lg p-2">
                        <p className="text-muted-foreground mb-1 font-medium">ACTION</p>
                        <p className="font-medium">{act?.label}</p>
                        <p className="text-muted-foreground">{act?.desc}</p>
                        {rule.actionConfig && Object.keys(rule.actionConfig).length > 0 && (
                          <pre className="mt-1 text-xs bg-muted rounded p-1 overflow-auto">{JSON.stringify(rule.actionConfig, null, 2)}</pre>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No runs recorded yet</div>
          ) : logs.map(log => (
            <div key={log.id} className="border rounded-lg p-3 flex items-center gap-3 bg-card text-sm">
              {log.status === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                : log.status === 'failed' ? <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{log.rule?.name}</p>
                {log.message && <p className="text-xs text-muted-foreground truncate">{log.message}</p>}
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {new Date(log.runAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editRule ? 'Edit Rule' : 'New Automation Rule'}</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Rule Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Remind me about unpaid bills"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What does this rule do?"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              {/* Trigger */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">When to trigger *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGERS.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, trigger: t.value, triggerConfig: {} }))}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${form.trigger === t.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-950' : 'hover:border-muted-foreground'}`}>
                      <span className="text-base mr-1">{t.icon}</span>
                      <span className="font-medium">{t.label}</span>
                      <p className="text-muted-foreground mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Config */}
              {form.trigger === 'bill_due' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Days before due date</label>
                  <input type="number" min={1} max={30} value={form.triggerConfig.days ?? 3}
                    onChange={e => setForm(f => ({ ...f, triggerConfig: { days: parseInt(e.target.value) } }))}
                    className="w-24 border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              )}

              {/* Action */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Then do *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIONS.map(a => {
                    const Icon = a.icon;
                    return (
                      <button key={a.value} onClick={() => setForm(f => ({ ...f, action: a.value, actionConfig: {} }))}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${form.action === a.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-950' : 'hover:border-muted-foreground'}`}>
                        <Icon className="h-3.5 w-3.5 mb-1 inline mr-1" />
                        <span className="font-medium">{a.label}</span>
                        <p className="text-muted-foreground mt-0.5">{a.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Config */}
              {(form.action === 'send_email' || form.action === 'send_reminder') && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">To email (leave blank for account email)</label>
                    <input value={form.actionConfig.to || ''} onChange={e => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, to: e.target.value } }))}
                      placeholder="recipient@example.com"
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Subject</label>
                    <input value={form.actionConfig.subject || ''} onChange={e => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, subject: e.target.value } }))}
                      placeholder="Email subject"
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  {form.action === 'send_email' && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Body</label>
                      <textarea value={form.actionConfig.body || ''} onChange={e => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, body: e.target.value } }))}
                        rows={3} placeholder="Email body text"
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                    </div>
                  )}
                </div>
              )}

              {form.action === 'create_action' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Task title</label>
                    <input value={form.actionConfig.title || ''} onChange={e => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, title: e.target.value } }))}
                      placeholder="e.g. Review overdue invoices"
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Due in (days)</label>
                      <input type="number" min={0} value={form.actionConfig.dueDays ?? 1}
                        onChange={e => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, dueDays: parseInt(e.target.value) } }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Priority</label>
                      <select value={form.actionConfig.priority || 'medium'} onChange={e => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, priority: e.target.value } }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {form.action === 'webhook' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Webhook URL *</label>
                    <input value={form.actionConfig.url || ''} onChange={e => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, url: e.target.value } }))}
                      placeholder="https://hooks.example.com/..."
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Method</label>
                    <select value={form.actionConfig.method || 'POST'} onChange={e => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, method: e.target.value } }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option>POST</option><option>GET</option><option>PUT</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:opacity-90" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                {editRule ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
