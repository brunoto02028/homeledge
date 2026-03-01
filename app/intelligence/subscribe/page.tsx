'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Globe, Zap, Shield, Newspaper, Plane, Anchor, BarChart3,
  CloudRain, Clock, CheckCircle2, ArrowRight, Sparkles, Lock,
  AlertTriangle, TrendingUp, BookOpen, Radio,
} from 'lucide-react';

export default function IntelligenceSubscribePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    if (!session) {
      router.push('/login?callbackUrl=/intelligence/subscribe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/intelligence/checkout', { method: 'POST' });
      const data = await res.json();

      if (data.redirect) {
        router.push(data.redirect);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  const features = [
    { icon: Newspaper, label: 'Live Global News', desc: '50+ countries, real-time sentiment analysis, auto-refresh every 60s' },
    { icon: Plane, label: 'Aircraft Tracking', desc: 'Military & civilian aircraft via OpenSky Network with live positions' },
    { icon: Anchor, label: 'Naval Vessel Monitor', desc: 'Aircraft carriers, warships & strategic waterway monitoring worldwide' },
    { icon: AlertTriangle, label: 'Earthquake Monitor', desc: 'USGS seismic data with magnitude, depth & tsunami alerts' },
    { icon: BarChart3, label: 'Economic Calendar', desc: 'Central bank decisions, GDP, CPI, employment data from 20+ countries' },
    { icon: TrendingUp, label: 'World Economy', desc: 'GDP rankings, population stats, regional economic indicators' },
    { icon: CloudRain, label: 'Weather Intelligence', desc: 'Severe weather warnings, storms & climate events worldwide' },
    { icon: BookOpen, label: 'Prophecy Tracking', desc: 'Biblical prophecy cross-reference with current world events' },
    { icon: Shield, label: 'UK Impact Analysis', desc: 'Every event scored for potential impact on UK markets & citizens' },
    { icon: Radio, label: 'AI Intelligence Agent', desc: 'Geopolitical analyst AI for deep news analysis & threat assessment' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,100,255,0.08) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 80%, rgba(0,200,255,0.05) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,180,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.4) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src="/site-logo.png" alt="HomeLedger" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-lg">HomeLedger</span>
          </a>
          <a href="/intelligence" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back
          </a>
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-mono mb-6">
            <Globe className="w-4 h-4" />
            GLOBAL INTELLIGENCE DASHBOARD
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">War Room</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Monitor global events, military movements, earthquakes, economic data, and breaking news
            — all on one interactive map with AI-powered analysis.
          </p>

          {/* Map preview */}
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/10 shadow-2xl shadow-cyan-500/5 mb-8 mx-auto max-w-3xl">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5" style={{ background: 'rgba(10,15,25,0.9)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white font-mono text-xs font-bold tracking-wider">LIVE PREVIEW</span>
                <span className="text-cyan-400 font-mono text-[10px]">DEMO</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                <Clock className="w-3 h-3" />
                <span className="tabular-nums">
                  {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="relative h-[200px] sm:h-[260px]" style={{ background: '#0d1520' }}>
              <div id="subscribe-map-preview" className="absolute inset-0 w-full h-full" style={{ filter: 'brightness(1.3)' }} />
              {/* Blurred overlay indicating locked content */}
              <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-10 h-10 text-cyan-400/60 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-mono">Start your free trial to unlock</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing card */}
        <div className="max-w-md mx-auto px-6 mb-16">
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-8">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                7-DAY FREE TRIAL
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black">£2.99</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">after 7-day free trial · cancel anytime</p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                'Full interactive map with all data layers',
                'Real-time news from 50+ countries',
                'Military aircraft & naval vessel tracking',
                'Earthquake & severe weather alerts',
                'Economic calendar & world economy data',
                'AI intelligence agent for deep analysis',
                'UK market impact scoring on every event',
                'Prophecy tracking & biblical cross-references',
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  {session ? 'Start 7-Day Free Trial' : 'Sign In to Start Free Trial'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center mt-3">{error}</p>
            )}

            <p className="text-slate-600 text-xs text-center mt-4">
              Secure payment via Stripe · No charge during trial · Cancel anytime
            </p>
          </div>
        </div>

        {/* Features grid */}
        <div className="max-w-5xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-center mb-10">
            Everything in <span className="text-cyan-400">One Dashboard</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all duration-300">
                <f.icon className="w-6 h-6 text-cyan-400 mb-3" />
                <h3 className="font-bold text-sm mb-1">{f.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 py-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} HomeLedger · <a href="/privacy" className="hover:text-slate-400">Privacy</a> · <a href="/terms" className="hover:text-slate-400">Terms</a>
        </div>
      </div>
    </div>
  );
}
