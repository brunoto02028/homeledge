'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Fingerprint, Search, CheckCircle2, Clock, AlertCircle, XCircle,
  Copy, Check, ArrowLeft, Shield, Loader2, ExternalLink, BarChart3,
} from 'lucide-react';

interface VerificationLink {
  id: string;
  url: string;
  token: string;
  status: string;
  isExpired: boolean;
  subjectName: string | null;
  companyName: string | null;
  expiresAt: string;
  createdAt: string;
  completedAt: string | null;
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
  expired: number;
  failed: number;
}

export default function VerifyDashboardPage() {
  const [email, setEmail] = useState('');
  const [links, setLinks] = useState<VerificationLink[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!email.includes('@')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/verify-dashboard?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setLinks(data.links || []);
      setStats(data.stats || null);
      setClientName(data.clientName || '');
      setSearched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: 'text-amber-400', label: 'Pending' },
    completed: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Verified' },
    failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
    expired: { icon: AlertCircle, color: 'text-slate-400', label: 'Expired' },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20">
              <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-bold text-white">Clarity & Co</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/verify-purchase" className="text-sm text-slate-400 hover:text-white transition-colors">
              Buy More Checks
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <BarChart3 className="h-4 w-4 text-violet-400" />
              Verification Dashboard
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-400 text-xs font-semibold mb-4">
            <Shield className="h-3.5 w-3.5" /> Buyer Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Your Verification Results</h1>
          <p className="mt-3 text-slate-400 max-w-lg mx-auto">
            Enter the email you used to purchase verification checks to view their status and results.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-lg mx-auto mb-10">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter your purchase email..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !email.includes('@')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 font-semibold text-sm hover:from-violet-300 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </button>
          </div>
          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </div>

        {/* Results */}
        {searched && (
          <>
            {/* Stats */}
            {stats && stats.total > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-white/5' },
                  { label: 'Verified', value: stats.completed, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
                  { label: 'Pending', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-400/5' },
                  { label: 'Expired', value: stats.expired + stats.failed, color: 'text-red-400', bg: 'bg-red-400/5' },
                ].map((s, i) => (
                  <div key={i} className={`rounded-xl ${s.bg} border border-white/5 p-4 text-center`}>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {clientName && (
              <p className="text-sm text-slate-400 mb-4">
                Showing results for <span className="text-white font-medium">{clientName}</span>
              </p>
            )}

            {/* Links Table */}
            {links.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                <Fingerprint className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Verifications Found</h3>
                <p className="text-slate-500 text-sm mb-6">No verification links are associated with this email address.</p>
                <Link href="/verify-purchase" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 text-sm font-semibold">
                  Purchase Verification Checks <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link) => {
                  const effectiveStatus = link.isExpired && link.status !== 'completed' ? 'expired' : link.status;
                  const config = statusConfig[effectiveStatus] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <div key={link.id} className="rounded-xl bg-white/[0.02] border border-white/5 p-5 hover:bg-white/[0.04] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Status */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`h-10 w-10 rounded-xl ${
                            effectiveStatus === 'completed' ? 'bg-emerald-400/10' :
                            effectiveStatus === 'pending' ? 'bg-amber-400/10' :
                            'bg-red-400/10'
                          } flex items-center justify-center flex-shrink-0`}>
                            <StatusIcon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                effectiveStatus === 'completed' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                                effectiveStatus === 'pending' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                                'bg-red-400/10 text-red-400 border-red-400/20'
                              }`}>{config.label}</span>
                              {link.subjectName && (
                                <span className="text-sm text-slate-300 font-medium">{link.subjectName}</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 font-mono truncate">{link.url}</div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
                          <div>
                            <span className="block text-slate-600">Created</span>
                            {new Date(link.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {link.completedAt ? (
                            <div>
                              <span className="block text-emerald-500/70">Verified</span>
                              {new Date(link.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          ) : (
                            <div>
                              <span className="block text-slate-600">Expires</span>
                              {new Date(link.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => copyUrl(link.url, link.token)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            title="Copy link"
                          >
                            {copiedToken === link.token ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-slate-400" />
                            )}
                          </button>
                          {effectiveStatus === 'pending' && (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-violet-400/10 hover:bg-violet-400/20 transition-colors"
                              title="Open verification link"
                            >
                              <ExternalLink className="h-4 w-4 text-violet-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500 mt-12">
        <p>© {new Date().getFullYear()} Clarity & Co. Secure identity verification powered by certified providers.</p>
      </footer>
    </div>
  );
}
