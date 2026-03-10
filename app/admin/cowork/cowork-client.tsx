'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Brain, Play, Plus, Trash2, ToggleLeft, ToggleRight, Bell, BellOff,
  Clock, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp,
  Sparkles, Mail, MessageSquare, Zap, RefreshCw, Eye, Check, X, Settings,
  Calendar, BarChart2, FileText, Users, Radio, ShieldAlert, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

const TASK_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  lead_scoring:        { label: 'Lead Scoring',        icon: Users,       color: 'text-blue-600',   desc: 'Score and analyse all leads with Claude Haiku' },
  marketing_report:    { label: 'Marketing Report',    icon: BarChart2,   color: 'text-violet-600', desc: 'Full marketing performance analysis and recommendations' },
  post_generation:     { label: 'Post Generation',     icon: Radio,       color: 'text-pink-600',   desc: 'Generate social media posts for approval' },
  system_monitor:      { label: 'System Monitor',      icon: ShieldAlert, color: 'text-red-600',    desc: 'Health check — detect issues, anomalies, and alerts' },
  digest:              { label: 'Weekly Digest',       icon: FileText,    color: 'text-amber-600',  desc: 'Summary of everything: leads, posts, tasks, metrics' },
  campaign_suggestions:{ label: 'Campaign Ideas',      icon: Lightbulb,   color: 'text-yellow-600', desc: 'AI-suggested marketing campaigns based on current data' },
  error_monitor:       { label: 'Error Monitor',       icon: AlertCircle, color: 'text-orange-600', desc: 'Review task failures and system errors' },
  custom:              { label: 'Custom Task',          icon: Sparkles,    color: 'text-gray-600',   desc: 'Define your own task with a custom prompt' },
};

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual only' },
  { value: '0 9 * * *', label: 'Daily at 9am' },
  { value: '0 8 * * 1', label: 'Every Monday 8am' },
  { value: '0 9 * * 1,4', label: 'Mon & Thu 9am' },
  { value: '0 7 1 * *', label: 'Monthly (1st, 7am)' },
  { value: '*/30 * * * *', label: 'Every 30 minutes' },
];

const STATUS_STYLE: Record<string, { color: string; icon: any; label: string }> = {
  running:          { color: 'text-blue-600 bg-blue-50',    icon: Loader2,     label: 'Running' },
  success:          { color: 'text-green-700 bg-green-50',  icon: CheckCircle, label: 'Success' },
  failed:           { color: 'text-red-700 bg-red-50',      icon: XCircle,     label: 'Failed' },
  pending_approval: { color: 'text-amber-700 bg-amber-50',  icon: Clock,       label: 'Needs Approval' },
  approved:         { color: 'text-green-700 bg-green-50',  icon: Check,       label: 'Approved' },
  rejected:         { color: 'text-gray-600 bg-gray-50',    icon: X,           label: 'Rejected' },
};

interface ClaudeTask {
  id: string; name: string; description: string | null; taskType: string;
  schedule: string; isActive: boolean; requiresApproval: boolean;
  notifyEmail: boolean; notifySms: boolean; notifyInApp: boolean;
  lastRunAt: string | null; nextRunAt: string | null; runCount: number;
  logs: TaskLog[]; _count: { logs: number };
}

interface TaskLog {
  id: string; taskId: string; status: string; output: string | null;
  summary: string | null; model: string | null; errorMsg: string | null;
  runAt: string; approvedAt: string | null;
  task?: { name: string; taskType: string };
}

interface Notification {
  id: string; type: string; title: string; body: string; isRead: boolean; createdAt: string;
}

type Tab = 'tasks' | 'logs' | 'notifications';

