'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import {
  FileSpreadsheet, FileText, Receipt, BarChart3, KeyRound, Camera,
  TrendingUp, Home, Check, ChevronDown, ChevronUp, ArrowRight, Banknote,
  PoundSterling, Shield, Zap, Users, CalendarClock, Briefcase,
  Building2, Eye, UserPlus, Menu, X, Link2, Tag, FolderOpen, Landmark,
  ArrowLeftRight, MessageSquare, GraduationCap, Sparkles, Lock, Brain,
  Github, Twitter, Linkedin, Send, Wifi, Building, Globe, ShoppingBag,
  HeartPulse, Smartphone, BookOpen, Plane, Fingerprint, CreditCard,
  BadgeCheck, ScanLine, FileCheck, UserCheck, ShieldCheck, Scale,
  AlertTriangle, Clock, Scan, CircleCheck, ChevronRight, Calculator,
  LineChart, PiggyBank, Target, Anchor, DollarSign,
} from 'lucide-react';

const FEATURE_CATEGORIES = [
  { key: 'all', tKey: 'landing.features.allFeatures', icon: Sparkles },
  { key: 'finance', tKey: 'landing.features.coreFinance', icon: PoundSterling },
  { key: 'ai', tKey: 'landing.features.aiAutomation', icon: Brain },
  { key: 'compliance', tKey: 'landing.features.complianceGov', icon: Shield },
  { key: 'learning', tKey: 'landing.features.learningServices', icon: GraduationCap },
  { key: 'property', tKey: 'landing.features.propertyMortgage', icon: Home },
  { key: 'tools', tKey: 'landing.features.toolsIntegrations', icon: Zap },
];

const ALL_FEATURES_DEFS = [
  { icon: FileSpreadsheet, tTitle: 'landing.featureCards.bankStatements', tDesc: 'landing.featureCards.bankStatementsDesc', color: 'from-amber-500/20 to-orange-500/10', ic: 'text-amber-400', cat: 'finance' },
  { icon: FileText, tTitle: 'landing.featureCards.invoices', tDesc: 'landing.featureCards.invoicesDesc', color: 'from-blue-500/20 to-cyan-500/10', ic: 'text-blue-400', cat: 'finance' },
  { icon: Receipt, tTitle: 'landing.featureCards.billsSubscriptions', tDesc: 'landing.featureCards.billsSubscriptionsDesc', color: 'from-emerald-500/20 to-teal-500/10', ic: 'text-emerald-400', cat: 'finance' },
  { icon: BarChart3, tTitle: 'landing.featureCards.hmrcTaxReports', tDesc: 'landing.featureCards.hmrcTaxReportsDesc', color: 'from-purple-500/20 to-violet-500/10', ic: 'text-purple-400', cat: 'finance' },
  { icon: TrendingUp, tTitle: 'landing.featureCards.financialProjections', tDesc: 'landing.featureCards.financialProjectionsDesc', color: 'from-cyan-500/20 to-sky-500/10', ic: 'text-cyan-400', cat: 'finance' },
  { icon: ArrowLeftRight, tTitle: 'landing.featureCards.transfers', tDesc: 'landing.featureCards.transfersDesc', color: 'from-fuchsia-500/20 to-pink-500/10', ic: 'text-fuchsia-400', cat: 'finance' },
  { icon: HeartPulse, tTitle: 'landing.featureCards.healthScore', tDesc: 'landing.featureCards.healthScoreDesc', color: 'from-red-500/20 to-pink-500/10', ic: 'text-red-400', cat: 'finance' },
  { icon: Brain, tTitle: 'landing.featureCards.aiCategorisation', tDesc: 'landing.featureCards.aiCategorisationDesc', color: 'from-purple-500/20 to-fuchsia-500/10', ic: 'text-purple-400', cat: 'ai' },
  { icon: MessageSquare, tTitle: 'landing.featureCards.aiAssistant', tDesc: 'landing.featureCards.aiAssistantDesc', color: 'from-sky-500/20 to-blue-500/10', ic: 'text-sky-400', cat: 'ai' },
  { icon: Tag, tTitle: 'landing.featureCards.smartCategories', tDesc: 'landing.featureCards.smartCategoriesDesc', color: 'from-orange-500/20 to-amber-500/10', ic: 'text-orange-400', cat: 'ai' },
  { icon: Camera, tTitle: 'landing.featureCards.captureClassify', tDesc: 'landing.featureCards.captureClassifyDesc', color: 'from-indigo-500/20 to-blue-500/10', ic: 'text-indigo-400', cat: 'ai' },
  { icon: Shield, tTitle: 'landing.featureCards.idVerification', tDesc: 'landing.featureCards.idVerificationDesc', color: 'from-green-500/20 to-emerald-500/10', ic: 'text-green-400', cat: 'compliance' },
  { icon: Link2, tTitle: 'landing.featureCards.govApis', tDesc: 'landing.featureCards.govApisDesc', color: 'from-teal-500/20 to-emerald-500/10', ic: 'text-teal-400', cat: 'compliance' },
  { icon: Building, tTitle: 'landing.featureCards.companiesHouse', tDesc: 'landing.featureCards.companiesHouseDesc', color: 'from-slate-500/20 to-zinc-500/10', ic: 'text-slate-400', cat: 'compliance' },
  { icon: CalendarClock, tTitle: 'landing.featureCards.taxTimeline', tDesc: 'landing.featureCards.taxTimelineDesc', color: 'from-amber-500/20 to-yellow-500/10', ic: 'text-amber-400', cat: 'compliance' },
  { icon: KeyRound, tTitle: 'landing.featureCards.secureVault', tDesc: 'landing.featureCards.secureVaultDesc', color: 'from-rose-500/20 to-pink-500/10', ic: 'text-rose-400', cat: 'compliance' },
  { icon: GraduationCap, tTitle: 'landing.featureCards.accountingAcademy', tDesc: 'landing.featureCards.accountingAcademyDesc', color: 'from-indigo-500/20 to-violet-500/10', ic: 'text-indigo-400', cat: 'learning' },
  { icon: Globe, tTitle: 'landing.featureCards.relocationHub', tDesc: 'landing.featureCards.relocationHubDesc', color: 'from-teal-500/20 to-cyan-500/10', ic: 'text-teal-400', cat: 'learning' },
  { icon: ShoppingBag, tTitle: 'landing.featureCards.marketplace', tDesc: 'landing.featureCards.marketplaceDesc', color: 'from-rose-500/20 to-orange-500/10', ic: 'text-rose-400', cat: 'learning' },
  { icon: GraduationCap, tTitle: 'landing.featureCards.financialLearning', tDesc: 'landing.featureCards.financialLearningDesc', color: 'from-yellow-500/20 to-amber-500/10', ic: 'text-yellow-400', cat: 'learning' },
  { icon: Wifi, tTitle: 'landing.featureCards.openBanking', tDesc: 'landing.featureCards.openBankingDesc', color: 'from-blue-500/20 to-indigo-500/10', ic: 'text-blue-400', cat: 'tools' },
  { icon: Landmark, tTitle: 'landing.featureCards.multiEntity', tDesc: 'landing.featureCards.multiEntityDesc', color: 'from-violet-500/20 to-purple-500/10', ic: 'text-violet-400', cat: 'tools' },
  { icon: FolderOpen, tTitle: 'landing.featureCards.documentStorage', tDesc: 'landing.featureCards.documentStorageDesc', color: 'from-lime-500/20 to-emerald-500/10', ic: 'text-lime-400', cat: 'tools' },
  { icon: Home, tTitle: 'landing.featureCards.ukLifeEvents', tDesc: 'landing.featureCards.ukLifeEventsDesc', color: 'from-pink-500/20 to-rose-500/10', ic: 'text-pink-400', cat: 'tools' },
  { icon: Smartphone, tTitle: 'landing.featureCards.pwa', tDesc: 'landing.featureCards.pwaDesc', color: 'from-sky-500/20 to-blue-500/10', ic: 'text-sky-400', cat: 'tools' },
  { icon: Link2, tTitle: 'landing.featureCards.accountantPortal', tDesc: 'landing.featureCards.accountantPortalDesc', color: 'from-emerald-500/20 to-green-500/10', ic: 'text-emerald-400', cat: 'tools' },
  { icon: Home, tTitle: 'landing.featureCards.propertyIntelligence', tDesc: 'landing.featureCards.propertyIntelligenceDesc', color: 'from-orange-500/20 to-red-500/10', ic: 'text-orange-400', cat: 'property' },
  { icon: Calculator, tTitle: 'landing.featureCards.sdltCalculator', tDesc: 'landing.featureCards.sdltCalculatorDesc', color: 'from-rose-500/20 to-pink-500/10', ic: 'text-rose-400', cat: 'property' },
  { icon: Banknote, tTitle: 'landing.featureCards.mortgageSimulator', tDesc: 'landing.featureCards.mortgageSimulatorDesc', color: 'from-amber-500/20 to-orange-500/10', ic: 'text-amber-400', cat: 'property' },
  { icon: Brain, tTitle: 'landing.featureCards.purchasePlanner', tDesc: 'landing.featureCards.purchasePlannerDesc', color: 'from-violet-500/20 to-purple-500/10', ic: 'text-violet-400', cat: 'property' },
  { icon: LineChart, tTitle: 'landing.featureCards.investmentProjections', tDesc: 'landing.featureCards.investmentProjectionsDesc', color: 'from-emerald-500/20 to-teal-500/10', ic: 'text-emerald-400', cat: 'property' },
  { icon: Target, tTitle: 'landing.featureCards.savingsPlan', tDesc: 'landing.featureCards.savingsPlanDesc', color: 'from-cyan-500/20 to-blue-500/10', ic: 'text-cyan-400', cat: 'property' },
  { icon: PiggyBank, tTitle: 'landing.featureCards.mortgageAffordability', tDesc: 'landing.featureCards.mortgageAffordabilityDesc', color: 'from-green-500/20 to-emerald-500/10', ic: 'text-green-400', cat: 'property' },
  { icon: Shield, tTitle: 'landing.featureCards.creditScoreHub', tDesc: 'landing.featureCards.creditScoreHubDesc', color: 'from-blue-500/20 to-indigo-500/10', ic: 'text-blue-400', cat: 'property' },
];

