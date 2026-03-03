'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  BarChart3, Users, Eye, Clock, MousePointerClick, ArrowDown, ArrowLeft,
  Monitor, Smartphone, Tablet, Globe, RefreshCw, Wifi,
  TrendingUp, ExternalLink, Target, Flame, Filter, Activity,
  ChevronRight, MapPin, Route, Timer,
} from 'lucide-react';

// ===== TYPES =====
interface HeatmapPoint { x: number; y: number; page: string; elementTag: string | null; elementText: string | null; elementId: string | null }
interface DailyPoint { date: string; count: number }

interface UserListItem {
  userId: string; name: string; email: string; plan: string; status: string;
  totalEvents: number; pageViews: number; clicks: number; sessions: number;
  avgDuration: number; totalDuration: number; ips: string[];
  firstSeen: string; lastSeen: string;
}

interface UserDetailPage { page: string; views: number; clicks: number; avgDuration: number; avgScroll: number }
interface UserDetailSession {
  sessionId: string; startedAt: string; endedAt: string; duration: number;
  pagesVisited: string[]; pageCount: number; clicks: number; events: number;
  maxScroll: number; viewport: string | null; userAgent: string | null; ip: string | null;
}
interface NavFlowItem { from: string; to: string; count: number }
interface TimelinePoint { hour: string; views: number; clicks: number }

const PERIOD_OPTIONS = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

// ===== HELPERS =====
function fmt(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) { const m = Math.floor(seconds / 60); return `${m}m ${seconds % 60}s`; }
  const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
