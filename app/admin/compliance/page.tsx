'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertTriangle, XCircle, Clock, Search, Filter, RefreshCw, Users, FileCheck, AlertCircle, Link2, Plus, Copy, Check, ExternalLink } from 'lucide-react';

interface IdentityCheck {
  id: string;
  userId: string;
  provider: string;
  type: string;
  sessionId: string | null;
  status: string;
  result: any;
  createdAt: string;
  completedAt: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    idVerified: boolean;
    amlRiskLevel: string | null;
  };
}

interface ComplianceStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingChecks: number;
  failedChecks: number;
  amlHighRisk: number;
}

interface VerificationLink {
  id: string;
  token: string;
  clientName: string;
  clientEmail?: string;
  companyName?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function ComplianceDashboard() {
  const [checks, setChecks] = useState<IdentityCheck[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'checks' | 'links'>('checks');
  const [links, setLinks] = useState<VerificationLink[]>([]);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [newLink, setNewLink] = useState({ clientName: '', clientEmail: '', companyName: '' });
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
    loadLinks();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/compliance');
      if (res.ok) {
        const data = await res.json();
        setChecks(data.checks || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLinks = async () => {
    try {
      const res = await fetch('/api/yoti/verify-link');
      if (res.ok) setLinks(await res.json());
    } catch { /* ignore */ }
  };

  const createLink = async () => {
    if (!newLink.clientName) return;
    setCreating(true);
    try {
      const res = await fetch('/api/yoti/verify-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedUrl(data.url);
        loadLinks();
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredChecks = checks.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.user.fullName.toLowerCase().includes(q) || c.user.email.toLowerCase().includes(q);
    }
    return true;
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'expired': return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      failed: 'bg-red-500/10 text-red-500 border-red-500/20',
      pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.expired}`}>
        {statusIcon(status)} {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-500" />
            Compliance Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Identity verification, AML screening & audit trail</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <Users className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <CheckCircle2 className="h-5 w-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-500">{stats.verifiedUsers}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <Clock className="h-5 w-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-amber-500">{stats.pendingChecks}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <XCircle className="h-5 w-5 text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-500">{stats.failedChecks}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <AlertCircle className="h-5 w-5 text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.amlHighRisk}</p>
            <p className="text-xs text-muted-foreground">AML High Risk</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        <button
          onClick={() => setTab('checks')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'checks' ? 'border-blue-500 text-blue-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <FileCheck className="h-4 w-4 inline mr-1.5" />
          Identity Checks
        </button>
        <button
          onClick={() => setTab('links')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'links' ? 'border-blue-500 text-blue-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Link2 className="h-4 w-4 inline mr-1.5" />
          Verification Links ({links.length})
        </button>
      </div>

      {/* TAB: Identity Checks */}
      {tab === 'checks' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border bg-card text-sm">
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border bg-card text-sm">
              <option value="all">All Types</option>
              <option value="idv">Identity Verification</option>
              <option value="aml">AML Screening</option>
              <option value="esign">eSignature</option>
            </select>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Provider</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-left p-3 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChecks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No compliance checks found
                      </td>
                    </tr>
                  ) : (
                    filteredChecks.map(check => (
                      <tr key={check.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{check.user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{check.user.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {check.type === 'idv' ? 'ID Verification' : check.type === 'aml' ? 'AML Check' : 'eSignature'}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{check.provider}</td>
                        <td className="p-3">{statusBadge(check.status)}</td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(check.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {check.completedAt
                            ? new Date(check.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB: Verification Links */}
      {tab === 'links' && (
        <div className="space-y-4">
          {/* Create Link Button / Dialog */}
          {!showCreateLink && !createdUrl && (
            <button
              onClick={() => { setShowCreateLink(true); setNewLink({ clientName: '', clientEmail: '', companyName: '' }); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Verification Link
            </button>
          )}

          {/* Create Form */}
          {showCreateLink && !createdUrl && (
            <div className="rounded-xl border bg-card p-5 max-w-lg space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-500" /> New Verification Link
              </h3>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Client Name *</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={newLink.clientName}
                  onChange={e => setNewLink(p => ({ ...p, clientName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Client Email (optional)</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newLink.clientEmail}
                  onChange={e => setNewLink(p => ({ ...p, clientEmail: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Company Name (optional — shown to client)</label>
                <input
                  type="text"
                  placeholder="HomeLedger Ltd"
                  value={newLink.companyName}
                  onChange={e => setNewLink(p => ({ ...p, companyName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createLink}
                  disabled={creating || !newLink.clientName}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Generate Link
                </button>
                <button
                  onClick={() => setShowCreateLink(false)}
                  className="px-4 py-2 rounded-lg border text-sm hover:bg-muted/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Created URL success */}
          {createdUrl && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 max-w-lg space-y-3">
              <div className="flex items-center gap-2 text-green-500 font-semibold">
                <CheckCircle2 className="h-5 w-5" /> Verification Link Created!
              </div>
              <p className="text-sm text-muted-foreground">Send this link to your client. They can verify their identity without needing a HomeLedger account.</p>
              <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
                <input type="text" readOnly value={createdUrl} className="flex-1 bg-transparent text-sm outline-none truncate" />
                <button onClick={() => copyUrl(createdUrl)} className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              <button
                onClick={() => { setCreatedUrl(null); setShowCreateLink(false); }}
                className="text-sm text-blue-500 hover:underline"
              >
                Done
              </button>
            </div>
          )}

          {/* Links Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-left p-3 font-medium">Company</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-left p-3 font-medium">Expires</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No verification links created yet
                      </td>
                    </tr>
                  ) : (
                    links.map(link => {
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                      const url = `${baseUrl}/verify/${link.token}`;
                      return (
                        <tr key={link.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <p className="font-medium">{link.clientName}</p>
                            {link.clientEmail && <p className="text-xs text-muted-foreground">{link.clientEmail}</p>}
                          </td>
                          <td className="p-3 text-muted-foreground">{link.companyName || '-'}</td>
                          <td className="p-3">{statusBadge(link.status)}</td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(link.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(link.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => copyUrl(url)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-muted transition-colors"
                              title="Copy link"
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
