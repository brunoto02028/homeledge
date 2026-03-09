'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Users, Flame, Thermometer, Snowflake, Search,
  Mail, Phone, Building2, Calendar, TrendingUp, Download, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Lead {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  businessType: string | null;
  source: string | null;
  score: number;
  tag: string;
  subscribed: boolean;
  createdAt: string;
  _count: { actions: number };
}

const TAG_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  hot: { label: 'Hot', icon: Flame, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  warm: { label: 'Warm', icon: Thermometer, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  cold: { label: 'Cold', icon: Snowflake, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
};

export default function LeadsClient() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => { loadLeads(); }, [search, tagFilter]);

  async function loadLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (tagFilter) params.set('tag', tagFilter);
      const res = await fetch(`/api/marketing/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.total || 0);
      setStats(data.stats || []);
    } finally {
      setLoading(false);
    }
  }

  const statsByTag = (tag: string) => stats?.find((s: any) => s.tag === tag)?._count?.id || 0;

  function exportCSV() {
    const rows = [
      ['Email', 'Name', 'Phone', 'Business Type', 'Source', 'Score', 'Tag', 'Subscribed', 'Date'],
      ...leads.map(l => [l.email, l.fullName || '', l.phone || '', l.businessType || '', l.source || '', l.score, l.tag, l.subscribed ? 'Yes' : 'No', new Date(l.createdAt).toLocaleDateString('en-GB')]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarity-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-sm text-muted-foreground">{total} leads captured</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['hot', 'warm', 'cold'] as const).map(tag => {
          const cfg = TAG_CONFIG[tag];
          const Icon = cfg.icon;
          return (
            <div
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${tagFilter === tag ? 'border-current' : 'border-border hover:border-muted-foreground/30'}`}
            >
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border mb-2 ${cfg.color}`}>
                <Icon className="h-3 w-3" />
                {cfg.label}
              </div>
              <p className="text-2xl font-bold">{statsByTag(tag)}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 border rounded-xl">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No leads yet</h3>
          <p className="text-sm text-muted-foreground">Leads are captured via forms, pop-ups, and newsletter subscriptions.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Score</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Tag</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Actions</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map(lead => {
                const tagCfg = TAG_CONFIG[lead.tag] || TAG_CONFIG.cold;
                const TagIcon = tagCfg.icon;
                return (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{lead.fullName || '—'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </p>
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </p>
                        )}
                        {lead.businessType && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {lead.businessType}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                            style={{ width: `${Math.min(lead.score, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tagCfg.color}`}>
                        <TagIcon className="h-3 w-3" />
                        {tagCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">{lead.source || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{lead._count.actions}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