function fmtDatetime(d: string) { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function parseDevice(ua: string | null) { if (!ua) return 'desktop'; if (/mobile|android|iphone/i.test(ua)) return 'mobile'; if (/tablet|ipad/i.test(ua)) return 'tablet'; return 'desktop'; }
function parseBrowser(ua: string | null) { if (!ua) return 'Unknown'; if (/edg/i.test(ua)) return 'Edge'; if (/chrome/i.test(ua) && !/edg/i.test(ua)) return 'Chrome'; if (/firefox/i.test(ua)) return 'Firefox'; if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari'; return 'Other'; }
function parseOS(ua: string | null) { if (!ua) return 'Unknown'; if (/windows/i.test(ua)) return 'Windows'; if (/mac/i.test(ua)) return 'macOS'; if (/linux/i.test(ua)) return 'Linux'; if (/android/i.test(ua)) return 'Android'; if (/iphone|ipad/i.test(ua)) return 'iOS'; return 'Other'; }
function deviceIcon(d: string) { if (d === 'mobile') return Smartphone; if (d === 'tablet') return Tablet; return Monitor; }

// ===== SHARED COMPONENTS =====
function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center`}><Icon className="h-4 w-4 text-white" /></div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function BarChart({ data, maxVal }: { data: { label: string; value: number; color?: string }[]; maxVal: number }) {
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-24 truncate shrink-0" title={d.label}>{d.label}</span>
          <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${d.color || 'bg-primary'} transition-all`} style={{ width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%` }} />
          </div>
          <span className="text-[10px] font-medium w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function HeatmapCanvas({ clicks, width = 800, height = 1200 }: { clicks: HeatmapPoint[]; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || clicks.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    const grid: Record<string, number> = {};
    clicks.forEach(c => { const gx = Math.round((c.x / 100) * width / 20) * 20; const gy = Math.round((c.y / 100) * height / 20) * 20; grid[`${gx},${gy}`] = (grid[`${gx},${gy}`] || 0) + 1; });
    const maxCount = Math.max(...Object.values(grid), 1);
    Object.entries(grid).forEach(([key, count]) => {
      const [gx, gy] = key.split(',').map(Number);
      const intensity = count / maxCount; const radius = 15 + intensity * 25;
      const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
      if (intensity > 0.7) { gradient.addColorStop(0, `rgba(239,68,68,${0.6 + intensity * 0.4})`); gradient.addColorStop(1, 'rgba(239,68,68,0)'); }
      else if (intensity > 0.4) { gradient.addColorStop(0, `rgba(251,191,36,${0.5 + intensity * 0.3})`); gradient.addColorStop(1, 'rgba(251,191,36,0)'); }
      else { gradient.addColorStop(0, `rgba(16,185,129,${0.3 + intensity * 0.3})`); gradient.addColorStop(1, 'rgba(16,185,129,0)'); }
      ctx.beginPath(); ctx.arc(gx, gy, radius, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();
    });
  }, [clicks, width, height]);
  if (clicks.length === 0) return <div className="flex items-center justify-center h-48 bg-muted/30 rounded-xl border border-dashed"><p className="text-sm text-muted-foreground">No click data yet.</p></div>;
  return <div className="overflow-auto max-h-[500px] rounded-xl border"><canvas ref={canvasRef} width={width} height={height} className="w-full" style={{ maxWidth: width }} /></div>;
}

function DailyChart({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
            {fmtDate(d.date)}: {d.count}
          </div>
          <div className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors min-h-[2px]" style={{ height: `${(d.count / maxVal) * 100}%` }} />
          <span className="text-[8px] text-muted-foreground">{fmtDate(d.date)}</span>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN DASHBOARD =====
export function AnalyticsDashboard() {
  const [mainView, setMainView] = useState<'overview' | 'users'>('overview');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [usersData, setUsersData] = useState<UserListItem[]>([]);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [heatmapPage, setHeatmapPage] = useState('/dashboard');
  const [activeTab, setActiveTab] = useState<string>('overview');

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const pageParam = activeTab === 'heatmap' ? `&page=${encodeURIComponent(heatmapPage)}` : '';
      const res = await fetch(`/api/analytics?days=${days}&view=overview${pageParam}`);
      if (res.ok) setOverviewData(await res.json());
    } catch {} finally { setLoading(false); }
  }, [days, heatmapPage, activeTab]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}&view=users`);
      if (res.ok) { const j = await res.json(); setUsersData(j.users || []); }
    } catch {} finally { setLoading(false); }
  }, [days]);

  const fetchUserDetail = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}&view=user-detail&userId=${uid}`);
      if (res.ok) setUserDetail(await res.json());
    } catch {} finally { setLoading(false); }
  }, [days]);

  useEffect(() => {
    if (selectedUserId) { fetchUserDetail(selectedUserId); return; }
    if (mainView === 'users') fetchUsers();
    else fetchOverview();
  }, [mainView, selectedUserId, fetchOverview, fetchUsers, fetchUserDetail]);

  const openUser = (uid: string) => { setSelectedUserId(uid); setActiveTab('profile'); };
  const backToList = () => { setSelectedUserId(null); setUserDetail(null); };

  // Period + refresh controls
  const controls = (
    <div className="flex items-center gap-2">
      <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-2 py-1.5 rounded-lg border bg-background text-xs">
        {PERIOD_OPTIONS.map(p => <option key={p.days} value={p.days}>{p.label}</option>)}
      </select>
      <button onClick={() => { if (selectedUserId) fetchUserDetail(selectedUserId); else if (mainView === 'users') fetchUsers(); else fetchOverview(); }} className="p-1.5 rounded-lg border hover:bg-muted transition-colors" title="Refresh">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );

  // ===== USER DETAIL VIEW =====
  if (selectedUserId && userDetail) {
    const ud = userDetail;
    const u = ud.user || {};
    const s = ud.summary || {};
    const sessions: UserDetailSession[] = ud.sessions || [];
    const pages: UserDetailPage[] = ud.pages || [];
    const heatClicks: HeatmapPoint[] = ud.heatmapClicks || [];
    const navFlow: NavFlowItem[] = ud.navFlow || [];
    const timeline: TimelinePoint[] = ud.activityTimeline || [];
    const userHeatPages = [...new Set(heatClicks.map(c => c.page))];
    const [userHeatPage, setUserHeatPage] = useState(userHeatPages[0] || '/dashboard');
    const filteredHeatClicks = heatClicks.filter(c => c.page === userHeatPage);

    const topClicks: Record<string, number> = {};
    heatClicks.forEach(c => { const k = c.elementText || c.elementId || c.elementTag || '?'; topClicks[k] = (topClicks[k] || 0) + 1; });
    const sortedClicks = Object.entries(topClicks).sort((a, b) => b[1] - a[1]).slice(0, 15);

    const tabs = ['profile', 'pages', 'heatmap', 'sessions', 'navigation', 'timeline'];

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={backToList} className="p-1.5 rounded-lg border hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
            <div>
              <h1 className="text-xl font-bold">{u.fullName || u.email || 'User'}</h1>
              <p className="text-xs text-muted-foreground">{u.email} &middot; Plan: <span className="font-medium capitalize">{u.plan || 'none'}</span></p>
            </div>
          </div>
          {controls}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard icon={Eye} label="Page Views" value={s.pageViews || 0} color="bg-emerald-500" />
          <StatCard icon={MousePointerClick} label="Clicks" value={s.clicks || 0} color="bg-amber-500" />
          <StatCard icon={Activity} label="Sessions" value={s.sessions || 0} color="bg-blue-500" />
          <StatCard icon={Clock} label="Total Time" value={fmt(s.totalDuration || 0)} color="bg-purple-500" />
          <StatCard icon={Timer} label="Avg Session" value={fmt(s.avgSessionDuration || 0)} color="bg-rose-500" />
          <StatCard icon={ExternalLink} label="Pages" value={s.uniquePages || 0} color="bg-cyan-500" />
          <StatCard icon={Wifi} label="IPs" value={(s.ips || []).length} sub={(s.ips || []).join(', ') || '—'} color="bg-slate-500" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold">User Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{u.fullName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{u.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium capitalize">{u.plan || 'none'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{u.status}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span className="font-medium">{u.createdAt ? fmtDatetime(u.createdAt) : '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IP Addresses</span><span className="font-medium font-mono text-xs">{(s.ips || []).join(', ') || '—'}</span></div>
              </div>
            </div>
            <div className="bg-card border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Top Clicked Elements</h3>
              {sortedClicks.length === 0 ? <p className="text-sm text-muted-foreground">No clicks yet.</p> : (
                <div className="space-y-1.5">
                  {sortedClicks.map(([el, count], i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30">
                      <span className="font-bold text-primary w-6 text-right">{count}×</span>
                      <span className="text-muted-foreground truncate">{el}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pages tab */}
        {activeTab === 'pages' && (
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30 text-left">
                <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Page</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right">Views</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right">Clicks</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right">Avg Time</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right">Scroll %</th>
              </tr></thead>
              <tbody>
                {pages.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No page data.</td></tr> :
                  pages.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-4 font-mono text-xs">{p.page}</td>
                      <td className="py-2 px-3 text-right text-xs">{p.views}</td>
                      <td className="py-2 px-3 text-right text-xs">{p.clicks}</td>
                      <td className="py-2 px-3 text-right text-xs">{fmt(p.avgDuration)}</td>
                      <td className="py-2 px-3 text-right text-xs">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${p.avgScroll > 70 ? 'bg-emerald-500/20 text-emerald-400' : p.avgScroll > 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                          {p.avgScroll}%
                        </span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Heatmap tab */}
        {activeTab === 'heatmap' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium">Page:</label>
              <select value={userHeatPage} onChange={(e) => setUserHeatPage(e.target.value)} className="px-2 py-1.5 rounded-lg border bg-background text-xs flex-1 max-w-sm">
                {userHeatPages.map((p, i) => <option key={i} value={p}>{p}</option>)}
                {userHeatPages.length === 0 && <option value="/dashboard">/dashboard</option>}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">{filteredHeatClicks.length} clicks on this page &middot; <span className="inline-block w-2 h-2 rounded-full bg-red-400 align-middle" /> Hot <span className="inline-block w-2 h-2 rounded-full bg-amber-400 align-middle ml-2" /> Warm <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 align-middle ml-2" /> Cool</p>
            <HeatmapCanvas clicks={filteredHeatClicks} />
          </div>
        )}

        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-3">
            {sessions.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No sessions recorded.</p> :
              sessions.map((sess, i) => {
                const Icon = deviceIcon(parseDevice(sess.userAgent));
                return (
                  <div key={i} className="bg-card border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">{parseBrowser(sess.userAgent)} &middot; {parseOS(sess.userAgent)}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{sess.viewport || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {sess.ip && <span className="font-mono flex items-center gap-1"><MapPin className="h-3 w-3" />{sess.ip}</span>}
                        <span>{fmtDatetime(sess.startedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /> {fmt(sess.duration)}</span>
                      <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3 text-muted-foreground" /> {sess.pageCount} pages</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3 text-muted-foreground" /> {sess.clicks} clicks</span>
                      <span className="flex items-center gap-1"><ArrowDown className="h-3 w-3 text-muted-foreground" /> {sess.maxScroll}% scroll</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {sess.pagesVisited.map((pg: string, j: number) => (
                        <span key={j} className="flex items-center gap-0.5">
                          <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{pg}</span>
                          {j < sess.pagesVisited.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* Navigation flow tab */}
        {activeTab === 'navigation' && (
          <div className="bg-card border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Route className="h-4 w-4 text-primary" /> Navigation Flow</h3>
            {navFlow.length === 0 ? <p className="text-sm text-muted-foreground">No navigation data yet.</p> : (
              <div className="space-y-2">
                {navFlow.map((nf, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-mono bg-muted px-2 py-1 rounded">{nf.from}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono bg-muted px-2 py-1 rounded">{nf.to}</span>
                    <span className="ml-auto font-bold text-primary">{nf.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity timeline tab */}
        {activeTab === 'timeline' && (
          <div className="bg-card border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Activity Timeline (Hourly)</h3>
            {timeline.length === 0 ? <p className="text-sm text-muted-foreground">No activity data.</p> : (
              <div className="space-y-1">
                {timeline.map((t, i) => {
                  const max = Math.max(...timeline.map(x => x.views + x.clicks), 1);
                  const total = t.views + t.clicks;
                  return (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <span className="w-28 text-muted-foreground shrink-0 font-mono">{new Date(t.hour).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: `${max > 0 ? (t.views / max) * 100 : 0}%` }} />
                        <div className="h-full bg-amber-500" style={{ width: `${max > 0 ? (t.clicks / max) * 100 : 0}%` }} />
                      </div>
                      <span className="w-16 text-right">{t.views}v {t.clicks}c</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Views</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Clicks</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ===== USERS LIST VIEW =====
  if (mainView === 'users' && !selectedUserId) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> User Analytics</h1>
            <p className="text-xs text-muted-foreground mt-1">{usersData.length} users with activity in the last {days} days</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMainView('overview')} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted">Overview</button>
            {controls}
          </div>
        </div>

        {loading ? <div className="flex justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
          <div className="space-y-2">
            {usersData.map((u, i) => {
              const Icon = deviceIcon('desktop');
              return (
                <button key={i} onClick={() => openUser(u.userId)} className="w-full bg-card border rounded-xl p-4 text-left hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm">{u.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{u.status}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium capitalize bg-blue-500/20 text-blue-400">{u.plan}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Views</span><p className="font-semibold">{u.pageViews}</p></div>
                    <div><span className="text-muted-foreground">Clicks</span><p className="font-semibold">{u.clicks}</p></div>
                    <div><span className="text-muted-foreground">Sessions</span><p className="font-semibold">{u.sessions}</p></div>
                    <div><span className="text-muted-foreground">Avg Session</span><p className="font-semibold">{fmt(u.avgDuration)}</p></div>
                    <div><span className="text-muted-foreground">Total Time</span><p className="font-semibold">{fmt(u.totalDuration)}</p></div>
                    <div><span className="text-muted-foreground">IPs</span><p className="font-semibold font-mono text-[10px]">{u.ips.length > 0 ? u.ips.join(', ') : '—'}</p></div>
                    <div><span className="text-muted-foreground">Last Seen</span><p className="font-semibold">{fmtDatetime(u.lastSeen)}</p></div>
                  </div>
                </button>
              );
            })}
            {usersData.length === 0 && <p className="text-center text-muted-foreground py-12">No user activity in this period.</p>}
          </div>
        )}
      </div>
    );
  }

  // ===== OVERVIEW VIEW (default) =====
  const data = overviewData;
  const deviceStats = data?.recentSessions?.reduce((acc: any, s: any) => { const d = parseDevice(s.userAgent); acc[d] = (acc[d] || 0) + 1; return acc; }, {} as Record<string, number>) || {};
  const browserStats = data?.recentSessions?.reduce((acc: any, s: any) => { const b = parseBrowser(s.userAgent); acc[b] = (acc[b] || 0) + 1; return acc; }, {} as Record<string, number>) || {};
  const clicksByEl = data?.heatmapData?.reduce((acc: any, h: any) => { const k = h.elementText || h.elementId || h.elementTag || '?'; acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>) || {};
  const topClicks = Object.entries(clicksByEl).sort((a: any, b: any) => b[1] - a[1]).slice(0, 20).map(([target, count]) => ({ target, count: count as number }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Analytics Overview</h1>
          <p className="text-xs text-muted-foreground mt-1">System-wide behavior tracking and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setMainView('users'); setActiveTab('overview'); }} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Per-User
          </button>
          {controls}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['overview', 'heatmap', 'sessions', 'clicks'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab === 'overview' ? 'Overview' : tab === 'heatmap' ? 'Heatmap' : tab === 'sessions' ? 'Sessions' : 'Top Clicks'}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data ? (
        <p className="text-center text-muted-foreground py-16">Failed to load analytics data.</p>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <StatCard icon={Users} label="Active Users" value={data.summary.activeUsers} color="bg-blue-500" />
                <StatCard icon={Eye} label="Page Views" value={data.summary.pageViews} color="bg-emerald-500" />
                <StatCard icon={MousePointerClick} label="Clicks" value={data.summary.clicks} color="bg-amber-500" />
                <StatCard icon={Clock} label="Avg Session" value={fmt(data.summary.avgDuration)} color="bg-purple-500" />
                <StatCard icon={Activity} label="Sessions" value={data.summary.uniqueSessions} color="bg-rose-500" />
              </div>
              <div className="bg-card border rounded-xl p-4">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Daily Activity</h3>
                <DailyChart data={data.daily} />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-card border rounded-xl p-4">
                  <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5 text-primary" /> Top Pages</h3>
                  {data.topPages.length === 0 ? <p className="text-xs text-muted-foreground">No data.</p> : data.topPages.slice(0, 10).map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
                      <button onClick={() => { setHeatmapPage(p.page); setActiveTab('heatmap'); }} className="font-mono text-[10px] hover:text-primary transition-colors truncate max-w-[75%]">{p.page}</button>
                      <span className="text-muted-foreground">{p.count}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-card border rounded-xl p-4">
                  <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><ArrowDown className="h-3.5 w-3.5 text-primary" /> Scroll Depth</h3>
                  {data.scrollDepths.length === 0 ? <p className="text-xs text-muted-foreground">No data.</p> :
                    <BarChart data={data.scrollDepths.slice(0, 8).map((s: any) => ({ label: s.page, value: s.avgDepth, color: s.avgDepth > 70 ? 'bg-emerald-500' : s.avgDepth > 40 ? 'bg-amber-500' : 'bg-red-500' }))} maxVal={100} />
                  }
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-card border rounded-xl p-4">
                  <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><Monitor className="h-3.5 w-3.5 text-primary" /> Devices</h3>
                  <div className="flex gap-3">
                    {Object.entries(deviceStats).map(([dev, count]: any, i) => {
                      const Icon = deviceIcon(dev);
                      const total = Object.values(deviceStats).reduce((s: any, c: any) => s + c, 0) as number;
                      return <div key={i} className="flex-1 text-center p-2 bg-muted/30 rounded-lg"><Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><p className="text-sm font-bold">{total > 0 ? Math.round((count / total) * 100) : 0}%</p><p className="text-[10px] text-muted-foreground capitalize">{dev}</p></div>;
                    })}
                  </div>
                </div>
                <div className="bg-card border rounded-xl p-4">
                  <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-primary" /> Browsers</h3>
                  <BarChart data={Object.entries(browserStats).sort((a: any, b: any) => b[1] - a[1]).map(([b, c]: any) => ({ label: b, value: c, color: 'bg-blue-500' }))} maxVal={Math.max(...Object.values(browserStats) as number[], 1)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select value={heatmapPage} onChange={(e) => setHeatmapPage(e.target.value)} className="px-2 py-1.5 rounded-lg border bg-background text-xs flex-1 max-w-sm">
                  {data.topPages.map((p: any, i: number) => <option key={i} value={p.page}>{p.page} ({p.count})</option>)}
                </select>
                <button onClick={fetchOverview} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-muted">Load</button>
              </div>
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <p className="text-xs text-muted-foreground mb-2">{data.heatmapData.length} clicks &middot; <span className="inline-block w-2 h-2 rounded-full bg-red-400 align-middle" /> Hot <span className="inline-block w-2 h-2 rounded-full bg-amber-400 align-middle ml-1" /> Warm <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 align-middle ml-1" /> Cool</p>
                  <HeatmapCanvas clicks={data.heatmapData} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold mb-3">Top Elements</h3>
                  <div className="space-y-1.5">{topClicks.slice(0, 15).map((c, i) => <div key={i} className="flex items-start gap-2 text-[10px] p-1.5 rounded bg-muted/30"><span className="font-bold text-primary">{c.count}×</span><span className="text-muted-foreground break-all">{c.target}</span></div>)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-card border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b bg-muted/30">
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Device</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Browser</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Viewport</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">IP</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Started</th>
                </tr></thead>
                <tbody>
                  {(data.recentSessions || []).length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No sessions.</td></tr> :
                    data.recentSessions.map((s: any, i: number) => {
                      const Icon = deviceIcon(parseDevice(s.userAgent));
                      return (
                        <tr key={i} className="border-b hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => s.userId && openUser(s.userId)}>
                          <td className="py-2 px-3 font-medium">{s.user}</td>
                          <td className="py-2 px-3"><span className="inline-flex items-center gap-1 capitalize"><Icon className="h-3 w-3" />{parseDevice(s.userAgent)}</span></td>
                          <td className="py-2 px-3">{parseBrowser(s.userAgent)}</td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">{s.viewport || '—'}</td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">{s.ip || '—'}</td>
                          <td className="py-2 px-3 text-muted-foreground">{fmtDatetime(s.startedAt)}</td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'clicks' && (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-card border rounded-xl p-4">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><MousePointerClick className="h-3.5 w-3.5 text-primary" /> Most Clicked</h3>
                {topClicks.length === 0 ? <p className="text-xs text-muted-foreground">No data.</p> :
                  topClicks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/30 mb-1.5">
                      <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">{i + 1}</div>
                      <div className="min-w-0"><p className="text-[10px] font-mono text-muted-foreground break-all">{c.target}</p><p className="text-xs font-semibold">{c.count} clicks</p></div>
                    </div>
                  ))
                }
              </div>
              <div className="bg-card border rounded-xl p-4">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><Flame className="h-3.5 w-3.5 text-red-500" /> Click Intensity</h3>
                {topClicks.length === 0 ? <p className="text-xs text-muted-foreground">No data.</p> :
                  <BarChart data={topClicks.slice(0, 10).map(c => ({ label: c.target.slice(0, 30), value: c.count, color: c.count > 50 ? 'bg-red-500' : c.count > 20 ? 'bg-amber-500' : 'bg-emerald-500' }))} maxVal={Math.max(...topClicks.map(c => c.count), 1)} />
                }
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
