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
  Github, Twitter, Linkedin, Send, Wifi, Building, Globe, ShoppingBag,
  HeartPulse, Smartphone, BookOpen, Plane, Fingerprint, CreditCard,
  BadgeCheck, ScanLine, FileCheck, UserCheck, ShieldCheck, Scale,
  AlertTriangle, Clock, Scan, CircleCheck, ChevronRight,
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
  { icon: GraduationCap, title: 'Accounting Academy', desc: 'AAT & ACCA exam practice with timed tests, study mode, AI tutor, and a visual career roadmap from Level 2 to Level 6.', color: 'from-indigo-500/20 to-violet-500/10', ic: 'text-indigo-400' },
  { icon: Globe, title: 'UK Relocation Hub', desc: 'AI-powered guide for newcomers to the UK. Visa advice, NI numbers, bank accounts, GP registration — fully OISC compliant.', color: 'from-teal-500/20 to-cyan-500/10', ic: 'text-teal-400' },
  { icon: ShoppingBag, title: 'Service Marketplace', desc: 'Professional accounting, tax filing, and bookkeeping services. Browse packages, compare prices, and track your orders.', color: 'from-rose-500/20 to-orange-500/10', ic: 'text-rose-400' },
  { icon: HeartPulse, title: 'Financial Health Score', desc: 'Real-time score based on 6 components: bill tracking, categorisation, savings rate, budgets, actions, and data freshness.', color: 'from-red-500/20 to-pink-500/10', ic: 'text-red-400' },
  { icon: Smartphone, title: 'Install as App (PWA)', desc: 'Install HomeLedger on your phone or desktop. Works offline, instant access from your home screen — no app store needed.', color: 'from-sky-500/20 to-blue-500/10', ic: 'text-sky-400' },
  { icon: Link2, title: 'Accountant Portal', desc: 'Share financial data with your accountant via secure, read-only links. No password sharing — they see exactly what you allow.', color: 'from-emerald-500/20 to-green-500/10', ic: 'text-emerald-400' },
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
  { q: 'What is the Accounting Academy?', a: 'A built-in exam practice platform for AAT (Levels 2–4) and ACCA (Levels 5–6). Features timed exams, study mode with explanations, an AI tutor, and a visual career roadmap with salary ranges. Perfect for aspiring accountants or anyone wanting to understand UK bookkeeping.' },
  { q: 'Do you offer relocation support for newcomers?', a: 'Yes! Our UK Relocation Hub is an AI-powered guide that helps newcomers with visa advice, National Insurance numbers, opening bank accounts, GP registration, council tax, and more. All advice is OISC compliant. We also offer professional relocation services through our marketplace.' },
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
    { href: '#verify-id', label: 'Verify ID' },
    { href: '#new-arrivals', label: 'New to UK' },
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
            { n: '22+', l: 'Financial Modules', Icon: Zap },
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
            <p className="mt-4 text-lg text-slate-400">{getCms('features')?.subtitle || '22 powerful modules designed specifically for UK personal and business finance.'}</p>
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

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ═══  IDENTITY VERIFICATION — FULL FEATURE SHOWCASE  ═══════ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* ── IDV Hero ───────────────────────────────────────────────── */}
      <section id="verify-id" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-slate-950 to-indigo-950/60" />
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-400 text-xs font-semibold mb-6">
                <Fingerprint className="h-3.5 w-3.5" /> Certified Identity Verification (IDV)
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
                Verify Anyone&apos;s<br />Identity
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> Digitally</span>
              </h2>
              <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                Identity Document Verification (IDV) is a <strong className="text-white">certified digital process</strong> that confirms a person is who they claim to be. It combines <strong className="text-white">document scanning</strong> (passport, driving licence, BRP) with <strong className="text-white">biometric facial matching</strong> — all from a smartphone.
              </p>
              <p className="mt-4 text-base text-slate-500 leading-relaxed">
                The person simply opens a secure link on their phone, takes a photo of their ID document, then takes a selfie. Our AI compares the face on the document with the live selfie in seconds. The result is a <strong className="text-slate-300">government-grade certified report</strong> delivered straight to your inbox.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/verify-purchase" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 font-semibold text-sm hover:from-violet-300 hover:to-cyan-300 shadow-lg shadow-violet-500/20 transition-all">
                  Start Verifying <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#idv-law" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10 transition-all">
                  <Scale className="h-4 w-4" /> UK Legal Requirements
                </a>
              </div>
            </div>
            {/* Right — Phone Mockup SVG Illustration */}
            <div className="flex justify-center relative">
              <div className="relative w-[260px] sm:w-[280px]">
                {/* Phone Frame */}
                <div className="relative rounded-[2.5rem] border-[3px] border-slate-600/50 bg-slate-900 p-3 shadow-2xl shadow-violet-500/20 ring-1 ring-violet-500/10">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-2xl z-10" />
                  {/* Screen */}
                  <div className="rounded-[2rem] bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-5 pt-7 pb-1 text-[10px] text-slate-500">
                      <span>14:32</span>
                      <div className="flex items-center gap-1"><Wifi className="h-2.5 w-2.5" /><span>98%</span></div>
                    </div>
                    {/* App Header */}
                    <div className="px-4 py-2.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4 text-violet-400" />
                        <span className="text-white text-xs font-semibold">Identity Check</span>
                      </div>
                    </div>
                    {/* Camera Viewfinder */}
                    <div className="px-4 py-3">
                      <div className="relative aspect-[4/3] rounded-xl border-2 border-dashed border-violet-400/30 bg-violet-400/5 flex flex-col items-center justify-center gap-2">
                        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-violet-400 rounded-tl-md" />
                        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-violet-400 rounded-tr-md" />
                        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-violet-400 rounded-bl-md" />
                        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-violet-400 rounded-br-md" />
                        <Scan className="h-7 w-7 text-violet-400/50" />
                        <span className="text-violet-400/80 text-[10px] font-medium">Position your ID here</span>
                      </div>
                      <p className="text-center text-[9px] text-slate-500 mt-1.5">Align passport or driving licence within the frame</p>
                    </div>
                    {/* Progress Steps */}
                    <div className="px-4 pb-3 space-y-1.5">
                      {[
                        { text: 'Scan ID Document', done: true },
                        { text: 'Take a Selfie', done: false },
                        { text: 'Verification Complete', done: false },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${s.done ? 'bg-violet-400 text-slate-900' : 'bg-white/10 text-slate-500'}`}>
                            {s.done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                          </div>
                          <span className={`text-[11px] ${s.done ? 'text-white' : 'text-slate-500'}`}>{s.text}</span>
                        </div>
                      ))}
                    </div>
                    {/* Button */}
                    <div className="px-4 pb-5">
                      <div className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-400 to-cyan-400 text-center text-slate-900 text-[11px] font-bold">
                        Capture Document
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badges — positioned well outside the phone */}
                <div className="absolute -top-3 -right-16 sm:-right-20 px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[11px] font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 backdrop-blur-sm">
                  <CircleCheck className="h-3.5 w-3.5" /> Face Match: 99.7%
                </div>
                <div className="absolute top-1/2 -right-14 sm:-right-[4.5rem] px-3 py-1.5 rounded-lg bg-violet-400/10 border border-violet-400/20 text-violet-400 text-[11px] font-medium flex items-center gap-1.5 shadow-lg shadow-violet-500/10 backdrop-blur-sm">
                  <Shield className="h-3.5 w-3.5" /> GDPR Certified
                </div>
                <div className="absolute -bottom-3 -left-14 sm:-left-16 px-3 py-1.5 rounded-lg bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[11px] font-medium flex items-center gap-1.5 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5" /> ~90 seconds
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IDV: UK Law Requires It ────────────────────────────────── */}
      <section id="idv-law" className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950/10 to-slate-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-semibold mb-6">
              <Scale className="h-3.5 w-3.5" /> UK Legal Requirement
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              It&apos;s Not Optional —<br />
              <span className="text-red-400">It&apos;s UK Law</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              The UK government requires identity verification in multiple scenarios. Failure to comply can result in <strong className="text-white">unlimited fines</strong>, <strong className="text-white">criminal prosecution</strong>, and <strong className="text-white">loss of your licence to operate</strong>. Every business, landlord, and professional in the UK must comply.
            </p>
          </div>

          {/* Law Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Briefcase,
                title: 'Right to Work (Employers)',
                law: 'Immigration, Asylum & Nationality Act 2006',
                desc: 'Every UK employer MUST verify the identity and right to work of all employees before their first day. Penalties: up to £60,000 per illegal worker and criminal prosecution.',
                penalty: 'Up to £60,000 per worker',
                iconBg: 'bg-violet-400/10 border-violet-400/20',
                iconColor: 'text-violet-400',
              },
              {
                icon: Home,
                title: 'Right to Rent (Landlords)',
                law: 'Immigration Act 2014 (Part 3)',
                desc: 'All landlords in England MUST check that tenants have the right to rent in the UK. This includes verifying passports, BRPs, or share codes before signing any tenancy agreement.',
                penalty: 'Up to £3,000 per tenant',
                iconBg: 'bg-amber-400/10 border-amber-400/20',
                iconColor: 'text-amber-400',
              },
              {
                icon: Building2,
                title: 'AML & KYC (Financial Services)',
                law: 'Money Laundering Regulations 2017',
                desc: 'Banks, accountants, estate agents, and regulated firms MUST verify customer identity under Anti-Money Laundering regulations. Required by the FCA and enforced by HMRC.',
                penalty: 'Unlimited fines + prison',
                iconBg: 'bg-red-400/10 border-red-400/20',
                iconColor: 'text-red-400',
              },
              {
                icon: GraduationCap,
                title: 'DBS Checks (Education & Care)',
                law: 'Safeguarding Vulnerable Groups Act 2006',
                desc: 'Schools, nurseries, care homes and anyone working with children or vulnerable adults MUST undergo identity verification as part of DBS (formerly CRB) checks.',
                penalty: 'Barred from profession',
                iconBg: 'bg-blue-400/10 border-blue-400/20',
                iconColor: 'text-blue-400',
              },
              {
                icon: Globe,
                title: 'Sponsor Licence (Visa Sponsors)',
                law: 'UK Points-Based Immigration System',
                desc: 'Businesses holding a Sponsor Licence MUST maintain records of identity checks for all sponsored workers. UKVI audits can revoke your licence if records are missing.',
                penalty: 'Licence revocation',
                iconBg: 'bg-teal-400/10 border-teal-400/20',
                iconColor: 'text-teal-400',
              },
              {
                icon: ShieldCheck,
                title: 'GDPR Data Verification',
                law: 'UK GDPR & Data Protection Act 2018',
                desc: 'Organisations handling personal data may need to verify identity before granting Subject Access Requests. Proper IDV ensures GDPR compliance and data protection.',
                penalty: 'Up to £17.5 million',
                iconBg: 'bg-emerald-400/10 border-emerald-400/20',
                iconColor: 'text-emerald-400',
              },
            ].map((law, i) => (
              <div key={i} className="neon-card p-6 group hover:border-violet-400/20 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-11 w-11 rounded-xl ${law.iconBg} border flex items-center justify-center flex-shrink-0`}>
                    <law.icon className={`h-5 w-5 ${law.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{law.title}</h3>
                    <p className="text-[11px] text-violet-400/70 font-medium mt-0.5">{law.law}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{law.desc}</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-400/5 border border-red-400/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-400 font-medium">Penalty: {law.penalty}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Urgency Banner */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-2xl bg-gradient-to-r from-red-500/10 via-violet-500/10 to-red-500/10 border border-red-400/20 p-8">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Are You Compliant?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Since <strong className="text-white">April 2022</strong>, the Home Office requires all Right to Work and Right to Rent checks to use a <strong className="text-white">certified Identity Document Validation Technology (IDVT)</strong> provider. Manual checks of physical documents are no longer sufficient for most document types. HomeLedger uses <strong className="text-white">Yoti</strong>, a UK-government certified IDVT provider.
              </p>
              <Link href="/verify-purchase" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 font-semibold text-sm hover:from-violet-300 hover:to-cyan-300 shadow-lg shadow-violet-500/20 transition-all">
                Get Compliant Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── IDV: Who Needs This ────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Who Needs Identity Verification?</h2>
            <p className="mt-4 text-lg text-slate-400">Almost every business and professional in the UK. Here are the most common use cases.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Briefcase, title: 'Employers & HR Teams', desc: 'Verify Right to Work for every new hire. From startups to large corporates — it\'s a legal requirement before the employee\'s first day.', people: 'All UK employers' },
              { icon: Home, title: 'Landlords & Letting Agents', desc: 'Right to Rent checks before signing tenancy agreements. Applies to all residential lettings in England.', people: '2.6 million UK landlords' },
              { icon: Building2, title: 'Accountants & Financial Advisors', desc: 'Client onboarding KYC/AML checks. Required under Money Laundering Regulations for all regulated firms.', people: 'FCA regulated firms' },
              { icon: Scale, title: 'Solicitors & Law Firms', desc: 'Client verification for conveyancing, litigation, and corporate transactions. SRA requires robust ID checks.', people: 'SRA regulated solicitors' },
              { icon: Globe, title: 'Immigration Advisors', desc: 'Document verification for visa applications, settled status, and naturalisation. Share certified results with the Home Office.', people: 'OISC registered advisors' },
              { icon: Users, title: 'Recruitment Agencies', desc: 'Bulk verification for temporary and permanent placements. Process hundreds of checks efficiently with our Business Pack.', people: '30,000+ UK agencies' },
            ].map((item, i) => (
              <div key={i} className="neon-card p-6 group hover:border-violet-400/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-400/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    <span className="text-violet-400/60 text-[11px] font-medium">{item.people}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IDV: Visual Process ─────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-violet-950/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How It Works — Step by Step</h2>
            <p className="mt-4 text-lg text-slate-400">The entire process takes less than 90 seconds. No apps to download, no accounts to create.</p>
          </div>

          {/* Visual Process Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              {
                step: '01',
                title: 'You Buy a Package',
                desc: 'Choose Single, Business or Enterprise. Pay securely via Stripe. You receive unique verification links instantly.',
                illustration: (
                  <div className="relative h-40 bg-gradient-to-b from-violet-400/5 to-transparent rounded-2xl flex items-center justify-center overflow-hidden">
                    <div className="relative w-32 h-24 rounded-xl bg-white/5 border border-white/10 p-3">
                      <div className="flex gap-1 mb-2">{[1,2,3].map(d => <div key={d} className="h-1.5 w-1.5 rounded-full bg-slate-600" />)}</div>
                      <div className="space-y-1.5">
                        <div className="h-2 w-16 bg-violet-400/20 rounded" />
                        <div className="h-2 w-20 bg-violet-400/10 rounded" />
                        <div className="h-6 w-full bg-gradient-to-r from-violet-400/30 to-cyan-400/30 rounded-lg mt-2 flex items-center justify-center"><CreditCard className="h-3 w-3 text-violet-400" /></div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                step: '02',
                title: 'Send the Link',
                desc: 'Share the secure verification link via email, WhatsApp, or text. The person to be verified opens it on their phone.',
                illustration: (
                  <div className="relative h-40 bg-gradient-to-b from-blue-400/5 to-transparent rounded-2xl flex items-center justify-center overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-400/20 flex items-center justify-center"><Users className="h-5 w-5 text-violet-400" /></div>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-16 h-0.5 bg-gradient-to-r from-violet-400 to-cyan-400" />
                        <Send className="h-3 w-3 text-cyan-400" />
                      </div>
                      <div className="w-8 h-14 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                        <Fingerprint className="h-4 w-4 text-cyan-400" />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                step: '03',
                title: 'Scan & Selfie',
                desc: 'They photograph their ID document (passport, driving licence, or BRP) and take a live selfie for biometric matching.',
                illustration: (
                  <div className="relative h-40 bg-gradient-to-b from-emerald-400/5 to-transparent rounded-2xl flex items-center justify-center overflow-hidden">
                    <div className="relative">
                      <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-400/20 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-6 h-6 rounded-full bg-slate-600/50 mx-auto mb-1 flex items-center justify-center"><UserCheck className="h-3 w-3 text-blue-400" /></div>
                          <div className="text-[8px] text-blue-400/60 font-mono">PASSPORT</div>
                        </div>
                      </div>
                      <div className="absolute -right-6 -bottom-3 w-10 h-10 rounded-full bg-emerald-400/10 border-2 border-emerald-400/30 flex items-center justify-center">
                        <Camera className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                step: '04',
                title: 'Certified Result',
                desc: 'AI verifies the document and matches the face. You receive a certified result by email within seconds.',
                illustration: (
                  <div className="relative h-40 bg-gradient-to-b from-emerald-400/5 to-transparent rounded-2xl flex items-center justify-center overflow-hidden">
                    <div className="w-28 h-20 rounded-xl bg-white/5 border border-emerald-400/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CircleCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold">VERIFIED</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px]"><span className="text-slate-500">Name</span><span className="text-white">John Smith</span></div>
                        <div className="flex justify-between text-[8px]"><span className="text-slate-500">Match</span><span className="text-emerald-400">99.7%</span></div>
                        <div className="flex justify-between text-[8px]"><span className="text-slate-500">Doc</span><span className="text-white">Passport</span></div>
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                {s.illustration}
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">{s.step}</span>
                    <h3 className="text-white font-semibold text-sm">{s.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IDV: Pricing ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-slate-950 to-indigo-950/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, Transparent Verification Pricing</h2>
            <p className="mt-4 text-lg text-slate-400">No hidden fees. No subscription. Pay once, verify as needed. <strong className="text-white">No HomeLedger account required.</strong></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {[
              { name: 'Single Check', price: '£2.99', per: '/check', checks: '1 verification', features: ['Document scanning', 'Biometric face match', 'Certified PDF result', 'Email delivery', '30-day link validity', 'Passport, DL, or BRP'], highlighted: false },
              { name: 'Business Pack', price: '£19.99', per: '/pack', checks: '10 verifications', features: ['Everything in Single', '10 unique verification links', 'Bulk management dashboard', 'Priority processing', '60-day link validity', 'Ideal for SMEs & agencies'], highlighted: true, badge: 'Best Value — Save 33%' },
              { name: 'Enterprise', price: '£49.99', per: '/pack', checks: '50 verifications', features: ['Everything in Business', '50 unique verification links', 'Dedicated account support', 'API access for automation', '90-day link validity', 'For large organisations'], highlighted: false },
            ].map((plan, i) => (
              <div key={i} className={`relative neon-card p-8 transition-all ${plan.highlighted ? 'border-violet-400/40 shadow-lg shadow-violet-500/10 scale-[1.03]' : ''}`}>
                {plan.badge && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 text-xs font-bold rounded-full shadow-lg shadow-violet-500/20 whitespace-nowrap">{plan.badge}</div>}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="text-xs text-slate-500 mt-1">{plan.checks}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.per}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-400"><Check className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <Link href={`/verify-purchase?plan=${plan.name.toLowerCase().replace(/\s/g, '-')}`} className={`mt-8 block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.highlighted ? 'bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 hover:from-violet-300 hover:to-cyan-300 shadow-lg shadow-violet-500/20' : 'glass text-white hover:bg-white/10'}`}>
                  Buy Now
                </Link>
              </div>
            ))}
          </div>

          {/* Trust Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 mb-8">
            {[
              { icon: Shield, text: 'Government-Certified (IDVT)' },
              { icon: Lock, text: 'UK GDPR Compliant' },
              { icon: Fingerprint, text: 'AI Biometric Matching' },
              { icon: BadgeCheck, text: 'Home Office Approved' },
              { icon: Clock, text: 'Results in ~90 Seconds' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <badge.icon className="h-3.5 w-3.5 text-violet-400" />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-400/20">
              <ScanLine className="h-5 w-5 text-violet-400" />
              <span className="text-slate-300 text-sm font-medium">No account needed — purchase, send the link, get results. It&apos;s that simple.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── For New Arrivals ──────────────────────────────────────────── */}
      <section id="new-arrivals" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-slate-900/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-xs font-semibold mb-6">
                <Plane className="h-3.5 w-3.5" /> For New UK Arrivals
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">New to the UK? We&apos;ve Got You Covered</h2>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                Whether you&apos;re relocating for work, study, or family — HomeLedger helps you navigate UK finances, accounting qualifications, and professional services from day one.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Globe, text: 'AI Relocation Guide — visas, NI numbers, bank accounts, GP registration (OISC compliant)' },
                  { icon: GraduationCap, text: 'Accounting Academy — AAT & ACCA exam practice with AI tutor and career roadmap' },
                  { icon: ShoppingBag, text: 'Service Marketplace — professional accounting, tax filing, and bookkeeping packages' },
                  { icon: HeartPulse, text: 'Financial Health Score — track your financial wellbeing with a real-time dashboard' },
                  { icon: Smartphone, text: 'Install as App — access HomeLedger offline from your phone or desktop' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-teal-400/10 border border-teal-400/10 flex items-center justify-center flex-shrink-0 group-hover:border-teal-400/30 transition-colors">
                      <item.icon className="h-4 w-4 text-teal-400" />
                    </div>
                    <span className="text-slate-400 text-sm leading-relaxed pt-1 group-hover:text-slate-300 transition-colors">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-900 font-semibold text-sm hover:from-teal-300 hover:to-cyan-400 shadow-lg shadow-teal-500/20">
                  Start Free Today <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="neon-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2"><Plane className="h-5 w-5 text-teal-400" /><span className="font-semibold text-white">Your UK Journey</span></div>
                {[
                  { title: 'Get your NI Number', status: 'Complete', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
                  { title: 'Open a UK Bank Account', status: 'Complete', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
                  { title: 'Register with a GP', status: 'In Progress', color: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
                  { title: 'File Self Assessment', status: 'Upcoming', color: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
                  { title: 'AAT Level 2 — Bookkeeping', status: '78% Score', color: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:border-teal-400/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-400/10 flex items-center justify-center"><Check className="h-4 w-4 text-teal-400" /></div>
                      <span className="text-sm font-medium text-white">{item.title}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${item.color}`}>{item.status}</div>
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
