'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Camera, Video, Terminal, Printer, Eye, Clock, MousePointerClick,
  Monitor, Smartphone, Tablet, AlertTriangle, Shield, Play, Square, RefreshCw,
  User, Activity, ChevronRight, Globe, Layers, Filter, Search, X,
} from 'lucide-react';

// ── Types ──
interface SessionItem {
  id: string;
  userId: string;
  sessionToken: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  userAgent: string | null;
  viewport: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  pagesVisited: number;
  clickCount: number;
  scrollEvents: number;
  hasRecording: boolean;
  recordingSize: number;
  isActive: boolean;
  recordingData?: any[];
  user: { fullName: string; email: string };
}

interface AlertItem {
  id: string;
  userId: string;
  sessionId: string | null;
  alertType: string;
  method: string | null;
  page: string;
  keyCombo: string | null;
  viewport: string | null;
  userAgent: string | null;
  ip: string | null;
  metadata: any;
  createdAt: string;
  user: { fullName: string; email: string };
}

interface AlertSummary {
  alertType: string;
  _count: { id: number };
}

// ── Helpers ──
function fmt(seconds: number | null): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function fmtTime(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const ALERT_CONFIG: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  screenshot: { icon: Camera, color: 'text-amber-600', label: 'Screenshot', bg: 'bg-amber-100' },
  screen_recording: { icon: Video, color: 'text-red-600', label: 'Screen Recording', bg: 'bg-red-100' },
  devtools: { icon: Terminal, color: 'text-purple-600', label: 'DevTools', bg: 'bg-purple-100' },
  print: { icon: Printer, color: 'text-blue-600', label: 'Print', bg: 'bg-blue-100' },
};

