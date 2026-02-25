'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FileSpreadsheet, FileText, Receipt, BarChart3, KeyRound, Camera,
  TrendingUp, Home, Check, ChevronDown, ChevronUp, ArrowRight,
  PoundSterling, Shield, Zap, Users, CalendarClock, Briefcase,
  Building2, Eye, UserPlus, Menu, X, Link2, Tag, FolderOpen, Landmark,
  ArrowLeftRight, MessageSquare, GraduationCap, Sparkles, Lock, Brain,
  Github, Twitter, Linkedin, Send, Wifi, Building,
} from 'lucide-react';

const ALL_FEATURES = [
  { icon: FileSpreadsheet, title: 'Bank Statements', desc: 'Upload CSV, PDF or Excel statements. AI categorises every transaction and maps it to your accounts automatically.', color: 'from-amber-500/20 to-orange-500/10', ic: 'text-amber-400' },
  { icon: FileText, title: 'Invoices', desc: 'Create professional invoices, track payments and overdue amounts. Scan paper invoices with AI document processing.', color: 'from-blue-500/20 to-cyan-500/10', ic: 'text-blue-400' },
  { icon: Receipt, title: 'Bills & Subscriptions', desc: 'Manage recurring bills, set due-date reminders and track spending by provider. Never miss a payment.', color: 'from-emerald-500/20 to-teal-500/10', ic: 'text-emerald-400' },
  { icon: BarChart3, title: 'HMRC Tax Reports', desc: 'Generate SA103, CT600 and tax summaries with automatic HMRC box mapping. Export to PDF in one click.', color: 'from-purple-500/20 to-violet-500/10', ic: 'text-purple-400' },
  { icon: KeyRound, title: 'Secure Vault', desc: 'Store passwords, API keys and credentials with AES-256-GCM encryption. Bank-grade security for all your secrets.', color: 'from-rose-500/20 to-pink-500/10', ic: 'text-rose-400' },
  { icon: TrendingUp, title: 'Financial Projections', desc: 'Cash flow forecasting, budget tracking, savings goals and debt payoff plans. See your financial future.', color: 'from-cyan-500/20 to-sky-500/10', ic: 'text-cyan-400' },
  { icon: CalendarClock, title: 'Tax Timeline', desc: 'Visual calendar of HMRC deadlines — Self Assessment, VAT, Corporation Tax, PAYE. Alerts before every due date.', color: 'from-amber-500/20 to-yellow-500/10', ic: 'text-amber-400' },
  { icon: Camera, title: 'Capture & Classify', desc: 'Scan receipts and documents from your phone. AI extracts, categorises, and files everything automatically.', color: 'from-indigo-500/20 to-blue-500/10', ic: 'text-indigo-400' },
  { icon: Link2, title: 'Government APIs', desc: 'Connect to Companies House and HMRC. View company profiles, filing history, tax obligations and submit returns.', color: 'from-teal-500/20 to-emerald-500/10', ic: 'text-teal-400' },
  { icon: Home, title: 'UK Life Events', desc: 'Track life milestones — buying a home, marriage, starting a business. Personalised financial checklists.', color: 'from-pink-500/20 to-rose-500/10', ic: 'text-pink-400' },
  { icon: Landmark, title: 'Multi-Entity', desc: 'Manage personal finances alongside multiple Ltd companies, CICs or sole-trader businesses — all in one account.', color: 'from-violet-500/20 to-purple-500/10', ic: 'text-violet-400' },
  { icon: MessageSquare, title: 'AI Assistant', desc: 'Context-aware AI chat that understands your data. Ask about your finances and get instant, accurate answers.', color: 'from-sky-500/20 to-blue-500/10', ic: 'text-sky-400' },
  { icon: Tag, title: 'Smart Categories', desc: 'Custom categories with HMRC tax-box mapping. AI suggests the right category for every transaction.', color: 'from-orange-500/20 to-amber-500/10', ic: 'text-orange-400' },
  { icon: FolderOpen, title: 'Document Storage', desc: 'Upload and organise financial documents. Full-text search, entity linking and secure cloud storage.', color: 'from-lime-500/20 to-emerald-500/10', ic: 'text-lime-400' },
  { icon: ArrowLeftRight, title: 'Transfers', desc: 'Track inter-account transfers and reconcile balances across all your bank accounts and entities.', color: 'from-fuchsia-500/20 to-pink-500/10', ic: 'text-fuchsia-400' },
  { icon: GraduationCap, title: 'Financial Learning', desc: 'Built-in guides on UK tax, self-assessment, VAT registration, company accounts and personal finance.', color: 'from-yellow-500/20 to-amber-500/10', ic: 'text-yellow-400' },
  { icon: Brain, title: '4-Layer AI Categorisation', desc: 'Our intelligent engine learns from your corrections. Deterministic rules, pattern matching, AI classification, and auto-learning — 90%+ accuracy.', color: 'from-purple-500/20 to-fuchsia-500/10', ic: 'text-purple-400' },
  { icon: Shield, title: 'Identity Verification (KYC)', desc: 'Built-in certified identity checks. Verify yourself or your clients with document scanning and biometric matching. Stay compliant.', color: 'from-green-500/20 to-emerald-500/10', ic: 'text-green-400' },
  { icon: Wifi, title: 'Open Banking Sync', desc: 'Connect your UK bank accounts securely. Transactions sync automatically 3x daily. Full 24-month history on first connect.', color: 'from-blue-500/20 to-indigo-500/10', ic: 'text-blue-400' },
  { icon: Building, title: 'Companies House Filing', desc: 'File address changes and confirmation statements directly to Companies House. View officers, filing history, and company status in real time.', color: 'from-slate-500/20 to-zinc-500/10', ic: 'text-slate-400' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Create Your Free Account', desc: 'Sign up in under a minute. No credit card required. Add your personal profile or business entities.' },
  { step: '2', title: 'Upload Your Data', desc: 'Import bank statements, scan invoices and receipts, or connect to HMRC & Companies House directly.' },
  { step: '3', title: 'Get AI-Powered Insights', desc: 'AI categorises everything, generates tax reports, tracks deadlines and gives you a clear financial picture.' },
];

const TESTIMONIALS = [
  { name: 'James Mitchell', role: 'Sole Trader, London', text: 'HomeLedger saved me hours every month. The AI categorisation is incredibly accurate and HMRC reports are generated in seconds.', avatar: 'JM' },
  { name: 'Sarah Chen', role: 'Director, Tech Solutions Ltd', text: 'Managing multiple entities used to be a nightmare. Now everything is in one place — invoices, tax reports, bank statements.', avatar: 'SC' },
  { name: 'David Okafor', role: 'Chartered Accountant', text: "The accountant portal is a game-changer. I can view all my clients' data without them sharing passwords. Brilliant.", avatar: 'DO' },
];

const FAQ_ITEMS = [
  { q: 'Is HomeLedger really free?', a: 'Yes! Our Free plan includes full access to statements, invoices, bills, categories, and basic reports. Premium plans add advanced features like AI chat, financial projections, and priority support.' },
  { q: 'Is my financial data secure?', a: 'Absolutely. All data is encrypted in transit (TLS 1.3) and at rest. Vault entries use AES-256-GCM encryption. We never share your data with third parties.' },
  { q: 'Can I manage multiple businesses?', a: 'Yes. HomeLedger supports unlimited entities — personal accounts, limited companies, CICs, sole-trader businesses — all from one login.' },
  { q: 'Does it generate HMRC-ready reports?', a: 'Yes. We generate SA103 (Self Assessment), CT600 (Corporation Tax), and detailed tax summaries with automatic box mapping. Export to PDF anytime.' },
  { q: 'Can my accountant access my data?', a: 'Yes. Invite your accountant via email. They get a dedicated dashboard to view your data with read-only permissions — no credential sharing needed.' },
  { q: 'What file formats do you support?', a: 'We accept CSV, PDF, Excel (.xlsx), and image files (JPG, PNG) for bank statements, invoices, and documents. Our AI processes them all.' },
  { q: 'Can I install HomeLedger as a desktop app?', a: 'Yes! HomeLedger is a Progressive Web App (PWA). Click "Install" in your browser to add it to your desktop or mobile home screen.' },
  { q: 'How does the AI Assistant work?', a: 'Our AI understands the context of the page you\'re on. Ask it about your statements, tax obligations, or spending patterns and it gives personalised answers.' },
];

const FALLBACK_PLANS = [
  { name: 'Free', price: '£0', period: '', features: ['Unlimited statements', 'Invoices & bills', 'Basic reports', 'Up to 2 entities', 'Document storage'], cta: 'Get Started Free', highlighted: false },
  { name: 'Pro', price: '£9.99', period: '/month', features: ['Everything in Free', 'AI Assistant', 'Financial projections', 'Unlimited entities', 'Tax timeline alerts', 'Priority support'], cta: 'Start Free Trial', highlighted: true },
  { name: 'Business', price: '£24.99', period: '/month', features: ['Everything in Pro', 'Accountant portal', 'Government API access', 'Team collaboration', 'Advanced reports', 'Dedicated support'], cta: 'Start Free Trial', highlighted: false },
];

interface CmsSection { sectionKey: string; title?: string; subtitle?: string; content?: any; }

export function LandingPage() {
  const { status } = useSession();
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [cms, setCms] = useState<CmsSection[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [loginDropdown, setLoginDropdown] = useState(false);

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(d => { if (Array.isArray(d)) setDbPlans(d); }).catch(() => {});
    fetch('/api/cms').then(r => r.json()).then(d => { if (Array.isArray(d)) setCms(d); }).catch(() => {});
  }, []);

  const getCms = (key: string) => cms.find(s => s.sectionKey === key);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30 animate-pulse flex items-center justify-center">
          <PoundSterling className="h-8 w-8 text-slate-900" />
        </div>
      </div>
    );
  }

  const NAV = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#business', label: 'For Business' },
    { href: '#accountants', label: 'For Accountants' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ];

  const plans = dbPlans.length > 0
    ? dbPlans.map((p: any) => ({
        key: p.id, name: p.displayName,
        price: p.price === 0 ? '£0' : `£${p.price}`,
        period: p.price === 0 ? '' : `/${p.interval || 'month'}`,
        features: p.features || [], highlighted: p.isDefault,
        cta: p.price === 0 ? 'Get Started Free' : 'Start Free Trial',
      }))
    : FALLBACK_PLANS.map((p, i) => ({ key: i, ...p }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-500/20 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-slate-900" />
            </div>
            <span className="text-xl font-bold text-white">HomeLedger</span>
          </Link>
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
            {NAV.map(l => <a key={l.href} href={l.href} className="hover:text-amber-400 transition-colors duration-200">{l.label}</a>)}
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setLoginDropdown(!loginDropdown)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Sign In <ChevronDown className={`h-3.5 w-3.5 transition-transform ${loginDropdown ? 'rotate-180' : ''}`} />
              </button>
              {loginDropdown && (
                <div className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-2xl shadow-black/40 py-1 z-50">
                  <Link href="/login" onClick={() => setLoginDropdown(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-amber-400 hover:bg-white/5 transition-colors">
                    <Shield className="h-4 w-4 text-amber-400" /> Admin Login
                  </Link>
                  <Link href="/login" onClick={() => setLoginDropdown(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition-colors">
                    <Users className="h-4 w-4 text-cyan-400" /> User Login
                  </Link>
                </div>
              )}
            </div>
            <Link href="/register" className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-sm font-semibold hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all duration-200">Get Started Free</Link>
          </div>
          <button className="lg:hidden p-2 text-slate-400" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="lg:hidden border-t border-white/5 bg-slate-900/95 backdrop-blur-xl px-4 pb-4 space-y-2">
            {NAV.map(l => <a key={l.href} href={l.href} onClick={() => setMobileNav(false)} className="block py-2 text-sm font-medium text-slate-400 hover:text-amber-400">{l.label}</a>)}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileNav(false)} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 text-sm font-medium text-slate-300">
                Sign In
              </Link>
              <Link href="/register" onClick={() => setMobileNav(false)} className="block text-center py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-sm font-semibold">Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden cyber-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
        <div className="absolute top-20 left-[10%] w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] orb-float-slow" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-cyan-500/8 rounded-full blur-[120px] orb-float-medium" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 sm:pt-32 sm:pb-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold mb-8">
              <Sparkles className="h-3.5 w-3.5" /> AI-Powered UK Finance Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              {getCms('hero')?.content?.headline || (
                <>
                  <span className="text-white">Your UK Finances,</span><br />
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent neon-text-amber">
                    Finally Simplified
                  </span>
                </>
              )}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {getCms('hero')?.content?.subheadline || 'Bank statements, invoices, HMRC reports, tax deadlines, secure vault and AI assistant — all in one platform built for UK individuals and businesses.'}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-base hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02]">
                Start Free <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass text-slate-300 font-semibold text-base hover:text-white hover:bg-white/10 transition-all duration-200">
                See How It Works
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-500">No credit card required · Free forever plan</p>
          </div>

          {/* Hero visual — floating dashboard mock */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-1 shadow-2xl shadow-black/30">
              <div className="bg-slate-900/80 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80" />
                  <span className="ml-3 text-xs text-slate-500">homeledger.co.uk/dashboard</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Income', value: '£42,850', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-500/5' },
                    { label: 'Total Expenses', value: '£28,340', color: 'text-rose-400', bg: 'from-rose-500/10 to-rose-500/5' },
                    { label: 'Transactions', value: '1,247', color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-500/5' },
                    { label: 'Tax Saved', value: '£8,120', color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-500/5' },
                  ].map((s, i) => (
                    <div key={i} className={`bg-gradient-to-br ${s.bg} rounded-lg p-3 border border-white/5`}>
                      <p className="text-[11px] text-slate-500">{s.label}</p>
                      <p className={`text-lg font-bold ${s.color} mt-1`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="relative py-10">
        <div className="neon-line w-full mb-10" />
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '16+', l: 'Financial Modules', Icon: Zap },
            { n: 'AI', l: 'Powered Automation', Icon: Sparkles },
            { n: 'HMRC', l: 'Compliant Reports', Icon: BarChart3 },
            { n: '256-bit', l: 'AES Encryption', Icon: Lock },
          ].map((s, i) => (
            <div key={i} className="stat-glow rounded-xl p-5">
              <s.Icon className="h-5 w-5 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-cyan-400 bg-clip-text text-transparent">{s.n}</div>
              <div className="text-sm text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="neon-line w-full mt-10" />
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{getCms('features')?.title || 'Everything You Need in One Place'}</h2>
            <p className="mt-4 text-lg text-slate-400">{getCms('features')?.subtitle || '16 powerful modules designed specifically for UK personal and business finance.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ALL_FEATURES.map((f, i) => (
              <div key={i} className="group neon-card p-6">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className={`h-6 w-6 ${f.ic} icon-neon`} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Business ────────────────────────────────────────────────── */}
      <section id="business" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-slate-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-semibold mb-6">
                <Building2 className="h-3.5 w-3.5" /> For UK Businesses
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">Run Your Business Finances with Confidence</h2>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                Whether you&apos;re a sole trader, limited company, or CIC — HomeLedger handles invoices, tax reports, Companies House filings, and HMRC obligations.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Landmark, text: 'Manage multiple entities — Ltd, CIC, sole trader, personal' },
                  { icon: BarChart3, text: 'SA103 & CT600 reports with automatic box mapping' },
                  { icon: Link2, text: 'Companies House & HMRC API integration' },
                  { icon: CalendarClock, text: 'Tax deadline alerts — SA, VAT, CT, PAYE' },
                  { icon: FileText, text: 'Professional invoices with payment tracking' },
                  { icon: Tag, text: 'AI categorisation with tax-regime awareness' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-cyan-400/10 border border-cyan-400/10 flex items-center justify-center flex-shrink-0 group-hover:border-cyan-400/30 transition-colors">
                      <item.icon className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="text-slate-400 text-sm leading-relaxed pt-1 group-hover:text-slate-300 transition-colors">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="neon-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2"><Landmark className="h-5 w-5 text-cyan-400" /><span className="font-semibold text-white">Your Entities</span></div>
                {[{ name: 'Tech Solutions Ltd', type: 'Limited Company', co: '#12345678' }, { name: 'Sarah Consulting', type: 'Sole Trader', co: 'UTR: 12345' }, { name: 'Personal Account', type: 'Personal', co: '' }].map((e, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:border-cyan-400/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-cyan-400/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-cyan-400" /></div>
                      <div><div className="text-sm font-medium text-white">{e.name}</div><div className="text-xs text-slate-500">{e.type}{e.co && ` · ${e.co}`}</div></div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Active</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{getCms('howItWorks')?.title || 'Up and Running in Minutes'}</h2>
            <p className="mt-4 text-lg text-slate-400">{getCms('howItWorks')?.subtitle || 'Three simple steps to take control of your finances'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="relative text-center group">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-400/20 to-cyan-400/10 border border-amber-400/20 text-3xl font-bold text-amber-400 mb-6 shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/20 transition-shadow neon-text-amber">
                  {s.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[65%] w-[70%] h-[2px]">
                    <div className="h-full bg-gradient-to-r from-amber-400/40 to-cyan-400/20 shadow-sm shadow-amber-400/20" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Trusted by UK Professionals</h2>
            <p className="mt-4 text-lg text-slate-400">See what sole traders, business owners and accountants say about HomeLedger.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="neon-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400/20 to-cyan-400/10 border border-amber-400/15 flex items-center justify-center text-sm font-bold text-amber-400">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Accountants ─────────────────────────────────────────────── */}
      <section id="accountants" className="py-20 sm:py-28 relative cyber-grid">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold mb-6">
                <Briefcase className="h-3.5 w-3.5" /> For Accounting Firms
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">Manage All Your Clients in One Place</h2>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                Dedicated dashboard to onboard clients, view financial data, and generate HMRC-ready reports — without sharing login credentials.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: UserPlus, text: 'Invite clients by email — they keep their own account' },
                  { icon: Eye, text: 'View statements, invoices, bills & entities in real-time' },
                  { icon: BarChart3, text: 'HMRC SA103 & CT600 reports at your fingertips' },
                  { icon: Shield, text: 'Granular permissions — read-only by default' },
                  { icon: Building2, text: 'Multi-entity support for complex client portfolios' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-amber-400/10 border border-amber-400/10 flex items-center justify-center flex-shrink-0 group-hover:border-amber-400/30 transition-colors"><item.icon className="h-4 w-4 text-amber-400" /></div>
                    <span className="text-slate-400 text-sm leading-relaxed pt-1 group-hover:text-slate-300 transition-colors">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold text-sm hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20">
                  Start Free as Accountant <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10">View Pricing</a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="neon-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4"><Briefcase className="h-6 w-6 text-amber-400" /><span className="text-white font-semibold">Accountant Dashboard</span></div>
                {['John Smith — Sole Trader', 'ABC Ltd — Limited Company', 'Sarah Jones — Freelancer'].map((name, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:border-amber-400/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-amber-400/20 flex items-center justify-center"><Users className="h-4 w-4 text-amber-400" /></div>
                      <div>
                        <div className="text-white text-sm font-medium">{name}</div>
                        <div className="text-slate-500 text-xs">{i === 0 ? '3 entities · Last viewed today' : i === 1 ? '1 entity · 2 days ago' : '2 entities · Pending'}</div>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${i < 2 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'}`}>{i < 2 ? 'Active' : 'Pending'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-slate-400">Start free. Upgrade when you need more power.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((p: any) => (
              <div key={p.key} className={`relative neon-card p-8 transition-all ${p.highlighted ? 'pricing-glow neon-pulse scale-[1.03]' : ''}`}>
                {p.highlighted && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs font-bold rounded-full shadow-lg shadow-amber-500/20">Most Popular</div>}
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-cyan-400 bg-clip-text text-transparent">{p.price}</span>
                  <span className="text-slate-500 text-sm">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f: string, j: number) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-400"><Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-8 block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${p.highlighted ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20' : 'glass text-white hover:bg-white/10'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16"><h2 className="text-3xl sm:text-4xl font-bold text-white">{getCms('faq')?.title || 'Frequently Asked Questions'}</h2></div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="neon-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors">
                  <span className="font-medium text-white text-sm pr-4">{item.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-amber-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{getCms('cta')?.content?.headline || 'Ready to Take Control of Your Finances?'}</h2>
          <p className="mt-4 text-lg text-slate-400">{getCms('cta')?.content?.subheadline || 'Join UK individuals, sole traders and businesses already using HomeLedger.'}</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-base hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02]">
            Create Your Free Account <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-sm text-slate-500">No credit card required · Free forever plan</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-slate-900/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-500/20 flex items-center justify-center">
                  <PoundSterling className="h-4 w-4 text-slate-900" />
                </div>
                <span className="text-lg font-bold text-white">HomeLedger</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">AI-powered UK finance platform for individuals and businesses.</p>
              <div className="flex items-center gap-3 mt-4">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <a key={i} href="#" className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:border-amber-400/30 hover:bg-amber-400/5 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-slate-400 hover:text-amber-400" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <div className="space-y-2.5 text-sm text-slate-500">
                <a href="#features" className="block hover:text-amber-400 transition-colors">Features</a>
                <a href="#pricing" className="block hover:text-amber-400 transition-colors">Pricing</a>
                <a href="#faq" className="block hover:text-amber-400 transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Solutions</h4>
              <div className="space-y-2.5 text-sm text-slate-500">
                <a href="#business" className="block hover:text-amber-400 transition-colors">For Business</a>
                <a href="#accountants" className="block hover:text-amber-400 transition-colors">For Accountants</a>
                <a href="#features" className="block hover:text-amber-400 transition-colors">Personal Finance</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <div className="space-y-2.5 text-sm text-slate-500">
                <Link href="/privacy" className="block hover:text-slate-300 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-slate-300 transition-colors">Terms of Service</Link>
                <Link href="/cookies" className="block hover:text-slate-300 transition-colors">Cookie Policy</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Newsletter</h4>
              <p className="text-xs text-slate-500 mb-3">Get UK finance tips and product updates.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="your@email.com" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none transition-colors" />
                <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400 transition-all">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="neon-line w-full mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">&copy; {new Date().getFullYear()} HomeLedger. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/login" className="hover:text-amber-400 transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-amber-400 transition-colors">Create Account</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
