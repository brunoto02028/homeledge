'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  BarChart3, Users, Eye, Clock, MousePointerClick, ArrowDown,
  Monitor, Smartphone, Tablet, Globe, RefreshCw,
  TrendingUp, ExternalLink, Target, Flame, Filter, Activity,
} from 'lucide-react';

interface SummaryData {
  totalEvents: number;
  uniqueSessions: number;
  pageViews: number;
  clicks: number;
  activeUsers: number;
  avgDuration: number;
  days: number;
}

interface TopPage {
  page: string;
  count: number;
}

interface HeatmapPoint {
  x: number;
  y: number;
  page: string;
  elementTag: string | null;
  elementText: string | null;
  elementId: string | null;
}

interface ScrollDepth {
  page: string;
  avgDepth: number;
}

interface DailyPoint {
  date: string;
  count: number;
}

interface RecentSession {
  sessionId: string;
  user: string;
  userId: string | null;
  viewport: string | null;
  userAgent: string | null;
  startedAt: string;
}

interface DashboardData {
  summary: SummaryData;
  topPages: TopPage[];
  heatmapData: HeatmapPoint[];
  scrollDepths: ScrollDepth[];
  daily: DailyPoint[];
  recentSessions: RecentSession[];
}

const PERIOD_OPTIONS = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function parseDevice(ua: string | null): string {
  if (!ua) return 'desktop';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function parseBrowser(ua: string | null): string {
  if (!ua) return 'Unknown';
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  return 'Other';
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function MiniBarChart({ data, maxVal }: { data: { label: string; value: number; color?: string }[]; maxVal: number }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 truncate shrink-0">{d.label}</span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${d.color || 'bg-primary'} transition-all duration-500`}
              style={{ width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-medium w-10 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// Heatmap canvas component
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

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Aggregate nearby clicks for intensity
    const grid: Record<string, number> = {};
    clicks.forEach(click => {
      const gx = Math.round((click.x / 100) * width / 20) * 20;
      const gy = Math.round((click.y / 100) * height / 20) * 20;
      const key = `${gx},${gy}`;
      grid[key] = (grid[key] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(grid), 1);

    // Draw heat dots
    Object.entries(grid).forEach(([key, count]) => {
      const [gx, gy] = key.split(',').map(Number);
      const intensity = count / maxCount;
      const radius = 15 + intensity * 25;

      const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
      if (intensity > 0.7) {
        gradient.addColorStop(0, `rgba(239, 68, 68, ${0.6 + intensity * 0.4})`);
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (intensity > 0.4) {
        gradient.addColorStop(0, `rgba(251, 191, 36, ${0.5 + intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      } else {
        gradient.addColorStop(0, `rgba(16, 185, 129, ${0.3 + intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }

      ctx.beginPath();
      ctx.arc(gx, gy, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Legend
    ctx.font = '12px system-ui';
    const legend = [
      { color: '#ef4444', label: 'Hot (many clicks)' },
      { color: '#fbbf24', label: 'Warm' },
      { color: '#10b981', label: 'Cool (few clicks)' },
    ];
    legend.forEach((item, i) => {
      ctx.fillStyle = item.color;
      ctx.beginPath(); ctx.arc(16, height - 60 + i * 20, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(item.label, 28, height - 56 + i * 20);
    });
  }, [clicks, width, height]);

  if (clicks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">No click data yet for this page.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[600px] rounded-xl border">
      <canvas ref={canvasRef} width={width} height={height} className="w-full" style={{ maxWidth: width }} />
    </div>
  );
}

function DailyTrendChart({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  const maxVal = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded-lg px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
            {formatDate(d.date)}: {d.count} events
          </div>
          <div
            className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors min-h-[2px]"
            style={{ height: `${(d.count / maxVal) * 100}%` }}
          />
          <span className="text-[9px] text-muted-foreground">{formatDate(d.date)}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [heatmapPage, setHeatmapPage] = useState('/dashboard');
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'sessions' | 'clicks'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pageFilter = activeTab === 'heatmap' ? `&page=${encodeURIComponent(heatmapPage)}` : '';
      const res = await fetch(`/api/analytics?days=${days}${pageFilter}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  }, [days, heatmapPage, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derive device/browser stats from sessions
  const deviceStats = data?.recentSessions.reduce((acc, s) => {
    const d = parseDevice(s.userAgent);
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const browserStats = data?.recentSessions.reduce((acc, s) => {
    const b = parseBrowser(s.userAgent);
    acc[b] = (acc[b] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Top clicked elements from heatmap data
  const clicksByElement = data?.heatmapData.reduce((acc, h) => {
    const key = h.elementText || h.elementId || h.elementTag || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const topClicks = Object.entries(clicksByElement)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([target, count]) => ({ target, count }));

  const deviceIcon = (d: string) => {
    if (d === 'mobile') return Smartphone;
    if (d === 'tablet') return Tablet;
    return Monitor;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            User Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">User behavior tracking, click heatmaps, and session insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          >
            {PERIOD_OPTIONS.map(p => (
              <option key={p.days} value={p.days}>{p.label}</option>
            ))}
          </select>
          <button onClick={fetchData} className="p-2 rounded-lg border hover:bg-muted transition-colors" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['overview', 'heatmap', 'sessions', 'clicks'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'heatmap' && 'Click Heatmap'}
            {tab === 'sessions' && 'Sessions'}
            {tab === 'clicks' && 'Top Clicks'}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <p className="text-center text-muted-foreground py-16">Failed to load analytics data.</p>
      ) : (
        <>
          {/* === OVERVIEW TAB === */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Users} label="Active Users" value={data.summary.activeUsers} color="bg-blue-500" />
                <StatCard icon={Eye} label="Page Views" value={data.summary.pageViews} color="bg-emerald-500" />
                <StatCard icon={MousePointerClick} label="Clicks" value={data.summary.clicks} color="bg-amber-500" />
                <StatCard icon={Clock} label="Avg. Session" value={formatDuration(data.summary.avgDuration)} color="bg-purple-500" />
                <StatCard icon={Activity} label="Sessions" value={data.summary.uniqueSessions} color="bg-rose-500" />
              </div>

              {/* Daily Trend */}
              <div className="bg-card border rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Daily Activity
                </h3>
                <DailyTrendChart data={data.daily} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" /> Top Pages
                  </h3>
                  <div className="space-y-3">
                    {data.topPages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No page views yet.</p>
                    ) : (
                      data.topPages.slice(0, 10).map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <button
                            onClick={() => { setHeatmapPage(p.page); setActiveTab('heatmap'); }}
                            className="text-left hover:text-primary transition-colors truncate max-w-[70%] font-mono text-xs"
                          >
                            {p.page}
                          </button>
                          <span className="text-xs text-muted-foreground">{p.count} views</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Scroll Depths */}
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-primary" /> Scroll Depth by Page
                  </h3>
                  {data.scrollDepths.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No scroll data yet.</p>
                  ) : (
                    <MiniBarChart
                      data={data.scrollDepths.slice(0, 8).map(s => ({
                        label: s.page,
                        value: s.avgDepth,
                        color: s.avgDepth > 70 ? 'bg-emerald-500' : s.avgDepth > 40 ? 'bg-amber-500' : 'bg-red-500'
                      }))}
                      maxVal={100}
                    />
                  )}
                </div>
              </div>

              {/* Devices & Browsers */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" /> Devices
                  </h3>
                  {Object.keys(deviceStats).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet.</p>
                  ) : (
                    <div className="flex gap-4">
                      {Object.entries(deviceStats).map(([device, count], i) => {
                        const Icon = deviceIcon(device);
                        const total = Object.values(deviceStats).reduce((s, c) => s + c, 0);
                        return (
                          <div key={i} className="flex-1 text-center p-3 bg-muted/30 rounded-lg">
                            <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-lg font-bold">{total > 0 ? Math.round((count / total) * 100) : 0}%</p>
                            <p className="text-xs text-muted-foreground capitalize">{device}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Browsers
                  </h3>
                  <MiniBarChart
                    data={Object.entries(browserStats).sort((a, b) => b[1] - a[1]).map(([b, c]) => ({ label: b, value: c, color: 'bg-blue-500' }))}
                    maxVal={Math.max(...Object.values(browserStats), 1)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* === HEATMAP TAB === */}
          {activeTab === 'heatmap' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Page:</label>
                <select
                  value={heatmapPage}
                  onChange={(e) => setHeatmapPage(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm flex-1 max-w-md"
                >
                  {data.topPages.map((p, i) => (
                    <option key={i} value={p.page}>{p.page} ({p.count} views)</option>
                  ))}
                  {data.topPages.length === 0 && <option value="/dashboard">/dashboard</option>}
                </select>
                <button onClick={fetchData} className="px-3 py-2 rounded-lg border text-sm hover:bg-muted transition-colors">
                  Load Heatmap
                </button>
              </div>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold mb-3">Click Heatmap — {heatmapPage}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {data.heatmapData.length} clicks recorded.
                    <span className="inline-flex items-center gap-1 ml-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-400" /> Hot
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-2" /> Warm
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-2" /> Cool
                    </span>
                  </p>
                  <HeatmapCanvas clicks={data.heatmapData} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Top Clicked Elements
                  </h3>
                  <div className="space-y-2">
                    {topClicks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No click data yet.</p>
                    ) : (
                      topClicks.slice(0, 15).map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/30">
                          <span className="font-bold text-primary shrink-0">{c.count}×</span>
                          <span className="text-muted-foreground break-all">{c.target}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === SESSIONS TAB === */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Recent Sessions ({data.recentSessions.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 pr-4 font-medium text-muted-foreground">User</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Session ID</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Device</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Browser</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Viewport</th>
                      <th className="py-3 font-medium text-muted-foreground">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSessions.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No sessions recorded yet.</td></tr>
                    ) : (
                      data.recentSessions.map((s, i) => {
                        const Icon = deviceIcon(parseDevice(s.userAgent));
                        return (
                          <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 pr-4">
                              <span className={`text-sm ${s.userId ? 'font-medium' : 'text-muted-foreground'}`}>
                                {s.user}
                              </span>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{s.sessionId.slice(0, 16)}…</td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1.5 capitalize text-xs">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {parseDevice(s.userAgent)}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-xs">{parseBrowser(s.userAgent)}</td>
                            <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">{s.viewport || '—'}</td>
                            <td className="py-3 text-xs text-muted-foreground">{new Date(s.startedAt).toLocaleString('en-GB')}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === TOP CLICKS TAB === */}
          {activeTab === 'clicks' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={heatmapPage}
                  onChange={(e) => setHeatmapPage(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm max-w-md"
                >
                  <option value="">All pages</option>
                  {data.topPages.map((p, i) => (
                    <option key={i} value={p.page}>{p.page}</option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-primary" /> Most Clicked Elements
                  </h3>
                  {topClicks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No click data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {topClicks.map((c, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-mono text-muted-foreground break-all">{c.target}</p>
                            <p className="text-sm font-semibold mt-1">{c.count} clicks</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" /> Click Intensity
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Elements with the highest click concentration. High-click areas may indicate important features or UX friction points.
                  </p>
                  {topClicks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No click data yet.</p>
                  ) : (
                    <MiniBarChart
                      data={topClicks.slice(0, 10).map(c => ({
                        label: c.target.slice(0, 30),
                        value: c.count,
                        color: c.count > 50 ? 'bg-red-500' : c.count > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                      }))}
                      maxVal={Math.max(...topClicks.map(c => c.count), 1)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
