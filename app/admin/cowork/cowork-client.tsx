'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brain, Play, Plus, Trash2, ToggleLeft, ToggleRight, Bell,
  Clock, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp,
  Sparkles, Mail, MessageSquare, Zap, Eye, Check, X,
  Calendar, BarChart2, FileText, Users, Radio, ShieldAlert, Lightbulb,
  Mic, MicOff, Send, Bot, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

const BUILTIN_TASK_TYPES: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  lead_scoring:         { label: 'Scoring de Leads',      icon: Users,       color: 'text-blue-600',   desc: 'Pontua e analisa todos os leads com Claude Haiku' },
  marketing_report:     { label: 'Relatório de Marketing', icon: BarChart2,   color: 'text-violet-600', desc: 'Análise completa de performance e recomendações de marketing' },
  post_generation:      { label: 'Geração de Posts',       icon: Radio,       color: 'text-pink-600',   desc: 'Gera posts para redes sociais aguardando aprovação' },
  system_monitor:       { label: 'Monitor do Sistema',     icon: ShieldAlert, color: 'text-red-600',    desc: 'Health check — detecta problemas, anomalias e alertas' },
  digest:               { label: 'Digest Semanal',         icon: FileText,    color: 'text-amber-600',  desc: 'Resumo de tudo: leads, posts, tasks e métricas' },
  campaign_suggestions: { label: 'Ideias de Campanha',     icon: Lightbulb,   color: 'text-yellow-600', desc: 'Campanhas de marketing sugeridas pela IA com base nos dados' },
  error_monitor:        { label: 'Monitor de Erros',       icon: AlertCircle, color: 'text-orange-600', desc: 'Revê falhas de tasks e erros do sistema' },
  custom:               { label: 'Task Personalizada',     icon: Sparkles,    color: 'text-gray-600',   desc: 'Define a tua própria task com um prompt personalizado' },
};

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Apenas manual' },
  { value: '0 9 * * *', label: 'Diariamente às 9h' },
  { value: '0 8 * * 1', label: 'Todas as segundas às 8h' },
  { value: '0 9 * * 1,4', label: 'Seg & Qui às 9h' },
  { value: '0 7 1 * *', label: 'Mensal (dia 1, 7h)' },
  { value: '*/30 * * * *', label: 'A cada 30 minutos' },
];

// Runtime task type registry (starts with builtins, can grow with custom types)
let _customTypes: Record<string, { label: string; icon: any; color: string; desc: string }> = {};
function getTaskTypeConfig() {
  return { ...BUILTIN_TASK_TYPES, ..._customTypes };
}
// Alias for backward compat in JSX below
function TASK_TYPE_CONFIG_FN(key: string) {
  return getTaskTypeConfig()[key] || BUILTIN_TASK_TYPES.custom;
}