function DeviceIcon({ device }: { device: string | null }) {
  if (device === 'mobile') return <Smartphone className="h-4 w-4" />;
  if (device === 'tablet') return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

// ── Main Dashboard ──
export function MonitoringDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<'sessions' | 'alerts' | 'replay'>('sessions');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);
  const [filterUser, setFilterUser] = useState('');

  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessRes, alertRes] = await Promise.all([
        fetch('/api/analytics/sessions?limit=100'),
        fetch('/api/analytics/alerts?limit=200'),
      ]);
      if (sessRes.ok) {
        const data = await sessRes.json();
        setSessions(data.sessions || []);
      }
      if (alertRes.ok) {
        const data = await alertRes.json();
        setAlerts(data.alerts || []);
        setAlertSummary(data.summary || []);
      }
    } catch (e) {
      console.error('Failed to fetch monitoring data', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const loadReplay = useCallback(async (sess: SessionItem) => {
    try {
      const res = await fetch(`/api/analytics/sessions?userId=${sess.userId}&recording=true&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const full = data.sessions?.find((s: any) => s.id === sess.id);
        if (full) {
          setSelectedSession(full);
          setTab('replay');
          return;
        }
      }
    } catch {}
    setSelectedSession(sess);
    setTab('replay');
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <p className="text-muted-foreground mt-2">You need admin privileges to access monitoring.</p>
      </div>
    );
  }

  const filteredSessions = filterUser
    ? sessions.filter(s => s.user.email.toLowerCase().includes(filterUser.toLowerCase()) || s.user.fullName.toLowerCase().includes(filterUser.toLowerCase()))
    : sessions;

  const filteredAlerts = filterUser
    ? alerts.filter(a => a.user.email.toLowerCase().includes(filterUser.toLowerCase()) || a.user.fullName.toLowerCase().includes(filterUser.toLowerCase()))
    : alerts;

  const totalAlerts = alertSummary.reduce((sum, a) => sum + a._count.id, 0);
  const activeSessions = sessions.filter(s => s.isActive).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/analytics')} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-amber-600" />
              User Monitoring
            </h1>
            <p className="text-sm text-muted-foreground">Session recordings, screenshot alerts, and behavior tracking</p>
          </div>
        </div>
        <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Activity} label="Sessions" value={sessions.length} color="bg-blue-500" />
        <StatCard icon={Eye} label="Active Now" value={activeSessions} color="bg-green-500" />
        <StatCard icon={AlertTriangle} label="Total Alerts" value={totalAlerts} color="bg-red-500" />
        {alertSummary.map(s => {
          const cfg = ALERT_CONFIG[s.alertType] || { icon: AlertTriangle, color: 'text-gray-600', label: s.alertType, bg: 'bg-gray-100' };
          return (
            <StatCard key={s.alertType} icon={cfg.icon} label={cfg.label} value={s._count.id} color={s.alertType === 'screenshot' ? 'bg-amber-500' : s.alertType === 'screen_recording' ? 'bg-red-500' : 'bg-purple-500'} />
          );
        })}
      </div>

      {/* Filter + Tabs */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['sessions', 'alerts'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'sessions' ? 'Sessions' : 'Alerts'}
              {t === 'alerts' && totalAlerts > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">{totalAlerts}</span>
              )}
            </button>
          ))}
          {selectedSession && (
            <button onClick={() => setTab('replay')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'replay' ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'}`}>
              Replay
            </button>
          )}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by user..."
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm bg-background"
          />
          {filterUser && (
            <button onClick={() => setFilterUser('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tab === 'sessions' ? (
        <SessionsTab sessions={filteredSessions} onReplay={loadReplay} />
      ) : tab === 'alerts' ? (
        <AlertsTab alerts={filteredAlerts} summary={alertSummary} />
      ) : tab === 'replay' && selectedSession ? (
        <ReplayTab session={selectedSession} onBack={() => setTab('sessions')} />
      ) : null}
    </div>
  );
}

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={`h-7 w-7 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

// ── Sessions Tab ──
function SessionsTab({ sessions, onReplay }: { sessions: SessionItem[]; onReplay: (s: SessionItem) => void }) {
  if (sessions.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">No sessions recorded yet</div>;
  }

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div key={s.id} className={`bg-card border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors ${s.isActive ? 'border-green-300 bg-green-50/30' : ''}`}>
          {/* User */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{s.user.fullName}</span>
              {s.isActive && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">LIVE</span>}
            </div>
            <div className="text-xs text-muted-foreground">{s.user.email}</div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><DeviceIcon device={s.device} />{s.browser || '?'}</div>
            <div className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{s.pagesVisited} pages</div>
            <div className="flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" />{s.clickCount} clicks</div>
            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmt(s.duration)}</div>
            <div className="text-xs">{fmtTime(s.startedAt)}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {s.hasRecording && (
              <button onClick={() => onReplay(s)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">
                <Play className="h-3.5 w-3.5" /> Replay
              </button>
            )}
            {!s.hasRecording && (
              <span className="text-xs text-muted-foreground px-2">No recording</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Alerts Tab ──
function AlertsTab({ alerts, summary }: { alerts: AlertItem[]; summary: AlertSummary[] }) {
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = typeFilter === 'all' ? alerts : alerts.filter(a => a.alertType === typeFilter);

  return (
    <div className="space-y-4">
      {/* Type filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}>
          All ({alerts.length})
        </button>
        {summary.map(s => {
          const cfg = ALERT_CONFIG[s.alertType] || { icon: AlertTriangle, label: s.alertType, bg: 'bg-gray-100', color: 'text-gray-600' };
          return (
            <button key={s.alertType} onClick={() => setTypeFilter(s.alertType)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter === s.alertType ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}>
              {cfg.label} ({s._count.id})
            </button>
          );
        })}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No alerts recorded{typeFilter !== 'all' ? ' for this type' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const cfg = ALERT_CONFIG[a.alertType] || { icon: AlertTriangle, color: 'text-gray-600', label: a.alertType, bg: 'bg-gray-100' };
            const Icon = cfg.icon;
            return (
              <div key={a.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{cfg.label}</span>
                    {a.method && <span className="text-xs text-muted-foreground">via {a.method}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {a.user.fullName} ({a.user.email}) — {a.page}
                  </div>
                  {a.keyCombo && <div className="text-xs mt-1"><code className="bg-muted px-1.5 py-0.5 rounded">{a.keyCombo}</code></div>}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {fmtTime(a.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Replay Tab (DOM event timeline) ──
function ReplayTab({ session: sess, onBack }: { session: SessionItem; onBack: () => void }) {
  const events = (sess.recordingData || []) as any[];
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pageViews = events.filter(e => e.type === 'page_view');
  const clicks = events.filter(e => e.type === 'click');
  const screenshots = events.filter(e => e.type === 'screenshot_attempt' || e.type === 'recording_attempt');
  const scrolls = events.filter(e => e.type === 'scroll');

  const play = useCallback(() => {
    if (events.length === 0) return;
    setPlaying(true);
    let idx = currentIdx;
    const tick = () => {
      if (idx >= events.length - 1) {
        setPlaying(false);
        return;
      }
      idx++;
      setCurrentIdx(idx);
      const delay = Math.min(events[idx].timestamp - events[idx - 1].timestamp, 3000);
      timerRef.current = setTimeout(tick, Math.max(delay, 100));
    };
    tick();
  }, [events, currentIdx]);

  const stop = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  const currentEvent = events[currentIdx];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1">
          <h3 className="font-semibold">{sess.user.fullName} — Session Replay</h3>
          <p className="text-xs text-muted-foreground">{fmtTime(sess.startedAt)} — {fmt(sess.duration)} — {events.length} events</p>
        </div>
        <div className="flex gap-2">
          {!playing ? (
            <button onClick={play} disabled={events.length === 0} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              <Play className="h-4 w-4" /> Play
            </button>
          ) : (
            <button onClick={stop} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              <Square className="h-4 w-4" /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-muted rounded-full h-2 overflow-hidden">
        <div className="bg-primary h-full transition-all duration-200" style={{ width: `${events.length > 0 ? (currentIdx / (events.length - 1)) * 100 : 0}%` }} />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Pages" value={pageViews.length} icon={Globe} />
        <MiniStat label="Clicks" value={clicks.length} icon={MousePointerClick} />
        <MiniStat label="Scrolls" value={scrolls.length} icon={Activity} />
        <MiniStat label="Alerts" value={screenshots.length} icon={AlertTriangle} color={screenshots.length > 0 ? 'text-red-600' : undefined} />
      </div>

      {/* Current event display */}
      {currentEvent && (
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-mono">{currentEvent.type}</span>
            <span className="text-xs text-muted-foreground">
              Event {currentIdx + 1} of {events.length}
            </span>
          </div>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
            {JSON.stringify(currentEvent.data, null, 2)}
          </pre>
        </div>
      )}

      {/* Click heatmap visualization */}
      {clicks.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h4 className="font-semibold text-sm mb-3">Click Heatmap</h4>
          <div className="relative bg-muted rounded-lg" style={{ height: 400, overflow: 'hidden' }}>
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
            {/* Click dots */}
            {clicks.map((c, i) => (
              <div key={i} className="absolute" style={{
                left: `${c.data.x}%`,
                top: `${Math.min(c.data.y, 100)}%`,
                transform: 'translate(-50%, -50%)',
              }}>
                <div className="h-4 w-4 rounded-full bg-red-500/60 border-2 border-red-500 animate-pulse" />
              </div>
            ))}
            {/* Labels at top */}
            <div className="absolute top-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              {clicks.length} clicks across {pageViews.length} pages
            </div>
          </div>
        </div>
      )}

      {/* Event timeline */}
      <div className="bg-card border rounded-xl p-4">
        <h4 className="font-semibold text-sm mb-3">Event Timeline</h4>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {events.map((ev, i) => {
            const isAlert = ev.type.includes('screenshot') || ev.type.includes('recording') || ev.type.includes('devtools') || ev.type.includes('print');
            const isCurrent = i === currentIdx;
            return (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`w-full text-left px-3 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${isCurrent ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'} ${isAlert ? 'text-red-600 font-medium' : ''}`}>
                <span className="w-12 text-muted-foreground font-mono text-[10px]">{i + 1}</span>
                <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${isAlert ? 'bg-red-100 text-red-700' : 'bg-muted'}`}>{ev.type}</span>
                <span className="truncate text-muted-foreground">{ev.data?.path || ev.data?.text?.slice(0, 40) || ''}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color || 'text-muted-foreground'}`} />
      <p className={`text-lg font-bold ${color || ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
