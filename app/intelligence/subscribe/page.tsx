'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Globe, Zap, Shield, Newspaper, Plane, Anchor, BarChart3,
  CloudRain, Clock, CheckCircle2, ArrowRight, Sparkles, Lock,
  AlertTriangle, TrendingUp, BookOpen, Radio, Eye, EyeOff,
  FileText, Receipt, CreditCard, PiggyBank, Building2, Scale,
  ChevronRight, Star, Users,
} from 'lucide-react';

export default function IntelligenceSubscribePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inline signup fields (for non-logged-in users)
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginLink, setShowLoginLink] = useState(false);

  // Load Leaflet map preview
  useEffect(() => {
    const el = document.getElementById('subscribe-map-preview');
    if (!el || (window as any).__subMapInit) return;
    (window as any).__subMapInit = true;
    const load = () => {
      const L = (window as any).L; if (!L || !el) return;
      const map = L.map(el, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, keyboard: false, boxZoom: false }).setView([20, 15], 2);
      L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    };
    if ((window as any).L) { load(); return; }
    if (!document.querySelector('link[href*="leaflet"]')) {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
    }
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = load; document.head.appendChild(s);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    setShowLoginLink(false);

    try {
      const bodyPayload: any = {};
      if (!session) {
        if (!signupName || !signupEmail || !signupPassword) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        if (signupPassword.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        bodyPayload.fullName = signupName;
        bodyPayload.email = signupEmail;
        bodyPayload.password = signupPassword;
      }

      const res = await fetch('/api/intelligence/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();

      if (data.redirect) { router.push(data.redirect); return; }

      if (!res.ok) {
        if (data.loginRequired) setShowLoginLink(true);
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      if (data.url) window.location.href = data.url;
    } catch {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  const intelFeatures = [
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

  const platformFeatures = [
    { icon: FileText, label: 'Bank Statements', desc: 'Upload & categorise bank statements with AI', color: 'text-emerald-400' },
    { icon: Receipt, label: 'Invoices & Bills', desc: 'Track invoices, bills, and payments', color: 'text-blue-400' },
    { icon: CreditCard, label: 'Open Banking', desc: 'Connect your bank accounts via Monzo, Revolut & more', color: 'text-purple-400' },
    { icon: PiggyBank, label: 'Budget & Savings', desc: 'Set budgets, track spending, get alerts', color: 'text-amber-400' },
    { icon: Lock, label: 'Secure Vault', desc: 'Encrypted storage for passwords & credentials', color: 'text-red-400' },
    { icon: Building2, label: 'Business Tools', desc: 'Entity management, Companies House integration', color: 'text-indigo-400' },
    { icon: Scale, label: 'Tax Timeline', desc: 'HMRC deadlines, SA, VAT, PAYE reminders', color: 'text-pink-400' },
    { icon: Users, label: 'Household Finance', desc: 'Manage finances for your entire household', color: 'text-teal-400' },
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
          <div className="flex items-center gap-4">
            {!session && (
              <a href="/login?callbackUrl=/intelligence/subscribe" className="text-sm text-slate-400 hover:text-white transition-colors">
                Sign In
              </a>
            )}
            <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
              ← Home
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-6 text-center">
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
              <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-10 h-10 text-cyan-400/60 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-mono">Start your free trial to unlock</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pricing + Signup Card ─────────────────────────────────────── */}
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

            <div className="space-y-2.5 mb-6">
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

            {/* Inline signup form for non-logged-in users */}
            {!session && (
              <div className="space-y-3 mb-5 pt-5 border-t border-white/10">
                <p className="text-xs text-slate-400 text-center mb-3">Create your account to start the trial</p>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (min 8 characters)"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

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
                  Start 7-Day Free Trial
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 text-center">
                <p className="text-red-400 text-sm">{error}</p>
                {showLoginLink && (
                  <a href="/login?callbackUrl=/intelligence/subscribe" className="text-cyan-400 text-sm hover:underline mt-1 inline-block">
                    Sign in to your existing account →
                  </a>
                )}
              </div>
            )}

            <p className="text-slate-600 text-xs text-center mt-4">
              Secure payment via Stripe · No charge during trial · Cancel anytime
            </p>
          </div>
        </div>

        {/* ── Intelligence Features Grid ────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold text-center mb-10">
            Everything in <span className="text-cyan-400">One Dashboard</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {intelFeatures.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all duration-300">
                <f.icon className="w-6 h-6 text-cyan-400 mb-3" />
                <h3 className="font-bold text-sm mb-1">{f.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Full Platform Upsell Section ──────────────────────────────── */}
        <div className="relative py-20 overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(245,158,11,0.03) 30%, rgba(245,158,11,0.03) 70%, transparent)' }} />
          <div className="max-w-5xl mx-auto px-6 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-mono mb-4">
                <Star className="w-4 h-4" />
                FULL PLATFORM
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Want More? <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Unlock Everything</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Intelligence is just the beginning. HomeLedger is a complete household finance platform
                with bank statements, invoices, bills, tax tools, secure vault, and much more.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {platformFeatures.map((f, i) => (
                <div key={i} className="rounded-xl border border-amber-500/10 bg-white/[0.02] p-5 hover:border-amber-500/20 transition-all duration-300">
                  <f.icon className={`w-6 h-6 ${f.color} mb-3`} />
                  <h3 className="font-bold text-sm mb-1">{f.label}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Upgrade pricing comparison */}
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-b from-slate-900/60 to-slate-950/60 backdrop-blur-xl p-8">
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="text-[10px] text-cyan-400 font-mono mb-1">INTELLIGENCE</div>
                    <div className="text-2xl font-black">£2.99</div>
                    <div className="text-[10px] text-slate-500">/month</div>
                    <div className="mt-2 text-[10px] text-slate-400">Global dashboard only</div>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 ring-1 ring-amber-500/20 relative">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-black">POPULAR</div>
                    <div className="text-[10px] text-amber-400 font-mono mb-1">STARTER</div>
                    <div className="text-2xl font-black">£7.99</div>
                    <div className="text-[10px] text-slate-500">/month</div>
                    <div className="mt-2 text-[10px] text-slate-400">Intelligence + Finance</div>
                  </div>
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                    <div className="text-[10px] text-purple-400 font-mono mb-1">PRO</div>
                    <div className="text-2xl font-black">£14.99</div>
                    <div className="text-[10px] text-slate-500">/month</div>
                    <div className="mt-2 text-[10px] text-slate-400">Everything unlimited</div>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-500">
                  You can upgrade anytime from your account settings. Your Intelligence subscription credit will be applied.
                </p>
              </div>
            </div>
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