// FALLBACK_PLANS is now built dynamically inside the component using t() for translations

interface CmsSection { sectionKey: string; title?: string; subtitle?: string; content?: any; }

export function LandingPage() {
  const { status } = useSession();
  const { t, locale, setLocale } = useTranslation();
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [cms, setCms] = useState<CmsSection[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [featureTab, setFeatureTab] = useState('all');
  const [navDropdown, setNavDropdown] = useState(false);

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(d => { if (Array.isArray(d)) setDbPlans(d); }).catch(() => {});
    fetch('/api/cms').then(r => r.json()).then(d => { if (Array.isArray(d)) setCms(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    const el = document.getElementById('landing-map-preview');
    if (!el || (window as any).__landingMapInit) return;
    (window as any).__landingMapInit = true;
    const loadMap = () => {
      const L = (window as any).L; if (!L || !el) return;
      const map = L.map(el, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, keyboard: false, boxZoom: false }).setView([20, 15], 2);
      L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    };
    if ((window as any).L) { loadMap(); return; }
    if (!document.querySelector('link[href*="leaflet"]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = loadMap;
    document.head.appendChild(script);
  }, [status]);

  const getCms = (key: string) => cms.find(s => s.sectionKey === key);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-14 w-14 rounded-2xl shadow-lg shadow-amber-500/30 animate-pulse overflow-hidden">
          <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
        </div>
      </div>
    );
  }

  const NAV_PRIMARY = [
    { href: '#features', label: t('landing.nav.features') },
    { href: '#how-it-works', label: t('landing.nav.howItWorks') },
    { href: '#pricing', label: t('landing.nav.pricing') },
    { href: '/intelligence', label: '🌐 Intelligence' },
    { href: '#faq', label: t('landing.nav.faq') },
  ];
  const NAV_MORE = [
    { href: '#business', label: t('landing.nav.forBusiness') },
    { href: '#accountants', label: t('landing.nav.forAccountants') },
    { href: '#verify-id', label: t('landing.nav.verifyId') },
    { href: '#property', label: t('landing.nav.property') },
    { href: '#new-arrivals', label: t('landing.nav.newToUk') },
  ];
  const NAV = [...NAV_PRIMARY, ...NAV_MORE];

  const FALLBACK_PLANS = [
    { name: t('landing.pricing.starterName'), price: '£7.90', period: t('landing.pricing.perMonth'), features: [t('landing.pricing.starterF1'), t('landing.pricing.starterF2'), t('landing.pricing.starterF3'), t('landing.pricing.starterF4'), t('landing.pricing.starterF5')], cta: t('landing.pricing.startFreeTrial'), highlighted: false },
    { name: t('landing.pricing.proName'), price: '£14.90', period: t('landing.pricing.perMonth'), features: [t('landing.pricing.proF1'), t('landing.pricing.proF2'), t('landing.pricing.proF3'), t('landing.pricing.proF4'), t('landing.pricing.proF5')], cta: t('landing.pricing.startFreeTrial'), highlighted: true },
    { name: t('landing.pricing.businessName'), price: '£29.90', period: t('landing.pricing.perMonth'), features: [t('landing.pricing.businessF1'), t('landing.pricing.businessF2'), t('landing.pricing.businessF3'), t('landing.pricing.businessF4'), t('landing.pricing.businessF5')], cta: t('landing.pricing.startFreeTrial'), highlighted: false },
    { name: t('landing.pricing.managedName'), price: '£99.90', period: t('landing.pricing.perMonth'), features: [t('landing.pricing.managedF1'), t('landing.pricing.managedF2'), t('landing.pricing.managedF3'), t('landing.pricing.managedF4'), t('landing.pricing.managedF5')], cta: t('landing.pricing.startFreeTrial'), highlighted: false },
  ];

  const plans = dbPlans.length > 0
    ? dbPlans.map((p: any) => ({
        key: p.id, name: p.displayName,
        price: p.price === 0 ? '£0' : `£${p.price}`,
        period: p.price === 0 ? '' : t('landing.pricing.perMonth'),
        features: p.features || [], highlighted: p.isDefault,
        cta: t('landing.pricing.startFreeTrial'),
      }))
    : FALLBACK_PLANS.map((p, i) => ({ key: i, ...p }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md shadow-amber-500/20">
              <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-bold text-white">HomeLedger</span>
          </Link>
          <div className="hidden xl:flex items-center gap-4 text-[13px] font-medium text-slate-400">
            {NAV_PRIMARY.map(l => <a key={l.href} href={l.href} className="hover:text-amber-400 transition-colors duration-200 whitespace-nowrap">{l.label}</a>)}
            <div className="relative">
              <button onClick={() => setNavDropdown(!navDropdown)} className="flex items-center gap-1 hover:text-amber-400 transition-colors duration-200">
                More <ChevronDown className={`h-3.5 w-3.5 transition-transform ${navDropdown ? 'rotate-180' : ''}`} />
              </button>
              {navDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-xl py-2 z-50" onMouseLeave={() => setNavDropdown(false)}>
                  {NAV_MORE.map(l => <a key={l.href} href={l.href} onClick={() => setNavDropdown(false)} className="block px-4 py-2 text-sm text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors">{l.label}</a>)}
                </div>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'en' ? 'pt-BR' : 'en')}
              title={locale === 'en' ? 'Português (BR)' : 'English (UK)'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
            >
              <span className="text-base leading-none">{locale === 'en' ? '🇧🇷' : '🇬🇧'}</span>
              <span className="hidden lg:inline">{locale === 'en' ? 'PT' : 'EN'}</span>
            </button>
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              {t('landing.nav.signIn')}
            </Link>
            <Link href="/register" className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-sm font-semibold hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all duration-200">{t('landing.nav.getStartedFree')}</Link>
          </div>
          <button className="xl:hidden p-2 text-slate-400" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="xl:hidden border-t border-white/5 bg-slate-900/95 backdrop-blur-xl px-4 pb-4 space-y-2">
            {NAV.map(l => <a key={l.href} href={l.href} onClick={() => setMobileNav(false)} className="block py-2 text-sm font-medium text-slate-400 hover:text-amber-400">{l.label}</a>)}
            <button
              onClick={() => { setLocale(locale === 'en' ? 'pt-BR' : 'en'); }}
              className="flex items-center gap-2 py-2 text-sm font-medium text-slate-400 hover:text-amber-400"
            >
              <span className="text-base leading-none">{locale === 'en' ? '🇧🇷' : '🇬🇧'}</span>
              {locale === 'en' ? 'Português (BR)' : 'English (UK)'}
            </button>
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileNav(false)} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 text-sm font-medium text-slate-300">
                {t('landing.nav.signIn')}
              </Link>
              <Link href="/register" onClick={() => setMobileNav(false)} className="block text-center py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-sm font-semibold">{t('landing.nav.getStartedFree')}</Link>
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
              <Sparkles className="h-3.5 w-3.5" /> {t('landing.hero.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              {getCms('hero')?.content?.headline || (
                <>
                  <span className="text-white">{t('landing.hero.titleLine1')}</span><br />
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent neon-text-amber">
                    {t('landing.hero.titleLine2')}
                  </span>
                </>
              )}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {getCms('hero')?.content?.subheadline || t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-base hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02]">
                {t('landing.hero.ctaPrimary')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass text-slate-300 font-semibold text-base hover:text-white hover:bg-white/10 transition-all duration-200">
                {t('landing.hero.ctaSecondary')}
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-500">{t('landing.hero.noCreditCard')}</p>
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
                    { label: t('landing.mock.totalIncome'), value: '£42,850', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-500/5' },
                    { label: t('landing.mock.totalExpenses'), value: '£28,340', color: 'text-rose-400', bg: 'from-rose-500/10 to-rose-500/5' },
                    { label: t('landing.mock.transactions'), value: '1,247', color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-500/5' },
                    { label: t('landing.mock.taxSaved'), value: '£8,120', color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-500/5' },
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
            { n: '30+', l: t('landing.stats.modules'), Icon: Zap },
            { n: 'AI', l: t('landing.stats.aiPowered'), Icon: Sparkles },
            { n: 'HMRC', l: t('landing.stats.hmrc'), Icon: BarChart3 },
            { n: '256-bit', l: t('landing.stats.encryption'), Icon: Lock },
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
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{getCms('features')?.title || t('landing.features.title')}</h2>
            <p className="mt-4 text-lg text-slate-400">{getCms('features')?.subtitle || t('landing.features.subtitle')}</p>
          </div>

          {/* Category Tabs — scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-12 scrollbar-hide">
            <div className="flex sm:flex-wrap sm:justify-center gap-2 min-w-max sm:min-w-0">
              {FEATURE_CATEGORIES.map((c) => {
                const count = c.key === 'all' ? ALL_FEATURES_DEFS.length : ALL_FEATURES_DEFS.filter(f => f.cat === c.key).length;
                const active = featureTab === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setFeatureTab(c.key)}
                    className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'bg-gradient-to-r from-amber-400/20 to-amber-500/10 border border-amber-400/30 text-amber-300 shadow-lg shadow-amber-500/10'
                        : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <c.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${active ? 'text-amber-400' : ''}`} />
                    <span>{t(c.tKey)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${active ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature Cards Grid — compact with expand on hover/click */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {ALL_FEATURES_DEFS.filter(f => featureTab === 'all' || f.cat === featureTab).map((f) => (
              <div
                key={f.tTitle}
                className="group neon-card p-4 cursor-pointer transition-all duration-300 hover:ring-1 hover:ring-amber-400/20 hover:shadow-lg hover:shadow-amber-500/5"
                onClick={(e) => {
                  const el = e.currentTarget;
                  el.classList.toggle('expanded');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <f.icon className={`h-5 w-5 ${f.ic}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-tight">{t(f.tTitle)}</h3>
                </div>
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 [.expanded>&]:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-400 leading-relaxed mt-3 pt-3 border-t border-white/5">{t(f.tDesc)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature count summary */}
          <div className="text-center mt-10">
            <p className="text-sm text-slate-500">
              {t('landing.features.showing')} {featureTab === 'all' ? ALL_FEATURES_DEFS.length : ALL_FEATURES_DEFS.filter(f => f.cat === featureTab).length} {t('landing.features.of')} {ALL_FEATURES_DEFS.length} {t('landing.features.modules')}
              {featureTab !== 'all' && (
                <button onClick={() => setFeatureTab('all')} className="ml-2 text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">
                  {t('landing.features.showAll')}
                </button>
              )}
            </p>
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
                <Building2 className="h-3.5 w-3.5" /> {t('landing.business.badge')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{t('landing.business.title')}</h2>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                {t('landing.business.description')}
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Landmark, text: t('landing.business.feature1') },
                  { icon: BarChart3, text: t('landing.business.feature2') },
                  { icon: Link2, text: t('landing.business.feature3') },
                  { icon: CalendarClock, text: t('landing.business.feature4') },
                  { icon: FileText, text: t('landing.business.feature5') },
                  { icon: Tag, text: t('landing.business.feature6') },
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
                <div className="flex items-center gap-3 mb-2"><Landmark className="h-5 w-5 text-cyan-400" /><span className="font-semibold text-white">{t('landing.business.mockTitle')}</span></div>
                {[{ name: 'Tech Solutions Ltd', type: 'Limited Company', co: '#12345678' }, { name: 'Sarah Consulting', type: 'Sole Trader', co: 'UTR: 12345' }, { name: 'Personal Account', type: 'Personal', co: '' }].map((e, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:border-cyan-400/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-cyan-400/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-cyan-400" /></div>
                      <div><div className="text-sm font-medium text-white">{e.name}</div><div className="text-xs text-slate-500">{e.type}{e.co && ` · ${e.co}`}</div></div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">{t('landing.mock.active')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Property Intelligence ─────────────────────────────────────── */}
      <section id="property" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-950/30 via-slate-950 to-rose-950/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-400 text-xs font-semibold mb-6">
                <Home className="h-3.5 w-3.5" /> {getCms('propertyIntelligence')?.subtitle || t('landing.property.badge')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {getCms('propertyIntelligence')?.title || t('landing.property.title')}
              </h2>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                {getCms('propertyIntelligence')?.content?.description || t('landing.property.description')}
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Home, text: t('landing.property.feature1') },
                  { icon: Calculator, text: t('landing.property.feature2') },
                  { icon: Banknote, text: t('landing.property.feature3') },
                  { icon: Brain, text: t('landing.property.feature4') },
                  { icon: LineChart, text: t('landing.property.feature5') },
                  { icon: Building2, text: t('landing.property.feature6') },
                  { icon: Target, text: t('landing.property.feature7') },
                  { icon: Shield, text: t('landing.property.feature8') },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-orange-400/10 border border-orange-400/10 flex items-center justify-center flex-shrink-0 group-hover:border-orange-400/30 transition-colors">
                      <item.icon className="h-4 w-4 text-orange-400" />
                    </div>
                    <span className="text-slate-400 text-sm leading-relaxed pt-1 group-hover:text-slate-300 transition-colors">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-rose-500 text-white font-semibold text-sm hover:from-orange-300 hover:to-rose-400 shadow-lg shadow-orange-500/20">
                  {t('landing.property.ctaPrimary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10">{t('landing.property.ctaSecondary')}</a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="neon-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2"><Brain className="h-5 w-5 text-orange-400" /><span className="font-semibold text-white">{t('landing.property.mockTitle')}</span></div>
                {/* Readiness Score Mock */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400">{t('landing.property.readinessScore')}</span>
                    <span className="text-lg font-bold text-emerald-400">72/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-emerald-400 to-green-500" /></div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">{t('landing.property.nearlyReady')}</span>
                </div>
                {/* Key Metrics Mock */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t('landing.property.depositTarget'), val: '£30,000', color: 'text-orange-400' },
                    { label: t('landing.property.currentSavings'), val: '£18,500', color: 'text-emerald-400' },
                    { label: t('landing.property.monthlyCapacity'), val: '£850/mo', color: 'text-cyan-400' },
                    { label: t('landing.property.etaDeposit'), val: 'Mar 2027', color: 'text-amber-400' },
                  ].map((m, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                      <p className="text-[10px] text-slate-500">{m.label}</p>
                      <p className={`text-sm font-bold ${m.color}`}>{m.val}</p>
                    </div>
                  ))}
                </div>
                {/* Investment Projection Mock */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <span className="text-xs text-slate-400">{t('landing.property.investmentGrowth')}</span>
                  <div className="flex items-end gap-1 mt-2 h-12">
                    {[20, 28, 35, 40, 48, 55, 60, 65, 72, 78, 85, 92].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-orange-400/60 to-amber-400/40" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                    <span>{t('landing.property.today')}: £12,000</span>
                    <span className="text-emerald-400 font-medium">{t('landing.property.projected')}: £19,400</span>
                  </div>
                </div>
                {/* Entity Strategy Mock */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-400/20 flex items-center justify-center"><Building2 className="h-4 w-4 text-violet-400" /></div>
                  <div>
                    <p className="text-xs text-white font-medium">Tech Solutions Ltd</p>
                    <p className="text-[10px] text-slate-500">£22k retained — dividend extraction strategy available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Intelligence ─────────────────────────────────────────── */}
      <section id="intelligence" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#060d1a] to-slate-950" />
        {/* Animated glow orbs */}
        <div className="absolute top-10 left-[20%] w-64 h-64 bg-cyan-500/8 rounded-full blur-[100px] orb-float-slow" />
        <div className="absolute bottom-10 right-[15%] w-80 h-80 bg-red-500/6 rounded-full blur-[120px] orb-float-medium" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-semibold mb-6">
              <Globe className="h-3.5 w-3.5" />
              <span>Real-Time Global Intelligence</span>
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-400 text-[10px] font-bold tracking-wider">LIVE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              The World at Your{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Fingertips
              </span>
            </h2>
            <p className="mt-5 text-lg text-slate-400 leading-relaxed">
              Monitor global events, military movements, earthquakes, weather patterns, and breaking news — all on one
              interactive map with AI-powered analysis. Your personal war room.
            </p>
          </div>

          {/* Mock War Room Map */}
          <div className="max-w-5xl mx-auto mb-14">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/10 shadow-2xl shadow-cyan-500/5" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1520 50%, #0a0a1a 100%)' }}>
              {/* Fake top bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5" style={{ background: 'rgba(10,15,25,0.9)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white font-mono text-xs font-bold tracking-wider">GLOBAL INTELLIGENCE</span>
                  <span className="text-cyan-400 font-mono text-[10px]">LIVE</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                    <Clock className="w-3 h-3" />
                    <span className="tabular-nums">
                      {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {[
                    { label: 'TRACKING', val: '64', color: 'text-white' },
                    { label: 'CRISIS', val: '23', color: 'text-red-400' },
                    { label: 'OPPORTUNITY', val: '10', color: 'text-green-400' },
                  ].map(s => (
                    <div key={s.label} className="hidden sm:block text-center px-2">
                      <div className="text-[8px] text-slate-500 tracking-wider">{s.label}</div>
                      <div className={`text-xs font-bold font-mono ${s.color}`}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map area with animated dots */}
              <div className="relative h-[280px] sm:h-[360px] overflow-hidden" style={{ background: '#0d1520' }}>
                {/* Real Leaflet map rendered directly */}
                <div id="landing-map-preview" className="absolute inset-0 w-full h-full" style={{ filter: 'brightness(1.4) saturate(1.3)' }} />
                {/* Subtle vignette */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(10,10,26,0.6) 100%)' }} />

                {/* Animated blinking dots representing news/events */}
                {[
                  { top: '25%', left: '22%', color: '#ef4444', size: 8, label: 'Washington DC' },
                  { top: '30%', left: '47%', color: '#3b82f6', size: 6, label: 'London' },
                  { top: '28%', left: '50%', color: '#22d3ee', size: 5, label: 'Paris' },
                  { top: '40%', left: '55%', color: '#ef4444', size: 9, label: 'Middle East' },
                  { top: '32%', left: '60%', color: '#f59e0b', size: 7, label: 'Moscow' },
                  { top: '35%', left: '72%', color: '#ef4444', size: 8, label: 'Beijing' },
                  { top: '45%', left: '75%', color: '#22c55e', size: 5, label: 'Tokyo' },
                  { top: '55%', left: '25%', color: '#3b82f6', size: 6, label: 'São Paulo' },
                  { top: '50%', left: '53%', color: '#f59e0b', size: 5, label: 'Cairo' },
                  { top: '65%', left: '55%', color: '#22c55e', size: 4, label: 'Nairobi' },
                  { top: '70%', left: '80%', color: '#3b82f6', size: 5, label: 'Sydney' },
                  { top: '38%', left: '40%', color: '#ef4444', size: 6, label: 'Ukraine' },
                  { top: '42%', left: '48%', color: '#f59e0b', size: 7, label: 'Gaza' },
                  { top: '33%', left: '80%', color: '#22d3ee', size: 5, label: 'Seoul' },
                ].map((dot, i) => (
                  <div key={i} className="absolute" style={{ top: dot.top, left: dot.left }}>
                    <div className="relative">
                      <div
                        className="rounded-full animate-ping absolute inset-0"
                        style={{ width: dot.size * 2.5, height: dot.size * 2.5, background: dot.color, opacity: 0.2, animationDuration: `${2 + i * 0.3}s` }}
                      />
                      <div
                        className="rounded-full relative"
                        style={{ width: dot.size, height: dot.size, background: dot.color, boxShadow: `0 0 ${dot.size * 2}px ${dot.color}` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Scan line */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" style={{ animation: 'scan-line 4s linear infinite' }} />
                </div>

                {/* Continent labels */}
                {[
                  { label: 'NORTH AMERICA', top: '20%', left: '15%' },
                  { label: 'EUROPE', top: '22%', left: '45%' },
                  { label: 'ASIA', top: '25%', left: '68%' },
                  { label: 'AFRICA', top: '50%', left: '48%' },
                  { label: 'S. AMERICA', top: '55%', left: '28%' },
                  { label: 'OCEANIA', top: '65%', left: '78%' },
                ].map((c, i) => (
                  <div key={i} className="absolute text-[9px] font-mono text-slate-600/40 tracking-[0.2em] select-none" style={{ top: c.top, left: c.left }}>
                    {c.label}
                  </div>
                ))}

                {/* Legend */}
                <div className="absolute bottom-3 left-3 flex gap-3 text-[9px] font-mono text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Crisis</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Opportunity</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Neutral</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />Military</span>
                </div>

                {/* Mini news ticker */}
                <div className="absolute bottom-3 right-3 max-w-[240px] rounded-lg p-2 border border-cyan-500/10" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
                  <div className="text-[9px] text-cyan-400 font-mono mb-1">LATEST INTEL</div>
                  <div className="space-y-1">
                    {[
                      'US military operations in Middle East...',
                      'M5.2 earthquake detected near Japan...',
                      'NATO forces deployment to Eastern Europe...',
                    ].map((t, i) => (
                      <div key={i} className="text-[9px] text-slate-400 font-mono truncate flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
            {[
              { icon: Globe, title: 'Live Global News', desc: '50+ countries, 11 war searches, auto-refresh every 60s', color: 'from-cyan-500/20 to-blue-500/10', ic: 'text-cyan-400' },
              { icon: Plane, title: 'Aircraft Tracking', desc: 'Real-time military & civilian aircraft via OpenSky Network', color: 'from-yellow-500/20 to-amber-500/10', ic: 'text-yellow-400' },
              { icon: AlertTriangle, title: 'Earthquake Monitor', desc: 'USGS seismic data with magnitude, depth & tsunami alerts', color: 'from-orange-500/20 to-red-500/10', ic: 'text-orange-400' },
              { icon: Anchor, title: 'Naval Tracker', desc: 'Aircraft carriers, warships & strategic waterway monitoring worldwide', color: 'from-blue-500/20 to-indigo-500/10', ic: 'text-blue-400' },
              { icon: Brain, title: 'AI Intelligence Agent', desc: 'Geopolitical analyst AI for news analysis & strategy', color: 'from-purple-500/20 to-violet-500/10', ic: 'text-purple-400' },
              { icon: Shield, title: 'Prophecy Tracking', desc: 'Biblical prophecy cross-reference with current events', color: 'from-amber-500/20 to-orange-500/10', ic: 'text-amber-400' },
              { icon: BarChart3, title: 'Economic Calendar', desc: 'Central bank decisions, GDP, CPI, employment data from 20+ countries', color: 'from-emerald-500/20 to-teal-500/10', ic: 'text-emerald-400' },
              { icon: DollarSign, title: 'World Economy', desc: 'GDP rankings, population stats, region data from World Bank', color: 'from-green-500/20 to-emerald-500/10', ic: 'text-green-400' },
            ].map((f, i) => (
              <div key={i} className={`bg-gradient-to-br ${f.color} rounded-xl p-4 border border-white/5 hover:border-cyan-400/20 transition-colors group`}>
                <div className="flex items-center gap-2 mb-2">
                  <f.icon className={`h-4 w-4 ${f.ic} group-hover:scale-110 transition-transform`} />
                  <span className="text-sm font-semibold text-white">{f.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/intelligence"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 hover:scale-[1.02]"
            >
              <Globe className="h-5 w-5" />
              Open Intelligence Dashboard
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-4 text-sm text-slate-500">Free access · Real-time data · No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{getCms('howItWorks')?.title || t('landing.howItWorks.title')}</h2>
            <p className="mt-4 text-lg text-slate-400">{getCms('howItWorks')?.subtitle || t('landing.howItWorks.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: t('landing.howItWorks.step1Title'), desc: t('landing.howItWorks.step1Desc') },
              { step: '2', title: t('landing.howItWorks.step2Title'), desc: t('landing.howItWorks.step2Desc') },
              { step: '3', title: t('landing.howItWorks.step3Title'), desc: t('landing.howItWorks.step3Desc') },
            ].map((s, i) => (
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.testimonials.title')}</h2>
            <p className="mt-4 text-lg text-slate-400">{t('landing.testimonials.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'James Mitchell', role: 'Sole Trader, London', text: t('landing.testimonials.quote1'), avatar: 'JM' },
              { name: 'Sarah Chen', role: 'Director, Tech Solutions Ltd', text: t('landing.testimonials.quote2'), avatar: 'SC' },
              { name: 'David Okafor', role: 'Chartered Accountant', text: t('landing.testimonials.quote3'), avatar: 'DO' },
            ].map((tm, i) => (
              <div key={i} className="neon-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400/20 to-cyan-400/10 border border-amber-400/15 flex items-center justify-center text-sm font-bold text-amber-400">
                    {tm.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{tm.name}</div>
                    <div className="text-xs text-slate-500">{tm.role}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed italic">&ldquo;{tm.text}&rdquo;</p>
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
                <Briefcase className="h-3.5 w-3.5" /> {t('landing.accountants.badge')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{t('landing.accountants.title')}</h2>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                {t('landing.accountants.description')}
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: UserPlus, text: t('landing.accountants.feature1') },
                  { icon: Eye, text: t('landing.accountants.feature2') },
                  { icon: BarChart3, text: t('landing.accountants.feature3') },
                  { icon: Shield, text: t('landing.accountants.feature4') },
                  { icon: Building2, text: t('landing.accountants.feature5') },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-amber-400/10 border border-amber-400/10 flex items-center justify-center flex-shrink-0 group-hover:border-amber-400/30 transition-colors"><item.icon className="h-4 w-4 text-amber-400" /></div>
                    <span className="text-slate-400 text-sm leading-relaxed pt-1 group-hover:text-slate-300 transition-colors">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold text-sm hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20">
                  {t('landing.accountants.ctaPrimary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10">{t('landing.pricing.title')}</a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="neon-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4"><Briefcase className="h-6 w-6 text-amber-400" /><span className="text-white font-semibold">{t('landing.mock.accountantDashboard')}</span></div>
                {['John Smith — Sole Trader', 'ABC Ltd — Limited Company', 'Sarah Jones — Freelancer'].map((name, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:border-amber-400/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-amber-400/20 flex items-center justify-center"><Users className="h-4 w-4 text-amber-400" /></div>
                      <div>
                        <div className="text-white text-sm font-medium">{name}</div>
                        <div className="text-slate-500 text-xs">{i === 0 ? t('landing.mock.entitiesViewedToday') : i === 1 ? t('landing.mock.entityTwoDaysAgo') : t('landing.mock.entitiesPending')}</div>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${i < 2 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'}`}>{i < 2 ? t('landing.mock.active') : t('landing.mock.pending')}</div>
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
                <Fingerprint className="h-3.5 w-3.5" /> {t('landing.idv.heroBadge')}
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
                {t('landing.idv.heroTitle1')}<br />{t('landing.idv.heroTitle2')}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{t('landing.idv.heroTitle3')}</span>
              </h2>
              <p className="mt-6 text-lg text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.idv.heroDesc1') }} />
              <p className="mt-4 text-base text-slate-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.idv.heroDesc2') }} />
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/verify-purchase" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 font-semibold text-sm hover:from-violet-300 hover:to-cyan-300 shadow-lg shadow-violet-500/20 transition-all">
                  {t('landing.idv.ctaStart')} <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#idv-law" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10 transition-all">
                  <Scale className="h-4 w-4" /> {t('landing.idv.ctaLegal')}
                </a>
              </div>
            </div>
            {/* Right — iPhone Pro Max Mockup */}
            <div className="flex justify-center relative">
              <div className="relative" style={{ width: 290 }}>
                {/* Outer titanium frame */}
                <div className="relative rounded-[3.2rem] bg-gradient-to-b from-[#8a8a8e] via-[#6e6e73] to-[#48484a] p-[2.5px] shadow-[0_0_80px_rgba(139,92,246,0.15),0_25px_60px_rgba(0,0,0,0.6)]">
                  {/* Side Buttons — Left */}
                  <div className="absolute -left-[3.5px] top-[100px] w-[3px] h-[28px] rounded-l-sm bg-gradient-to-b from-[#7a7a7e] to-[#5a5a5e]" />
                  <div className="absolute -left-[3.5px] top-[145px] w-[3px] h-[50px] rounded-l-sm bg-gradient-to-b from-[#7a7a7e] to-[#5a5a5e]" />
                  <div className="absolute -left-[3.5px] top-[205px] w-[3px] h-[50px] rounded-l-sm bg-gradient-to-b from-[#7a7a7e] to-[#5a5a5e]" />
                  {/* Side Button — Right (power) */}
                  <div className="absolute -right-[3.5px] top-[160px] w-[3px] h-[65px] rounded-r-sm bg-gradient-to-b from-[#7a7a7e] to-[#5a5a5e]" />

                  {/* Inner bezel */}
                  <div className="rounded-[3rem] bg-black p-[6px]">
                    {/* Screen */}
                    <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900" style={{ aspectRatio: '393/852' }}>

                      {/* Glass reflection overlay */}
                      <div className="absolute inset-0 z-30 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)' }} />

                      {/* Dynamic Island */}
                      <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-20">
                        <div className="w-[90px] h-[28px] bg-black rounded-full flex items-center justify-center gap-[6px]">
                          <div className="w-[8px] h-[8px] rounded-full bg-[#1a1a2e] ring-1 ring-[#2a2a3e]" />
                        </div>
                      </div>

                      {/* Status Bar */}
                      <div className="relative z-10 flex justify-between items-center px-7 pt-[14px] pb-0">
                        <span className="text-[11px] font-semibold text-white/80" style={{ fontFeatureSettings: '"tnum"' }}>14:32</span>
                        <div className="flex items-center gap-[5px]">
                          <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><rect x="0" y="3" width="3" height="8" rx="0.8" fill="white" fillOpacity="0.8"/><rect x="4.5" y="2" width="3" height="9" rx="0.8" fill="white" fillOpacity="0.8"/><rect x="9" y="0" width="3" height="11" rx="0.8" fill="white" fillOpacity="0.8"/><rect x="13.5" y="0" width="3" height="11" rx="0.8" fill="white" fillOpacity="0.3"/></svg>
                          <Wifi className="h-[11px] w-[11px] text-white/80" />
                          <div className="flex items-center">
                            <div className="w-[20px] h-[10px] rounded-[2.5px] border border-white/40 flex items-center p-[1.5px]">
                              <div className="h-full w-[75%] rounded-[1px] bg-emerald-400" />
                            </div>
                            <div className="w-[1.5px] h-[4px] rounded-r-sm bg-white/40 ml-[1px]" />
                          </div>
                        </div>
                      </div>

                      {/* App Content */}
                      <div className="relative z-10 px-4 pt-6">
                        {/* App Header */}
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Fingerprint className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="text-white text-[13px] font-semibold block leading-tight">{t('landing.idv.mockIdentityCheck')}</span>
                            <span className="text-[9px] text-emerald-400 font-medium">{t('landing.idv.mockCertified')}</span>
                          </div>
                        </div>

                        {/* Camera Viewfinder */}
                        <div className="relative rounded-2xl border border-violet-400/20 bg-violet-400/5 overflow-hidden" style={{ aspectRatio: '4/3' }}>
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            {/* Corner brackets */}
                            <div className="absolute top-3 left-3 w-6 h-6 border-t-[2.5px] border-l-[2.5px] border-violet-400 rounded-tl-lg" />
                            <div className="absolute top-3 right-3 w-6 h-6 border-t-[2.5px] border-r-[2.5px] border-violet-400 rounded-tr-lg" />
                            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-[2.5px] border-l-[2.5px] border-violet-400 rounded-bl-lg" />
                            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-[2.5px] border-r-[2.5px] border-violet-400 rounded-br-lg" />
                            {/* Scan icon + text */}
                            <div className="h-10 w-10 rounded-full bg-violet-400/10 flex items-center justify-center">
                              <Scan className="h-5 w-5 text-violet-400/70" />
                            </div>
                            <span className="text-violet-300 text-[10px] font-medium">{t('landing.idv.mockScanPrompt')}</span>
                            <span className="text-slate-500 text-[8px]">{t('landing.idv.mockScanHint')}</span>
                          </div>
                          {/* Animated scan line */}
                          <div className="absolute left-3 right-3 h-[1.5px] bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-60" style={{ top: '45%' }} />
                        </div>

                        <p className="text-center text-[8px] text-slate-500 mt-2">{t('landing.idv.mockAlignHint')}</p>

                        {/* Progress Steps */}
                        <div className="mt-3 space-y-[7px]">
                          {[
                            { text: t('landing.idv.mockStep1'), done: true },
                            { text: t('landing.idv.mockStep2'), done: false },
                            { text: t('landing.idv.mockStep3'), done: false },
                          ].map((s, i) => (
                            <div key={i} className={`flex items-center gap-2.5 px-3 py-[6px] rounded-xl ${s.done ? 'bg-violet-400/10 border border-violet-400/20' : 'bg-white/[0.03] border border-white/5'}`}>
                              <div className={`h-[18px] w-[18px] rounded-full flex items-center justify-center text-[8px] font-bold ${s.done ? 'bg-violet-400 text-white' : 'bg-white/10 text-slate-500'}`}>
                                {s.done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                              </div>
                              <span className={`text-[11px] font-medium ${s.done ? 'text-white' : 'text-slate-500'}`}>{s.text}</span>
                              {s.done && <Check className="h-3 w-3 text-emerald-400 ml-auto" />}
                            </div>
                          ))}
                        </div>

                        {/* Capture Button */}
                        <div className="mt-3 mb-5">
                          <div className="w-full py-[10px] rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 text-center text-white text-[12px] font-bold shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2">
                            <Camera className="h-3.5 w-3.5" /> {t('landing.idv.mockCapture')}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Home Indicator */}
                      <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-white/20 z-20" />
                    </div>
                  </div>
                </div>

                {/* Floating Badges — outside the phone */}
                <div className="absolute -top-4 -right-12 sm:-right-24 px-3 py-2 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-2 shadow-xl shadow-emerald-500/10 backdrop-blur-md">
                  <div className="h-6 w-6 rounded-full bg-emerald-400/20 flex items-center justify-center"><CircleCheck className="h-3.5 w-3.5" /></div> {t('landing.idv.floatingFaceMatch')}
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -right-10 sm:-right-24 px-3 py-2 rounded-2xl bg-violet-400/10 border border-violet-400/20 text-violet-400 text-[11px] font-semibold flex items-center gap-2 shadow-xl shadow-violet-500/10 backdrop-blur-md">
                  <div className="h-6 w-6 rounded-full bg-violet-400/20 flex items-center justify-center"><Shield className="h-3.5 w-3.5" /></div> {t('landing.idv.floatingGdpr')}
                </div>
                <div className="absolute -bottom-4 -left-10 sm:-left-20 px-3 py-2 rounded-2xl bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[11px] font-semibold flex items-center gap-2 shadow-xl shadow-blue-500/10 backdrop-blur-md">
                  <div className="h-6 w-6 rounded-full bg-blue-400/20 flex items-center justify-center"><Clock className="h-3.5 w-3.5" /></div> {t('landing.idv.floatingTime')}
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
              <Scale className="h-3.5 w-3.5" /> {t('landing.idv.lawBadge')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              {t('landing.idv.lawTitle1')}<br />
              <span className="text-red-400">{t('landing.idv.lawTitle2')}</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.idv.lawDesc') }} />
          </div>

          {/* Law Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Briefcase, title: t('landing.idv.law1Title'), law: t('landing.idv.law1Law'), desc: t('landing.idv.law1Desc'), penalty: t('landing.idv.law1Penalty'), iconBg: 'bg-violet-400/10 border-violet-400/20', iconColor: 'text-violet-400' },
              { icon: Home, title: t('landing.idv.law2Title'), law: t('landing.idv.law2Law'), desc: t('landing.idv.law2Desc'), penalty: t('landing.idv.law2Penalty'), iconBg: 'bg-amber-400/10 border-amber-400/20', iconColor: 'text-amber-400' },
              { icon: Building2, title: t('landing.idv.law3Title'), law: t('landing.idv.law3Law'), desc: t('landing.idv.law3Desc'), penalty: t('landing.idv.law3Penalty'), iconBg: 'bg-red-400/10 border-red-400/20', iconColor: 'text-red-400' },
              { icon: GraduationCap, title: t('landing.idv.law4Title'), law: t('landing.idv.law4Law'), desc: t('landing.idv.law4Desc'), penalty: t('landing.idv.law4Penalty'), iconBg: 'bg-blue-400/10 border-blue-400/20', iconColor: 'text-blue-400' },
              { icon: Globe, title: t('landing.idv.law5Title'), law: t('landing.idv.law5Law'), desc: t('landing.idv.law5Desc'), penalty: t('landing.idv.law5Penalty'), iconBg: 'bg-teal-400/10 border-teal-400/20', iconColor: 'text-teal-400' },
              { icon: ShieldCheck, title: t('landing.idv.law6Title'), law: t('landing.idv.law6Law'), desc: t('landing.idv.law6Desc'), penalty: t('landing.idv.law6Penalty'), iconBg: 'bg-emerald-400/10 border-emerald-400/20', iconColor: 'text-emerald-400' },
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
                  <span className="text-xs text-red-400 font-medium">{t('landing.idv.penaltyLabel')}: {law.penalty}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Urgency Banner */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-2xl bg-gradient-to-r from-red-500/10 via-violet-500/10 to-red-500/10 border border-red-400/20 p-8">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">{t('landing.idv.complianceTitle')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t('landing.idv.complianceDesc') }} />
              <Link href="/verify-purchase" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 font-semibold text-sm hover:from-violet-300 hover:to-cyan-300 shadow-lg shadow-violet-500/20 transition-all">
                {t('landing.idv.complianceCta')} <ArrowRight className="h-4 w-4" />
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.idv.whoTitle')}</h2>
            <p className="mt-4 text-lg text-slate-400">{t('landing.idv.whoSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Briefcase, title: t('landing.idv.who1Title'), desc: t('landing.idv.who1Desc'), people: t('landing.idv.who1People') },
              { icon: Home, title: t('landing.idv.who2Title'), desc: t('landing.idv.who2Desc'), people: t('landing.idv.who2People') },
              { icon: Building2, title: t('landing.idv.who3Title'), desc: t('landing.idv.who3Desc'), people: t('landing.idv.who3People') },
              { icon: Scale, title: t('landing.idv.who4Title'), desc: t('landing.idv.who4Desc'), people: t('landing.idv.who4People') },
              { icon: Globe, title: t('landing.idv.who5Title'), desc: t('landing.idv.who5Desc'), people: t('landing.idv.who5People') },
              { icon: Users, title: t('landing.idv.who6Title'), desc: t('landing.idv.who6Desc'), people: t('landing.idv.who6People') },
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.idv.processTitle')}</h2>
            <p className="mt-4 text-lg text-slate-400">{t('landing.idv.processSubtitle')}</p>
          </div>

          {/* Visual Process Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              {
                step: '01',
                title: t('landing.idv.process1Title'),
                desc: t('landing.idv.process1Desc'),
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
                title: t('landing.idv.process2Title'),
                desc: t('landing.idv.process2Desc'),
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
                title: t('landing.idv.process3Title'),
                desc: t('landing.idv.process3Desc'),
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
                title: t('landing.idv.process4Title'),
                desc: t('landing.idv.process4Desc'),
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.idv.pricingTitle')}</h2>
            <p className="mt-4 text-lg text-slate-400">{t('landing.idv.pricingSubtitle')} <strong className="text-white">{t('landing.idv.pricingNoAccount')}</strong></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {[
              { name: t('landing.idv.singleName'), price: t('landing.idv.singlePrice'), per: t('landing.idv.singlePer'), checks: t('landing.idv.singleChecks'), features: [t('landing.idv.singleF1'), t('landing.idv.singleF2'), t('landing.idv.singleF3'), t('landing.idv.singleF4'), t('landing.idv.singleF5'), t('landing.idv.singleF6')], highlighted: false },
              { name: t('landing.idv.businessPackName'), price: t('landing.idv.businessPackPrice'), per: t('landing.idv.businessPackPer'), checks: t('landing.idv.businessPackChecks'), features: [t('landing.idv.businessPackF1'), t('landing.idv.businessPackF2'), t('landing.idv.businessPackF3'), t('landing.idv.businessPackF4'), t('landing.idv.businessPackF5'), t('landing.idv.businessPackF6')], highlighted: true, badge: t('landing.idv.businessPackBadge') },
              { name: t('landing.idv.enterpriseName'), price: t('landing.idv.enterprisePrice'), per: t('landing.idv.enterprisePer'), checks: t('landing.idv.enterpriseChecks'), features: [t('landing.idv.enterpriseF1'), t('landing.idv.enterpriseF2'), t('landing.idv.enterpriseF3'), t('landing.idv.enterpriseF4'), t('landing.idv.enterpriseF5'), t('landing.idv.enterpriseF6')], highlighted: false },
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
                  {t('landing.idv.buyNow')}
                </Link>
              </div>
            ))}
          </div>

          {/* Trust Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 mb-8">
            {[
              { icon: Shield, text: t('landing.idv.govCertified') },
              { icon: Lock, text: t('landing.idv.ukGdpr') },
              { icon: Fingerprint, text: t('landing.idv.aiBiometric') },
              { icon: BadgeCheck, text: t('landing.idv.homeOffice') },
              { icon: Clock, text: t('landing.idv.results90s') },
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
              <span className="text-slate-300 text-sm font-medium">{t('landing.idv.noAccountSimple')}</span>
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
                <Plane className="h-3.5 w-3.5" /> {t('landing.newArrivals.badge')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{t('landing.newArrivals.title')}</h2>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                {t('landing.newArrivals.description')}
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Globe, text: t('landing.newArrivals.feat1') },
                  { icon: GraduationCap, text: t('landing.newArrivals.feat2') },
                  { icon: ShoppingBag, text: t('landing.newArrivals.feat3') },
                  { icon: HeartPulse, text: t('landing.newArrivals.feat4') },
                  { icon: Smartphone, text: t('landing.newArrivals.feat5') },
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
                  {t('landing.newArrivals.ctaPrimary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10">{t('landing.pricing.title')}</a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="neon-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2"><Plane className="h-5 w-5 text-teal-400" /><span className="font-semibold text-white">{t('landing.mock.yourUkJourney')}</span></div>
                {[
                  { title: t('landing.mock.getNiNumber'), status: t('landing.mock.complete'), color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
                  { title: t('landing.mock.openBankAccount'), status: t('landing.mock.complete'), color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
                  { title: t('landing.mock.registerGp'), status: t('landing.mock.inProgress'), color: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
                  { title: t('landing.mock.fileSelfAssessment'), status: t('landing.mock.upcoming'), color: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
                  { title: t('landing.mock.aatLevel2'), status: '78% Score', color: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20' },
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.pricing.title')}</h2>
            <p className="mt-4 text-lg text-slate-400">{t('landing.pricing.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((p: any) => (
              <div key={p.key} className={`relative neon-card p-8 transition-all ${p.highlighted ? 'pricing-glow neon-pulse scale-[1.03]' : ''}`}>
                {p.highlighted && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs font-bold rounded-full shadow-lg shadow-amber-500/20">{t('landing.pricing.popular')}</div>}
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
          <div className="text-center mb-16"><h2 className="text-3xl sm:text-4xl font-bold text-white">{getCms('faq')?.title || t('landing.faq.title')}</h2></div>
          <div className="space-y-3">
            {Array.from({ length: 12 }, (_, i) => ({
              q: t(`landing.faq.q${i + 1}`),
              a: t(`landing.faq.a${i + 1}`),
            })).map((item, i) => (
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{getCms('cta')?.content?.headline || t('landing.cta.title')}</h2>
          <p className="mt-4 text-lg text-slate-400">{getCms('cta')?.content?.subheadline || t('landing.cta.subtitle')}</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-base hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02]">
            {t('landing.cta.ctaPrimary')} <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-sm text-slate-500">{t('landing.cta.noCreditCard')}</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-slate-900/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg overflow-hidden shadow-md shadow-amber-500/20">
                  <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
                </div>
                <span className="text-lg font-bold text-white">HomeLedger</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{t('landing.footer.description')}</p>
              <div className="flex items-center gap-3 mt-4">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <a key={i} href="#" className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:border-amber-400/30 hover:bg-amber-400/5 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-slate-400 hover:text-amber-400" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('landing.footer.product')}</h4>
              <div className="space-y-2.5 text-sm text-slate-500">
                <a href="#features" className="block hover:text-amber-400 transition-colors">{t('landing.nav.features')}</a>
                <a href="#pricing" className="block hover:text-amber-400 transition-colors">{t('landing.nav.pricing')}</a>
                <a href="#faq" className="block hover:text-amber-400 transition-colors">{t('landing.nav.faq')}</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('landing.footer.solutions')}</h4>
              <div className="space-y-2.5 text-sm text-slate-500">
                <a href="#business" className="block hover:text-amber-400 transition-colors">{t('landing.footer.forBusiness')}</a>
                <a href="#accountants" className="block hover:text-amber-400 transition-colors">{t('landing.footer.forAccountants')}</a>
                <a href="#property" className="block hover:text-amber-400 transition-colors">{t('landing.footer.propertyIntelligence')}</a>
                <a href="#features" className="block hover:text-amber-400 transition-colors">{t('landing.footer.personalFinance')}</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('landing.footer.legal')}</h4>
              <div className="space-y-2.5 text-sm text-slate-500">
                <Link href="/privacy" className="block hover:text-slate-300 transition-colors">{t('landing.footer.privacyPolicy')}</Link>
                <Link href="/terms" className="block hover:text-slate-300 transition-colors">{t('landing.footer.termsOfService')}</Link>
                <Link href="/cookies" className="block hover:text-slate-300 transition-colors">{t('landing.footer.cookiePolicy')}</Link>
                <button onClick={() => { if (typeof window !== 'undefined' && (window as any).__hlOpenCookiePrefs) (window as any).__hlOpenCookiePrefs(); }} className="block text-left hover:text-amber-400 transition-colors">{t('landing.footer.manageCookies')}</button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('landing.footer.newsletter')}</h4>
              <p className="text-xs text-slate-500 mb-3">{t('landing.footer.newsletterDesc')}</p>
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
            <p className="text-sm text-slate-600">&copy; {new Date().getFullYear()} HomeLedger. {t('landing.footer.allRightsReserved')}</p>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/login" className="hover:text-amber-400 transition-colors">{t('landing.nav.signIn')}</Link>
              <Link href="/register" className="hover:text-amber-400 transition-colors">{t('landing.cta.ctaPrimary')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
