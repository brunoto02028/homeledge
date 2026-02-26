'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  BarChart3, Users, Eye, Clock, MousePointerClick, ArrowDown,
  Monitor, Smartphone, Tablet, Globe, RefreshCw, ChevronDown,
  TrendingUp, ExternalLink, Target, Flame, Filter,
} from 'lucide-react';

interface OverviewData {
  totalVisitors: number;
  totalPageViews: number;
  totalEvents: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
}

interface TopPage {
  path: string;
  views: number;
  avgTime: number;
  avgScroll: number;
}

interface DailyTrend {
  date: string;
  views: number;
  uniqueVisitors: number;
}

interface ClickPoint {
  x: number;
  y: number;
  type: string;
  target: string;
}

interface TopClick {
  target: string;
  count: number;
}

interface Visitor {
  id: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
  referrer: string | null;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  country: string | null;
  city: string | null;
  _count: { pageViews: number; events: number };
}

interface DashboardData {
  period: { days: number; since: string };
  overview: OverviewData;
  topPages: TopPage[];
  dailyTrend: DailyTrend[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  heatmap: { path: string; clicks: ClickPoint[] };
  topClicks: TopClick[];
  recentVisitors: Visitor[];
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

// Simple bar chart using divs
function MiniBarChart({ data, maxVal }: { data: { label: string; value: number; color?: string }[]; maxVal: number }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-24 truncate shrink-0">{d.label}</span>
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
function HeatmapCanvas({ clicks, width = 800, height = 1200 }: { clicks: ClickPoint[]; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || clicks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw gradient background representing a page
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw each click as a radial gradient dot
    clicks.forEach((click) => {
      const cx = (click.x / 100) * width;
      const cy = (click.y / 100) * height;
      const radius = 20;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      if (click.type === 'cta_click') {
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      } else if (click.type === 'rage_click') {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (click.type === 'nav_click') {
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Legend
    ctx.font = '12px system-ui';
    const legend = [
      { color: '#fbbf24', label: 'CTA Click' },
      { color: '#ef4444', label: 'Rage Click' },
      { color: '#38bdf8', label: 'Nav Click' },
      { color: '#10b981', label: 'Click' },
    ];
    legend.forEach((item, i) => {
      const lx = 16;
      const ly = height - 80 + i * 20;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(item.label, lx + 12, ly + 4);
    });
  }, [clicks, width, height]);

  if (clicks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">No click data yet for this page. Data will appear once visitors interact with analytics consent enabled.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[600px] rounded-xl border">
      <canvas ref={canvasRef} width={width} height={height} className="w-full" style={{ maxWidth: width }} />
    </div>
  );
}

// Daily trend line chart (simple div-based)
function DailyTrendChart({ data }: { data: DailyTrend[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  const maxViews = Math.max(...data.map(d => d.views), 1);

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded-lg px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
            {formatDate(d.date)}: {d.views} views, {d.uniqueVisitors} unique
          </div>
          <div
            className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors min-h-[2px]"
            style={{ height: `${(d.views / maxViews) * 100}%` }}
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
  const [heatmapPath, setHeatmapPath] = useState('/');
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'visitors' | 'clicks'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/dashboard?days=${days}&path=${encodeURIComponent(heatmapPath)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  }, [days, heatmapPath]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
            Site Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visitor behavior, click heatmaps, and conversion insights</p>
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
        {(['overview', 'heatmap', 'visitors', 'clicks'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'heatmap' && 'Click Heatmap'}
            {tab === 'visitors' && 'Visitors'}
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
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Users} label="Unique Visitors" value={data.overview.totalVisitors} color="bg-blue-500" />
                <StatCard icon={Eye} label="Page Views" value={data.overview.totalPageViews} color="bg-emerald-500" />
                <StatCard icon={MousePointerClick} label="Total Events" value={data.overview.totalEvents} color="bg-amber-500" />
                <StatCard icon={Clock} label="Avg. Time on Page" value={formatDuration(data.overview.avgTimeOnPage)} color="bg-purple-500" />
                <StatCard icon={ArrowDown} label="Avg. Scroll Depth" value={`${data.overview.avgScrollDepth}%`} color="bg-rose-500" />
              </div>

              {/* Daily Trend */}
              <div className="bg-card border rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Daily Page Views
                </h3>
                <DailyTrendChart data={data.dailyTrend} />
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
                            onClick={() => { setHeatmapPath(p.path); setActiveTab('heatmap'); }}
                            className="text-left hover:text-primary transition-colors truncate max-w-[60%] font-mono text-xs"
                          >
                            {p.path}
                          </button>
                          <div className="flex items-center gap-4 text-muted-foreground text-xs">
                            <span>{p.views} views</span>
                            <span>{formatDuration(p.avgTime)}</span>
                            <span>{p.avgScroll}% scroll</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Devices & Browsers */}
                <div className="space-y-6">
                  <div className="bg-card border rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-primary" /> Devices
                    </h3>
                    {data.devices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No data yet.</p>
                    ) : (
                      <div className="flex gap-4">
                        {data.devices.map((d, i) => {
                          const Icon = deviceIcon(d.device);
                          const total = data.devices.reduce((s, x) => s + x.count, 0);
                          return (
                            <div key={i} className="flex-1 text-center p-3 bg-muted/30 rounded-lg">
                              <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-lg font-bold">{total > 0 ? Math.round((d.count / total) * 100) : 0}%</p>
                              <p className="text-xs text-muted-foreground capitalize">{d.device || 'Unknown'}</p>
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
                      data={data.browsers.map(b => ({ label: b.browser, value: b.count, color: 'bg-blue-500' }))}
                      maxVal={Math.max(...data.browsers.map(b => b.count), 1)}
                    />
                  </div>
                </div>
              </div>

              {/* Referrers */}
              {data.referrers.length > 0 && (
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" /> Top Referrers
                  </h3>
                  <MiniBarChart
                    data={data.referrers.map(r => ({ label: r.referrer || 'Direct', value: r.count, color: 'bg-emerald-500' }))}
                    maxVal={Math.max(...data.referrers.map(r => r.count), 1)}
                  />
                </div>
              )}
            </div>
          )}

          {/* === HEATMAP TAB === */}
          {activeTab === 'heatmap' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Page:</label>
                <select
                  value={heatmapPath}
                  onChange={(e) => setHeatmapPath(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm flex-1 max-w-md"
                >
                  {data.topPages.map((p, i) => (
                    <option key={i} value={p.path}>{p.path} ({p.views} views)</option>
                  ))}
                  {data.topPages.length === 0 && <option value="/">/ (homepage)</option>}
                </select>
                <button onClick={fetchData} className="px-3 py-2 rounded-lg border text-sm hover:bg-muted transition-colors">
                  Load Heatmap
                </button>
              </div>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold mb-3">Click Heatmap — {data.heatmap.path}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {data.heatmap.clicks.length} clicks recorded.
                    <span className="inline-flex items-center gap-1 ml-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> CTA
                      <span className="inline-block w-2 h-2 rounded-full bg-red-400 ml-2" /> Rage
                      <span className="inline-block w-2 h-2 rounded-full bg-sky-400 ml-2" /> Nav
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-2" /> Other
                    </span>
                  </p>
                  <HeatmapCanvas clicks={data.heatmap.clicks} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Top Clicked Elements
                  </h3>
                  <div className="space-y-2">
                    {data.topClicks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No click data yet.</p>
                    ) : (
                      data.topClicks.slice(0, 15).map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/30">
                          <span className="font-bold text-primary shrink-0">{c.count}×</span>
                          <span className="text-muted-foreground font-mono break-all">{c.target}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === VISITORS TAB === */}
          {activeTab === 'visitors' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Recent Visitors ({data.recentVisitors.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 pr-4 font-medium text-muted-foreground">IP</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Device</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Browser</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">OS</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Referrer</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Visits</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Pages</th>
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Events</th>
                      <th className="py-3 font-medium text-muted-foreground">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentVisitors.length === 0 ? (
                      <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No visitors recorded yet.</td></tr>
                    ) : (
                      data.recentVisitors.map((v) => {
                        const Icon = deviceIcon(v.device);
                        return (
                          <tr key={v.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 pr-4 font-mono text-xs">{v.ip}</td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1.5 capitalize">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {v.device}
                              </span>
                            </td>
                            <td className="py-3 pr-4">{v.browser}</td>
                            <td className="py-3 pr-4">{v.os}</td>
                            <td className="py-3 pr-4 text-xs max-w-[150px] truncate">{v.referrer || '—'}</td>
                            <td className="py-3 pr-4 font-medium">{v.totalVisits}</td>
                            <td className="py-3 pr-4">{v._count.pageViews}</td>
                            <td className="py-3 pr-4">{v._count.events}</td>
                            <td className="py-3 text-xs text-muted-foreground">{new Date(v.lastSeen).toLocaleString('en-GB')}</td>
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
                  value={heatmapPath}
                  onChange={(e) => setHeatmapPath(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm max-w-md"
                >
                  <option value="/">All pages</option>
                  {data.topPages.map((p, i) => (
                    <option key={i} value={p.path}>{p.path}</option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-primary" /> Most Clicked Elements
                  </h3>
                  {data.topClicks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No click data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.topClicks.map((c, i) => (
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
                    <Flame className="h-4 w-4 text-red-500" /> Rage Clicks
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Rage clicks indicate user frustration — 3+ rapid clicks on the same area. Investigate these elements for UX issues.
                  </p>
                  {data.heatmap.clicks.filter(c => c.type === 'rage_click').length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rage clicks detected. Good UX!</p>
                  ) : (
                    <div className="space-y-2">
                      {Array.from(new Set(data.heatmap.clicks.filter(c => c.type === 'rage_click').map(c => c.target))).slice(0, 10).map((target, i) => (
                        <div key={i} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 break-all">
                          {target}
                        </div>
                      ))}
                    </div>
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