const STATUS_STYLE: Record<string, { color: string; icon: any; label: string }> = {
  running:          { color: 'text-blue-600 bg-blue-50',    icon: Loader2,     label: 'A executar' },
  success:          { color: 'text-green-700 bg-green-50',  icon: CheckCircle, label: 'Concluído' },
  failed:           { color: 'text-red-700 bg-red-50',      icon: XCircle,     label: 'Falhou' },
  pending_approval: { color: 'text-amber-700 bg-amber-50',  icon: Clock,       label: 'Aguarda Aprovação' },
  approved:         { color: 'text-green-700 bg-green-50',  icon: Check,       label: 'Aprovado' },
  rejected:         { color: 'text-gray-600 bg-gray-50',    icon: X,           label: 'Rejeitado' },
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

// ── Chat message type for Claude confirmation panel ──────────────────────────
interface ChatMsg { role: 'user' | 'claude'; content: string; loading?: boolean; }

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

  // ── Voice input ────────────────────────────────────────────────────────────
  const [listening, setListening] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [interpretingVoice, setInterpretingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ── Claude confirmation chat ────────────────────────────────────────────────
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: 'claude', content: '👋 Olá! Descreve por voz ou texto o que queres que eu faça. Vou interpretar a tua solicitação, confirmar o plano e criar a task automaticamente.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // ── Dynamic custom task types (persisted in localStorage) ──────────────────
  const [customTypesList, setCustomTypesList] = useState<{ key: string; label: string; desc: string }[]>([]);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', taskType: 'lead_scoring', schedule: 'manual',
    requiresApproval: false, notifyEmail: true, notifySms: false, notifyInApp: true,
    customPrompt: '',
  });

  // Load custom types from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cowork-custom-types') || '[]');
      setCustomTypesList(stored);
      stored.forEach((t: any) => {
        _customTypes[t.key] = { label: t.label, icon: Sparkles, color: 'text-violet-500', desc: t.desc };
      });
    } catch { /* ignore */ }
  }, []);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

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
    if (!confirm('Tens a certeza que queres apagar esta task?')) return;
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

  // ── Voice input ────────────────────────────────────────────────────────────
  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported. Use Chrome or Edge.'); return; }
    const r = new SR();
    r.lang = 'pt-BR'; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setVoiceInput(text);
      setChatInput(text);
      setListening(false);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    r.start();
    setListening(true);
  }
  function stopListening() { recognitionRef.current?.stop(); setListening(false); }

  // ── Claude confirmation chat ────────────────────────────────────────────────
  async function sendChatMessage(text?: string) {
    const msg = (text || chatInput).trim();
    if (!msg) return;
    setChatInput('');
    setVoiceInput('');
    setChatMsgs(prev => [...prev, { role: 'user', content: msg }, { role: 'claude', content: '', loading: true }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: msg }],
          systemOverride: `You are the Claude Co-Work task assistant. The user wants to create or configure an autonomous task.
Analyse their request and reply in a friendly, concise way (2-4 sentences max) confirming you understood.
Then propose: task name, task type (one of: lead_scoring, marketing_report, post_generation, system_monitor, digest, campaign_suggestions, error_monitor, custom, or a NEW custom type if none fit), schedule (manual/daily 9am/weekly Monday/monthly), and whether approval is needed.
Format your reply ending with a JSON block like:
\`\`\`json
{"name":"...","taskType":"...","schedule":"...","requiresApproval":false,"description":"...","isNew":false}
\`\`\`
If isNew is true, also include "newTypeLabel" and "newTypeDesc" fields.
Always reply in the same language the user used.`,
        }),
      });
      const data = await res.json();
      const reply: string = data.content || data.message || 'Entendido! Podes confirmar os detalhes abaixo.';

      // Extract JSON plan from reply
      const jsonMatch = reply.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const plan = JSON.parse(jsonMatch[1]);
          // Auto-register new type if needed
          if (plan.isNew && plan.taskType && plan.newTypeLabel) {
            const newKey = plan.taskType.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            _customTypes[newKey] = { label: plan.newTypeLabel, icon: Sparkles, color: 'text-violet-500', desc: plan.newTypeDesc || '' };
            const stored = JSON.parse(localStorage.getItem('cowork-custom-types') || '[]');
            stored.push({ key: newKey, label: plan.newTypeLabel, desc: plan.newTypeDesc || '' });
            localStorage.setItem('cowork-custom-types', JSON.stringify(stored));
            setCustomTypesList(stored);
            plan.taskType = newKey;
          }
          // Pre-fill the form
          setForm(f => ({
            ...f,
            name: plan.name || f.name,
            taskType: plan.taskType || f.taskType,
            schedule: plan.schedule || f.schedule,
            requiresApproval: plan.requiresApproval ?? f.requiresApproval,
            description: plan.description || f.description,
          }));
        } catch { /* JSON parse failed, ignore */ }
      }

      // Show reply without the json block
      const cleanReply = reply.replace(/```json[\s\S]*?```/g, '').trim();
      setChatMsgs(prev => prev.slice(0, -1).concat({
        role: 'claude',
        content: cleanReply + '\n\n✅ *Preenchi o formulário com o plano. Revisa e clica em **Criar Task** quando estiveres pronto.*',
      }));
    } catch {
      setChatMsgs(prev => prev.slice(0, -1).concat({ role: 'claude', content: '❌ Erro ao contactar Claude. Tenta novamente.' }));
    } finally {
      setChatLoading(false);
    }
  }

  // ── Add new custom task type ────────────────────────────────────────────────
  function addCustomType() {
    if (!newTypeName.trim()) return;
    const key = newTypeName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    _customTypes[key] = { label: newTypeName, icon: Sparkles, color: 'text-violet-500', desc: newTypeDesc };
    const updated = [...customTypesList, { key, label: newTypeName, desc: newTypeDesc }];
    setCustomTypesList(updated);
    localStorage.setItem('cowork-custom-types', JSON.stringify(updated));
    setForm(f => ({ ...f, taskType: key }));
    setNewTypeName(''); setNewTypeDesc(''); setShowAddType(false);
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
            <p className="text-sm text-muted-foreground">IA Autónoma — lê o teu sistema, executa tasks e notifica-te</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setShowChatPanel(p => !p); setShowCreateDialog(false); }} variant="outline" size="sm" className={showChatPanel ? 'border-violet-500 text-violet-600' : ''}>
            <Bot className="h-4 w-4 mr-2" /> Falar com Claude
          </Button>
          <Button onClick={getSuggestions} variant="outline" size="sm" disabled={loadingSuggestions}>
            {loadingSuggestions ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Sugerir Tasks
          </Button>
          <Button onClick={() => { setShowCreateDialog(true); setShowChatPanel(false); }} className="bg-violet-600 hover:bg-violet-700 text-white" size="sm">
            <Plus className="h-4 w-4 mr-2" /> Nova Task
          </Button>
        </div>
      </div>

      {/* ── Claude Chat + Create Panel ─────────────────────────────────────────── */}
      {showChatPanel && (
        <div className="border border-violet-200 dark:border-violet-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Assistente Claude Co-Work</span>
              <span className="text-xs opacity-70">· Descreve por voz ou texto o que queres que eu faça</span>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-white/20" onClick={() => setShowChatPanel(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
            {/* Chat messages */}
            <div className="flex flex-col" style={{minHeight: '320px', maxHeight: '420px'}}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-sm rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-violet-600 text-white rounded-tr-sm'
                        : 'bg-card border rounded-tl-sm'
                    }`}>
                      {m.loading
                        ? <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> A pensar...</span>
                        : <span className="whitespace-pre-wrap leading-relaxed">{m.content}</span>
                      }
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {/* Voice + text input */}
              <div className="border-t p-3 bg-card flex gap-2">
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                    listening ? 'bg-red-500 text-white animate-pulse' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                  title={listening ? 'Parar' : 'Falar'}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder={listening ? '🎙️ A ouvir...' : 'Ex: quero monitorar erros do sistema todos os dias às 9h...'}
                  className="flex-1 text-sm"
                  disabled={chatLoading}
                />
                <Button size="sm" onClick={() => sendChatMessage()} disabled={!chatInput.trim() || chatLoading} className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white h-9 w-9 p-0">
                  {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Form preview — pre-filled by Claude */}
            <div className="p-4 bg-card space-y-3 overflow-y-auto" style={{maxHeight: '420px'}}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Plano da Task (podes editar)
              </p>
              <div className="space-y-2">
                <Input placeholder="Nome da task *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-sm" />
                <div className="flex gap-2">
                  <Select value={form.taskType} onValueChange={v => setForm(f => ({ ...f, taskType: v }))}>
                    <SelectTrigger className="text-sm flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(getTaskTypeConfig()).map(([k, c]) => (
                        <SelectItem key={k} value={k}><span className="text-sm">{c.label}</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={() => setShowAddType(p => !p)} className="shrink-0 h-9 w-9 rounded-md border flex items-center justify-center hover:bg-muted transition-colors" title="Criar novo tipo">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {showAddType && (
                  <div className="border rounded-lg p-2 space-y-1.5 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">Novo tipo de task</p>
                    <Input placeholder="Nome do tipo (ex: Monitor HMRC)" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} className="text-xs h-7" />
                    <Input placeholder="Descrição breve do tipo" value={newTypeDesc} onChange={e => setNewTypeDesc(e.target.value)} className="text-xs h-7" />
                    <Button size="sm" onClick={addCustomType} disabled={!newTypeName.trim()} className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white w-full">Criar Tipo</Button>
                  </div>
                )}
                <Select value={form.schedule} onValueChange={v => setForm(f => ({ ...f, schedule: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{SCHEDULE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Descrição / contexto da task" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="text-sm" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requer Aprovação</span>
                  <Switch checked={form.requiresApproval} onCheckedChange={v => setForm(f => ({ ...f, requiresApproval: v }))} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3.5 w-3.5 text-blue-500" /> Email</span>
                  <Switch checked={form.notifyEmail} onCheckedChange={v => setForm(f => ({ ...f, notifyEmail: v }))} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Bell className="h-3.5 w-3.5 text-violet-500" /> In-app</span>
                  <Switch checked={form.notifyInApp} onCheckedChange={v => setForm(f => ({ ...f, notifyInApp: v }))} />
                </div>
              </div>
              <Button onClick={async () => { await createTask(); setShowChatPanel(false); setChatMsgs([{ role: 'claude', content: '✅ Task criada com sucesso! Podes pedir-me outra tarefa, pedir sugestões, ou fechar este painel.' }]); }} disabled={!form.name} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                <CheckCircle className="h-4 w-4 mr-2" /> Criar Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Claude Suggestions Banner */}
      {suggestions.length > 0 && (
        <div className="border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Claude sugere {suggestions.length} tasks com base no teu sistema
            </p>
            <Button size="sm" variant="ghost" onClick={() => setSuggestions([])} className="h-7 text-xs">Dispensar todas</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((s, i) => {
              const cfg = TASK_TYPE_CONFIG_FN(s.taskType);
              const Icon = cfg.icon;
              return (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border p-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Icon className={`h-5 w-5 mt-0.5 ${cfg.color} shrink-0`} />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">📅 {s.scheduleLabel} · {s.requiresApproval ? 'Requer aprovação' : 'Execução automática'}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => createFromSuggestion(s)} className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs">
                    Adicionar
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
            <Clock className="h-4 w-4" /> {pendingApprovals.length} task{pendingApprovals.length > 1 ? 's' : ''} a aguardar a tua aprovação
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
                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => approveLog(log.id, 'reject')} disabled={approving === log.id}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => approveLog(log.id, 'approve')} disabled={approving === log.id}>
                    {approving === log.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />} Aprovar
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
          { key: 'logs', label: 'Registo de Execuções', icon: FileText },
          { key: 'notifications', label: `Notificações${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell },
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
                    <p className="text-sm">Ainda sem tasks — pede ao Claude para sugerir ou cria uma manualmente</p>
                    <div className="flex gap-2">
                      <Button onClick={getSuggestions} variant="outline" size="sm" disabled={loadingSuggestions}>
                        <Sparkles className="h-4 w-4 mr-2" /> Pedir Sugestões
                      </Button>
                      <Button onClick={() => setShowCreateDialog(true)} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Criar Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : tasks.map(task => {
                const cfg = TASK_TYPE_CONFIG_FN(task.taskType);
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
                              {!task.isActive && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Pausada</span>}
                              {task.requiresApproval && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Requer aprovação</span>}
                            </div>
                            {task.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {SCHEDULE_OPTIONS.find(s => s.value === task.schedule)?.label || task.schedule}</span>
                              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {task.runCount} execuções</span>
                              {task.lastRunAt && <span>Última: {new Date(task.lastRunAt).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
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
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Último Resultado ({lastLog.model || 'Claude'})</p>
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
                        <th className="text-left p-3 font-medium">Estado</th>
                        <th className="text-left p-3 font-medium">Resumo</th>
                        <th className="text-left p-3 font-medium">Modelo</th>
                        <th className="text-left p-3 font-medium">Quando</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Ainda sem registos — executa uma task para ver resultados aqui</td></tr>
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
                              {new Date(log.runAt).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
                    <Check className="h-3.5 w-3.5 mr-1" /> Marcar todas como lidas
                  </Button>
                </div>
              )}
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Bell className="h-10 w-10 text-violet-300" />
                    <p className="text-sm">Ainda sem notificações</p>
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
          <DialogHeader><DialogTitle>Criar Task Claude Co-Work</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome da Task *</label>
              <Input placeholder="ex: Inteligência Diária de Leads" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo de Task *</label>
              <Select value={form.taskType} onValueChange={v => setForm(f => ({ ...f, taskType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(getTaskTypeConfig()).map(([key, cfg]) => {
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
              <p className="text-xs text-muted-foreground">{TASK_TYPE_CONFIG_FN(form.taskType)?.desc}</p>
            </div>
            {form.taskType === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prompt Personalizado *</label>
                <Textarea placeholder="Descreve o que o Claude deve fazer..." value={form.customPrompt} onChange={e => setForm(f => ({ ...f, customPrompt: e.target.value }))} rows={4} />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</label>
              <Textarea placeholder="Descrição opcional..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agendamento *</label>
              <Select value={form.schedule} onValueChange={v => setForm(f => ({ ...f, schedule: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Configurações</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Requer Aprovação</p>
                  <p className="text-xs text-muted-foreground">Claude aguarda o teu OK antes de publicar conteúdo</p>
                </div>
                <Switch checked={form.requiresApproval} onCheckedChange={v => setForm(f => ({ ...f, requiresApproval: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2"><Mail className="h-4 w-4 text-blue-500" /> Notificação por Email</p>
                <Switch checked={form.notifyEmail} onCheckedChange={v => setForm(f => ({ ...f, notifyEmail: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4 text-green-500" /> Notificação SMS</p>
                  <p className="text-xs text-muted-foreground">Requer Twilio — indicado apenas para alertas críticos</p>
                </div>
                <Switch checked={form.notifySms} onCheckedChange={v => setForm(f => ({ ...f, notifySms: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2"><Bell className="h-4 w-4 text-violet-500" /> Notificação no App</p>
                <Switch checked={form.notifyInApp} onCheckedChange={v => setForm(f => ({ ...f, notifyInApp: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={createTask} disabled={!form.name || !form.taskType} className="bg-violet-600 hover:bg-violet-700 text-white">
              Criar Task
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
              {selectedLog?.task?.name} — Resultado da Execução
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                {(() => { const s = STATUS_STYLE[selectedLog.status]; const SIcon = s?.icon || CheckCircle; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${s?.color}`}><SIcon className="h-3 w-3" />{s?.label}</span>; })()}
                <span>Modelo: {selectedLog.model || '—'}</span>
                <span>{new Date(selectedLog.runAt).toLocaleString('en-GB')}</span>
              </div>
              {selectedLog.summary && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Resumo</p>
                  <p className="text-sm">{selectedLog.summary}</p>
                </div>
              )}
              {selectedLog.output && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Saída Completa</p>
                  <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">{selectedLog.output}</pre>
                </div>
              )}
              {selectedLog.errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Erro</p>
                  <p className="text-sm text-red-600">{selectedLog.errorMsg}</p>
                </div>
              )}
              {selectedLog.status === 'pending_approval' && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" variant="outline" onClick={() => approveLog(selectedLog.id, 'reject')} disabled={approving === selectedLog.id}>
                    <X className="h-4 w-4 mr-2" /> Rejeitar
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => approveLog(selectedLog.id, 'approve')} disabled={approving === selectedLog.id}>
                    {approving === selectedLog.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Aprovar e Publicar
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