export default function CoWorkClient() {
  const [tab, setTab] = useState<Tab>('tasks');
  const [tasks, setTasks] = useState<ClaudeTask[]>([]);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TaskLog | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', taskType: 'lead_scoring', schedule: 'manual',
    requiresApproval: false, notifyEmail: true, notifySms: false, notifyInApp: true,
    customPrompt: '',
  });

  useEffect(() => { fetchAll(); }, [tab]);

  // Poll for updates every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (tab === 'tasks') fetchTasks();
      if (tab === 'notifications') fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [tab]);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchNotifications()]);
    if (tab === 'logs') await fetchLogs();
    setLoading(false);
  }

  async function fetchTasks() {
    const res = await fetch('/api/cowork/tasks');
    if (res.ok) { const d = await res.json(); setTasks(d.tasks || []); }
  }

  async function fetchLogs() {
    const res = await fetch('/api/cowork/logs?limit=100');
    if (res.ok) { const d = await res.json(); setLogs(d.logs || []); }
  }

  async function fetchNotifications() {
    const res = await fetch('/api/cowork/notifications?limit=50');
    if (res.ok) { const d = await res.json(); setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0); }
  }

  async function runTask(taskId: string) {
    setRunning(taskId);
    try {
      await fetch('/api/cowork/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      await fetchTasks();
      if (tab === 'logs') await fetchLogs();
      await fetchNotifications();
    } finally {
      setRunning(null);
    }
  }

  async function toggleTask(taskId: string, isActive: boolean) {
    await fetch(`/api/cowork/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchTasks();
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/cowork/tasks/${taskId}`, { method: 'DELETE' });
    fetchTasks();
  }

  async function createTask() {
    const payload = {
      name: form.name,
      description: form.description || null,
      taskType: form.taskType,
      schedule: form.schedule,
      requiresApproval: form.requiresApproval,
      notifyEmail: form.notifyEmail,
      notifySms: form.notifySms,
      notifyInApp: form.notifyInApp,
      context: form.taskType === 'custom' ? { prompt: form.customPrompt } : null,
    };
    await fetch('/api/cowork/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setShowCreateDialog(false);
    setForm({ name: '', description: '', taskType: 'lead_scoring', schedule: 'manual', requiresApproval: false, notifyEmail: true, notifySms: false, notifyInApp: true, customPrompt: '' });
    fetchTasks();
  }

  async function createFromSuggestion(s: any) {
    const payload = {
      name: s.name, description: s.description, taskType: s.taskType,
      schedule: s.schedule, requiresApproval: s.requiresApproval,
      notifyEmail: true, notifySms: s.notifySms || false, notifyInApp: true,
    };
    await fetch('/api/cowork/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSuggestions(prev => prev.filter(x => x.name !== s.name));
    fetchTasks();
  }

  async function getSuggestions() {
    setLoadingSuggestions(true);
    const res = await fetch('/api/cowork/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'suggest' }) });
    const data = await res.json();
    setSuggestions(data.suggestions || []);
    setLoadingSuggestions(false);
  }

  async function approveLog(logId: string, action: 'approve' | 'reject') {
    setApproving(logId);
    await fetch('/api/cowork/logs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, action }),
    });
    setApproving(null);
    fetchLogs();
    if (selectedLog?.id === logId) setShowLogDialog(false);
  }

  async function markAllRead() {
    await fetch('/api/cowork/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) });
    fetchNotifications();
  }

  const pendingApprovals = logs.filter(l => l.status === 'pending_approval');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
            <Brain className="h-7 w-7 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Claude Co-Work</h1>
            <p className="text-sm text-muted-foreground">Autonomous AI — reads your system, executes tasks, notifies you</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={getSuggestions} variant="outline" size="sm" disabled={loadingSuggestions}>
            {loadingSuggestions ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Ask Claude to Suggest Tasks
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-700 text-white" size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        </div>
      </div>

      {/* Claude Suggestions Banner */}
      {suggestions.length > 0 && (
        <div className="border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Claude suggests {suggestions.length} tasks based on your system
            </p>
            <Button size="sm" variant="ghost" onClick={() => setSuggestions([])} className="h-7 text-xs">Dismiss all</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((s, i) => {
              const cfg = TASK_TYPE_CONFIG[s.taskType] || TASK_TYPE_CONFIG.custom;
              const Icon = cfg.icon;
              return (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border p-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Icon className={`h-5 w-5 mt-0.5 ${cfg.color} shrink-0`} />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">📅 {s.scheduleLabel} · {s.requiresApproval ? 'Needs approval' : 'Auto-execute'}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => createFromSuggestion(s)} className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs">
                    Add
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Approvals Banner */}
      {pendingApprovals.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" /> {pendingApprovals.length} task{pendingApprovals.length > 1 ? 's' : ''} waiting for your approval
          </p>
          <div className="space-y-2">
            {pendingApprovals.map(log => (
              <div key={log.id} className="bg-white dark:bg-gray-900 rounded-lg border p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{log.task?.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{log.summary}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedLog(log); setShowLogDialog(true); }}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => approveLog(log.id, 'reject')} disabled={approving === log.id}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => approveLog(log.id, 'approve')} disabled={approving === log.id}>
                    {approving === log.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />} Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'tasks', label: 'Tasks', icon: Zap },
          { key: 'logs', label: 'Execution Logs', icon: FileText },
          { key: 'notifications', label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell },
        ] as { key: Tab; label: string; icon: any }[]).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-violet-600 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.key === 'notifications' && unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{unreadCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
      ) : (
        <>
          {/* TASKS TAB */}
          {tab === 'tasks' && (
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <Brain className="h-12 w-12 text-violet-300" />
                    <p className="text-sm">No tasks yet — ask Claude to suggest tasks or create one manually</p>
                    <div className="flex gap-2">
                      <Button onClick={getSuggestions} variant="outline" size="sm" disabled={loadingSuggestions}>
                        <Sparkles className="h-4 w-4 mr-2" /> Get Suggestions
                      </Button>
                      <Button onClick={() => setShowCreateDialog(true)} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Create Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : tasks.map(task => {
                const cfg = TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.custom;
                const Icon = cfg.icon;
                const lastLog = task.logs?.[0];
                const isExpanded = expandedTask === task.id;

                return (
                  <Card key={task.id} className={`transition-all ${!task.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg bg-muted shrink-0`}>
                            <Icon className={`h-5 w-5 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">{task.name}</p>
                              {!task.isActive && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Paused</span>}
                              {task.requiresApproval && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Needs approval</span>}
                            </div>
                            {task.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {SCHEDULE_OPTIONS.find(s => s.value === task.schedule)?.label || task.schedule}</span>
                              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {task.runCount} runs</span>
                              {task.lastRunAt && <span>Last: {new Date(task.lastRunAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                              <span className="flex items-center gap-1">
                                {task.notifyEmail && <Mail className="h-3 w-3 text-blue-500" />}
                                {task.notifySms && <MessageSquare className="h-3 w-3 text-green-500" />}
                                {task.notifyInApp && <Bell className="h-3 w-3 text-violet-500" />}
                              </span>
                            </div>
                            {lastLog && (
                              <div className="mt-2">
                                {(() => {
                                  const s = STATUS_STYLE[lastLog.status] || STATUS_STYLE.failed;
                                  const SIcon = s.icon;
                                  return (
                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                                      <SIcon className={`h-3 w-3 ${lastLog.status === 'running' ? 'animate-spin' : ''}`} />
                                      {s.label} {lastLog.summary ? `— ${lastLog.summary.slice(0, 60)}...` : ''}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => runTask(task.id)} disabled={running === task.id || !task.isActive}>
                            {running === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 text-green-600" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggleTask(task.id, task.isActive)}>
                            {task.isActive ? <ToggleRight className="h-5 w-5 text-violet-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => deleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded: last output */}
                      {isExpanded && lastLog?.output && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Last Output ({lastLog.model || 'Claude'})</p>
                          <pre className="text-xs text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">{lastLog.output}</pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* LOGS TAB */}
          {tab === 'logs' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Task</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Summary</th>
                        <th className="text-left p-3 font-medium">Model</th>
                        <th className="text-left p-3 font-medium">When</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No logs yet — run a task to see results here</td></tr>
                      ) : logs.map(log => {
                        const s = STATUS_STYLE[log.status] || STATUS_STYLE.failed;
                        const SIcon = s.icon;
                        return (
                          <tr key={log.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedLog(log); setShowLogDialog(true); }}>
                            <td className="p-3">
                              <p className="font-medium">{log.task?.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{log.task?.taskType?.replace(/_/g, ' ')}</p>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                                <SIcon className={`h-3 w-3 ${log.status === 'running' ? 'animate-spin' : ''}`} />
                                {s.label}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs">
                              <p className="text-xs text-muted-foreground line-clamp-2">{log.summary || log.errorMsg || '—'}</p>
                            </td>
                            <td className="p-3 text-xs text-muted-foreground">{log.model || '—'}</td>
                            <td className="p-3 text-xs text-muted-foreground">
                              {new Date(log.runAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3" onClick={e => e.stopPropagation()}>
                              {log.status === 'pending_approval' && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => approveLog(log.id, 'reject')} disabled={approving === log.id}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => approveLog(log.id, 'approve')} disabled={approving === log.id}>
                                    {approving === log.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATIONS TAB */}
          {tab === 'notifications' && (
            <div className="space-y-3">
              {unreadCount > 0 && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={markAllRead} className="text-xs">
                    <Check className="h-3.5 w-3.5 mr-1" /> Mark all as read
                  </Button>
                </div>
              )}
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Bell className="h-10 w-10 text-violet-300" />
                    <p className="text-sm">No notifications yet</p>
                  </CardContent>
                </Card>
              ) : notifications.map(n => {
                const typeStyle: Record<string, string> = {
                  alert:   'border-l-red-500 bg-red-50 dark:bg-red-950/20',
                  warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
                  success: 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
                  info:    'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
                };
                const typeIcon: Record<string, any> = {
                  alert: AlertCircle, warning: AlertCircle, success: CheckCircle, info: Bell,
                };
                const NIcon = typeIcon[n.type] || Bell;
                return (
                  <div
                    key={n.id}
                    className={`border-l-4 rounded-lg p-4 ${typeStyle[n.type] || typeStyle.info} ${!n.isRead ? 'ring-1 ring-violet-200 dark:ring-violet-800' : 'opacity-70'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <NIcon className="h-5 w-5 mt-0.5 shrink-0" />
                        <div>
                          <p className={`text-sm font-semibold ${!n.isRead ? '' : 'text-muted-foreground'}`}>{n.title}</p>
                          <p className="text-xs mt-1 whitespace-pre-wrap">{n.body}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {!n.isRead && (
                        <div className="h-2.5 w-2.5 rounded-full bg-violet-500 mt-1 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Claude Co-Work Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task Name *</label>
              <Input placeholder="e.g. Daily Lead Intelligence" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task Type *</label>
              <Select value={form.taskType} onValueChange={v => setForm(f => ({ ...f, taskType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                          <span>{cfg.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{TASK_TYPE_CONFIG[form.taskType]?.desc}</p>
            </div>
            {form.taskType === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custom Prompt *</label>
                <Textarea placeholder="Describe what Claude should do..." value={form.customPrompt} onChange={e => setForm(f => ({ ...f, customPrompt: e.target.value }))} rows={4} />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
              <Textarea placeholder="Optional description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Schedule *</label>
              <Select value={form.schedule} onValueChange={v => setForm(f => ({ ...f, schedule: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Settings</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Requires Approval</p>
                  <p className="text-xs text-muted-foreground">Claude waits for your OK before publishing content</p>
                </div>
                <Switch checked={form.requiresApproval} onCheckedChange={v => setForm(f => ({ ...f, requiresApproval: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2"><Mail className="h-4 w-4 text-blue-500" /> Email notification</p>
                <Switch checked={form.notifyEmail} onCheckedChange={v => setForm(f => ({ ...f, notifyEmail: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4 text-green-500" /> SMS notification</p>
                  <p className="text-xs text-muted-foreground">Requires Twilio — good for critical alerts only</p>
                </div>
                <Switch checked={form.notifySms} onCheckedChange={v => setForm(f => ({ ...f, notifySms: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2"><Bell className="h-4 w-4 text-violet-500" /> In-app notification</p>
                <Switch checked={form.notifyInApp} onCheckedChange={v => setForm(f => ({ ...f, notifyInApp: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={createTask} disabled={!form.name || !form.taskType} className="bg-violet-600 hover:bg-violet-700 text-white">
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              {selectedLog?.task?.name} — Execution Result
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                {(() => { const s = STATUS_STYLE[selectedLog.status]; const SIcon = s?.icon || CheckCircle; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${s?.color}`}><SIcon className="h-3 w-3" />{s?.label}</span>; })()}
                <span>Model: {selectedLog.model || '—'}</span>
                <span>{new Date(selectedLog.runAt).toLocaleString('en-GB')}</span>
              </div>
              {selectedLog.summary && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Summary</p>
                  <p className="text-sm">{selectedLog.summary}</p>
                </div>
              )}
              {selectedLog.output && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Full Output</p>
                  <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">{selectedLog.output}</pre>
                </div>
              )}
              {selectedLog.errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Error</p>
                  <p className="text-sm text-red-600">{selectedLog.errorMsg}</p>
                </div>
              )}
              {selectedLog.status === 'pending_approval' && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" variant="outline" onClick={() => approveLog(selectedLog.id, 'reject')} disabled={approving === selectedLog.id}>
                    <X className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => approveLog(selectedLog.id, 'approve')} disabled={approving === selectedLog.id}>
                    {approving === selectedLog.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Approve & Publish
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
