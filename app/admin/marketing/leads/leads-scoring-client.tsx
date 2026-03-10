'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Star, RefreshCw, Loader2, ChevronRight, Mail, Phone, Building2, BarChart2, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TAG_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-orange-100 text-orange-700 border-orange-200',
  cold: 'bg-blue-100 text-blue-700 border-blue-200',
};

const TAG_ICONS: Record<string, string> = { hot: '🔥', warm: '🌡️', cold: '❄️' };

interface Lead {
  id: string; email: string; fullName: string | null; phone: string | null;
  businessType: string | null; source: string | null; score: number; tag: string;
  notes: string | null; createdAt: string; convertedAt: string | null;
  _count?: { actions: number };
  actions?: { action: string; points: number; createdAt: string }[];
}

interface Analysis {
  score: number; tag: string; reasoning: string;
  recommended_action: string; priority: string; best_feature_to_pitch: string;
}

export default function LeadsScoringClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('all');
  const [search, setSearch] = useState('');
  const [scoring, setScoring] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [bulkScoring, setBulkScoring] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  useEffect(() => { fetchLeads(); }, [filterTag]);

  async function fetchLeads() {
    setLoading(true);
    const res = await fetch(`/api/leads/score?tag=${filterTag === 'all' ? '' : filterTag}&limit=100`);
    if (res.ok) {
      const d = await res.json();
      setLeads(d.leads || []);
      setStats(d.stats || []);
    }
    setLoading(false);
  }

  async function scoreLead(leadId: string) {
    setScoring(leadId);
    try {
      const res = await fetch('/api/leads/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data.lead } : l));
        if (selected?.id === leadId) {
          setSelected(prev => prev ? { ...prev, ...data.lead } : null);
          setAnalysis(data.analysis);
        }
        return data;
      }
    } finally {
      setScoring(null);
    }
  }

  async function openLead(lead: Lead) {
    setSelected(lead);
    setAnalysis(null);
    setShowDialog(true);
    const data = await scoreLead(lead.id);
    if (data?.analysis) setAnalysis(data.analysis);
  }

  async function bulkScore() {
    setBulkScoring(true);
    setBulkProgress(0);
    const unscored = leads.filter(l => l.score === 0).slice(0, 20);
    for (let i = 0; i < unscored.length; i++) {
      await scoreLead(unscored[i].id);
      setBulkProgress(Math.round(((i + 1) / unscored.length) * 100));
    }
    setBulkScoring(false);
    fetchLeads();
  }

  const filtered = leads.filter(l =>
    !search ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    l.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    l.businessType?.toLowerCase().includes(search.toLowerCase())
  );

  const statMap = Object.fromEntries(stats.map((s: any) => [s.tag, { count: s._count._all, avg: Math.round(s._avg.score || 0) }]));
  const totalLeads = leads.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Brain className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lead Intelligence</h1>
            <p className="text-sm text-muted-foreground">Claude Haiku scores and analyses every lead automatically</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLeads} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button
            onClick={bulkScore}
            disabled={bulkScoring}
            className="bg-violet-600 hover:bg-violet-700 text-white"
            size="sm"
          >
            {bulkScoring ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scoring... {bulkProgress}%</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Score All Unscored</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div><p className="text-2xl font-bold">{totalLeads}</p><p className="text-xs text-muted-foreground">Total Leads</p></div>
          </CardContent>
        </Card>
        {['hot', 'warm', 'cold'].map(tag => (
          <Card key={tag} className={`cursor-pointer transition-all ${filterTag === tag ? 'ring-2 ring-violet-500' : ''}`} onClick={() => setFilterTag(filterTag === tag ? 'all' : tag)}>
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-3xl">{TAG_ICONS[tag]}</span>
              <div>
                <p className="text-2xl font-bold">{statMap[tag]?.count || 0}</p>
                <p className="text-xs text-muted-foreground capitalize">{tag} leads {statMap[tag]?.avg ? `(avg ${statMap[tag].avg})` : ''}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by email, name, or business..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            <SelectItem value="hot">🔥 Hot</SelectItem>
            <SelectItem value="warm">🌡️ Warm</SelectItem>
            <SelectItem value="cold">❄️ Cold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Lead</th>
                    <th className="text-left p-3 font-medium">Business</th>
                    <th className="text-left p-3 font-medium">Source</th>
                    <th className="text-left p-3 font-medium">Score</th>
                    <th className="text-left p-3 font-medium">Tag</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No leads found</td></tr>
                  ) : filtered.map(lead => (
                    <tr key={lead.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => openLead(lead)}>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{lead.fullName || '—'}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                          {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{lead.businessType || '—'}</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{lead.source || '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${lead.score >= 70 ? 'bg-red-500' : lead.score >= 40 ? 'bg-orange-500' : 'bg-blue-400'}`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{lead.score}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TAG_COLORS[lead.tag]}`}>
                          {TAG_ICONS[lead.tag]} {lead.tag}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{lead._count?.actions || 0}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => scoreLead(lead.id)}
                          disabled={scoring === lead.id}
                          className="h-7 px-2"
                        >
                          {scoring === lead.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              Lead Analysis
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Lead Info */}
              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-semibold">{selected.fullName || selected.email}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                  {selected.phone && <p className="text-sm text-muted-foreground">{selected.phone}</p>}
                  {selected.businessType && <p className="text-xs mt-1 bg-muted px-2 py-0.5 rounded inline-block">{selected.businessType}</p>}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-violet-600">{selected.score}</p>
                  <p className="text-xs text-muted-foreground">score / 100</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium mt-1 inline-block ${TAG_COLORS[selected.tag]}`}>
                    {TAG_ICONS[selected.tag]} {selected.tag}
                  </span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${selected.score >= 70 ? 'bg-red-500' : selected.score >= 40 ? 'bg-orange-500' : 'bg-blue-400'}`}
                  style={{ width: `${selected.score}%` }}
                />
              </div>

              {/* AI Analysis */}
              {!analysis && scoring === selected.id && (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                  <span className="text-sm">Claude is analysing this lead...</span>
                </div>
              )}

              {analysis && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">AI Reasoning</p>
                    <p className="text-sm">{analysis.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Recommended Action</p>
                      <p className="text-sm">{analysis.recommended_action}</p>
                    </div>
                    <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
                      <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-1">Feature to Pitch</p>
                      <p className="text-sm">{analysis.best_feature_to_pitch}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Priority: <strong className="capitalize">{analysis.priority}</strong></span>
                    <span>Source: {selected.source || '—'}</span>
                    <span>Joined: {new Date(selected.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium mb-1">Notes & AI History</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}

              <Button
                onClick={() => scoreLead(selected.id)}
                disabled={scoring === selected.id}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {scoring === selected.id ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Re-scoring...</> : <><RefreshCw className="h-4 w-4 mr-2" /> Re-score with Claude</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
