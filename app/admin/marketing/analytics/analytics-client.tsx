'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, Users, FileText, Mail, Instagram,
  Flame, Thermometer, Snowflake, Eye, BarChart3, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  totalPosts: number;
  publishedPosts: number;
  totalLeads: number;
  hotLeads: number;
  sentCampaigns: number;
  totalCreatives: number;
  leadsByTag: { tag: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  recentLeads: { date: string; count: number }[];
  topPosts: { title: string; views: number; slug: string }[];
}

const PIE_COLORS = { hot: '#EF4444', warm: '#F59E0B', cold: '#60A5FA' };
const TAG_ICONS: Record<string, any> = { hot: Flame, warm: Thermometer, cold: Snowflake };

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/analytics');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const pieData = data.leadsByTag.map(d => ({
    name: d.tag.charAt(0).toUpperCase() + d.tag.slice(1),
    value: d.count,
    color: PIE_COLORS[d.tag as keyof typeof PIE_COLORS] || '#94A3B8',
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Marketing Analytics</h1>
          <p className="text-sm text-muted-foreground">Overview of blog, leads and campaigns</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Blog Posts', value: data.publishedPosts, icon: FileText, color: 'text-blue-500' },
          { label: 'Total Leads', value: data.totalLeads, icon: Users, color: 'text-purple-500' },
          { label: 'Hot Leads', value: data.hotLeads, icon: Flame, color: 'text-red-500' },
          { label: 'Campaigns Sent', value: data.sentCampaigns, icon: Mail, color: 'text-green-500' },
          { label: 'Creatives', value: data.totalCreatives, icon: Instagram, color: 'text-pink-500' },
          { label: 'Total Views', value: data.topPosts.reduce((s, p) => s + p.views, 0), icon: Eye, color: 'text-amber-500' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="p-4 rounded-xl border bg-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold">{kpi.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leads over time */}
        {data.recentLeads.length > 0 && (
          <div className="p-5 rounded-xl border bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" /> Leads (last 30 days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.recentLeads}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="count" stroke="#A855F7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Lead scoring pie */}
        {pieData.length > 0 && (
          <div className="p-5 rounded-xl border bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" /> Lead Scoring
            </h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map(d => {
                  const Icon = TAG_ICONS[d.name.toLowerCase()] || Users;
                  return (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                      <Icon className="h-3.5 w-3.5" style={{ color: d.color }} />
                      <span>{d.name}</span>
                      <span className="font-bold ml-auto">{d.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Leads by source */}
        {data.leadsBySource.length > 0 && (
          <div className="p-5 rounded-xl border bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" /> Leads by Source
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.leadsBySource}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="source" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top posts */}
        {data.topPosts.length > 0 && (
          <div className="p-5 rounded-xl border bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" /> Top Articles by Views
            </h3>
            <div className="space-y-3">
              {data.topPosts.map((post, i) => (
                <div key={post.slug} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                        style={{ width: `${data.topPosts[0].views > 0 ? (post.views / data.topPosts[0].views) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold shrink-0">{post.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
