'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import {
  BookOpen, Calculator, FileText, Users, Building2, Briefcase,
  Shield, Globe, Cloud, CheckCircle2, ArrowRight, Phone, Mail,
  ChevronDown, ChevronUp, Menu, X, PoundSterling, BarChart3,
  ClipboardCheck, Scale, Lock, BadgeCheck, Landmark, GraduationCap,
  Send, Star, Zap, Eye, Target, TrendingUp, CalendarClock,
  Receipt, UserCheck, ShieldCheck, Laptop, FileCheck, Headphones,
  Clock, CreditCard, Package, ShoppingBag, Loader2,
} from 'lucide-react';

interface ServicePackage {
  id: string;
  title: string;
  shortDescription: string | null;
  description: string;
  priceGbp: number;
  originalPriceGbp: number | null;
  estimatedDays: number | null;
  deliverables: string[];
  category: string | null;
  iconEmoji: string | null;
  isFeatured: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  relocation: 'Relocation',
  company_formation: 'Company Formation',
  tax: 'Tax Services',
  visa: 'Visa Support',
};

// ─── Service Data ───
const SERVICE_CATEGORIES = [
  {
    id: 'tax',
    icon: Calculator,
    color: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-400/10 border-amber-400/20',
    iconColor: 'text-amber-400',
    services: [
      { icon: BookOpen, key: 'bookkeeping' },
      { icon: Receipt, key: 'vatReturns' },
      { icon: FileText, key: 'selfAssessment' },
      { icon: Users, key: 'payroll' },
      { icon: FileCheck, key: 'yearEndAccounts' },
      { icon: Building2, key: 'corporationTax' },
    ],
  },
  {
    id: 'business',
    icon: Briefcase,
    color: 'from-violet-400 to-purple-500',
    iconBg: 'bg-violet-400/10 border-violet-400/20',
    iconColor: 'text-violet-400',
    services: [
      { icon: Landmark, key: 'startupAdvice' },
      { icon: BarChart3, key: 'managementAccounts' },
      { icon: Target, key: 'budgetingForecasting' },
      { icon: ClipboardCheck, key: 'companySecretarial' },
    ],
  },
  {
    id: 'cloud',
    icon: Cloud,
    color: 'from-cyan-400 to-blue-500',
    iconBg: 'bg-cyan-400/10 border-cyan-400/20',
    iconColor: 'text-cyan-400',
    services: [
      { icon: Laptop, key: 'cloudAccounting' },
      { icon: Zap, key: 'mtdCompliance' },
      { icon: ShieldCheck, key: 'businessCompliance' },
    ],
  },
];

const CREDENTIALS = [
  { icon: Shield, key: 'piInsurance' },
  { icon: Eye, key: 'icoRegistered' },
  { icon: Scale, key: 'amlSupervision' },
  { icon: GraduationCap, key: 'qualifications' },
];

export function ProfessionalServicesPage() {
  const { t, locale, setLocale } = useTranslation();
  const [mobileNav, setMobileNav] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.ok ? r.json() : { packages: [] })
      .then(d => setPackages(d.packages || []))
      .catch(() => {})
      .finally(() => setPkgLoading(false));
  }, []);

  const NAV = [
    { href: '/#features', label: t('landing.nav.features') },
    { href: '/#pricing', label: t('landing.nav.pricing') },
    { href: '/professional-services', label: t('proServices.navLabel') },
    { href: '/#faq', label: t('landing.nav.faq') },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md shadow-amber-500/20">
              <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-bold text-white">Clarity & Co</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-400">
            {NAV.map(l => (
              <Link key={l.href} href={l.href} className={`hover:text-amber-400 transition-colors ${l.href === '/professional-services' ? 'text-amber-400' : ''}`}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'en' ? 'pt-BR' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
            >
              <span className="text-base leading-none">{locale === 'en' ? '🇧🇷' : '🇬🇧'}</span>
              <span className="hidden lg:inline">{locale === 'en' ? 'PT' : 'EN'}</span>
            </button>
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              {t('landing.nav.signIn')}
            </Link>
            <Link href="/register" className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-sm font-semibold hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20">
              {t('landing.cta.ctaPrimary')}
            </Link>
          </div>
          <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden text-slate-400">
            {mobileNav ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl">
            {NAV.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileNav(false)} className="block px-6 py-3 text-sm text-slate-400 hover:text-amber-400 border-b border-white/5">
                {l.label}
              </Link>
            ))}
            <div className="px-6 py-4 flex gap-3">
              <Link href="/login" className="flex-1 text-center py-2 rounded-lg glass text-white text-sm font-medium">{t('landing.nav.signIn')}</Link>
              <Link href="/register" className="flex-1 text-center py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-sm font-semibold">{t('landing.cta.ctaPrimary')}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold mb-6">
            <Briefcase className="h-3.5 w-3.5" /> {t('proServices.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            {t('proServices.heroTitle1')}<br />
            <span className="bg-gradient-to-r from-amber-400 to-cyan-400 bg-clip-text text-transparent">
              {t('proServices.heroTitle2')}
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {t('proServices.heroDesc')}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="#services" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold text-sm hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all">
              {t('proServices.heroCta1')} <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#contact" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10">
              <Phone className="h-4 w-4" /> {t('proServices.heroCta2')}
            </a>
          </div>
        </div>
      </section>

      {/* ── Brazilian Audience Banner ── */}
      <section className="py-12 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-green-500/10 via-yellow-500/10 to-blue-500/10 border border-green-400/20 p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="text-5xl">🇧🇷</div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white">{t('proServices.brTitle')}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{t('proServices.brDesc')}</p>
            </div>
            <a href="#contact" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-400 to-yellow-400 text-slate-900 font-semibold text-sm hover:from-green-300 hover:to-yellow-300 shadow-lg whitespace-nowrap">
              {t('proServices.brCta')}
            </a>
          </div>
        </div>
      </section>

      {/* ── Service Packages (from DB) ── */}
      {(pkgLoading || packages.length > 0) && (
        <section id="packages" className="py-20 sm:py-28 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-violet-950/10 to-slate-950" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400 text-xs font-semibold mb-4">
                <ShoppingBag className="h-3.5 w-3.5" /> Fixed-Price Packages
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Get Started?</h2>
              <p className="mt-4 text-lg text-slate-400">Transparent pricing — no surprises. Pay online and we handle the rest.</p>
            </div>

            {pkgLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map(pkg => {
                  const isExpanded = expandedPkg === pkg.id;
                  const hasDiscount = pkg.originalPriceGbp && pkg.originalPriceGbp > pkg.priceGbp;
                  return (
                    <div
                      key={pkg.id}
                      className={`neon-card p-6 space-y-4 transition-all hover:border-purple-400/30 ${
                        pkg.isFeatured ? 'border-purple-400/30 shadow-lg shadow-purple-500/10' : ''
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{pkg.iconEmoji || '📦'}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-white text-sm leading-tight">{pkg.title}</h3>
                              {pkg.isFeatured && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 text-[10px] font-semibold">
                                  <Star className="h-2.5 w-2.5" /> Featured
                                </span>
                              )}
                            </div>
                            {pkg.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full border border-white/10 text-slate-400 text-[10px]">
                                {CATEGORY_LABELS[pkg.category] || pkg.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          {hasDiscount && <p className="text-xs text-slate-500 line-through">£{pkg.originalPriceGbp}</p>}
                          <p className="text-2xl font-extrabold text-white">£{pkg.priceGbp}</p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-400 leading-relaxed">
                        {pkg.shortDescription || pkg.description.substring(0, 110) + '...'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {pkg.estimatedDays && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> ~{pkg.estimatedDays} days
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {pkg.deliverables.length} deliverables
                        </span>
                      </div>

                      {/* Expanded deliverables */}
                      {isExpanded && pkg.deliverables.length > 0 && (
                        <ul className="space-y-1.5 border-t border-white/5 pt-3">
                          {pkg.deliverables.map((d, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Link
                          href="/register"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-semibold hover:from-purple-400 hover:to-violet-400 shadow-lg shadow-purple-500/20 transition-all"
                        >
                          <CreditCard className="h-4 w-4" /> Get Started — £{pkg.priceGbp}
                        </Link>
                        <button
                          onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)}
                          className="px-4 py-2.5 rounded-xl glass text-slate-300 text-sm font-medium hover:bg-white/10 transition-all"
                        >
                          {isExpanded ? 'Less' : 'Details'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Services ── */}
      <section id="services" className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('proServices.servicesTitle')}</h2>
            <p className="mt-4 text-lg text-slate-400">{t('proServices.servicesSubtitle')}</p>
          </div>

          <div className="space-y-12">
            {SERVICE_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <div key={cat.id}>
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`h-12 w-12 rounded-xl ${cat.iconBg} border flex items-center justify-center`}>
                      <CatIcon className={`h-6 w-6 ${cat.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t(`proServices.cat.${cat.id}.title`)}</h3>
                      <p className="text-sm text-slate-400">{t(`proServices.cat.${cat.id}.subtitle`)}</p>
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.services.map((svc) => {
                      const SvcIcon = svc.icon;
                      return (
                        <div
                          key={svc.key}
                          className="neon-card p-6 group hover:border-amber-400/20 transition-all"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`h-9 w-9 rounded-lg ${cat.iconBg} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                              <SvcIcon className={`h-4 w-4 ${cat.iconColor}`} />
                            </div>
                            <h4 className="font-semibold text-white text-sm pt-1.5">
                              {t(`proServices.svc.${svc.key}.title`)}
                            </h4>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {t(`proServices.svc.${svc.key}.desc`)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('proServices.whyTitle')}</h2>
            <p className="mt-4 text-lg text-slate-400">{t('proServices.whySubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREDENTIALS.map((cred) => {
              const Icon = cred.icon;
              return (
                <div key={cred.key} className="neon-card p-6 text-center group hover:border-amber-400/20 transition-all">
                  <div className="h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-amber-400" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-2">{t(`proServices.cred.${cred.key}.title`)}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{t(`proServices.cred.${cred.key}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-violet-950/20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('proServices.howTitle')}</h2>
            <p className="mt-4 text-lg text-slate-400">{t('proServices.howSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Phone, color: 'from-amber-400 to-orange-400' },
              { step: '02', icon: ClipboardCheck, color: 'from-violet-400 to-purple-400' },
              { step: '03', icon: TrendingUp, color: 'from-emerald-400 to-cyan-400' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center">
                  <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg mb-4`}>
                    <Icon className="h-8 w-8 text-slate-900" />
                  </div>
                  <div className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full inline-block mb-3">{item.step}</div>
                  <h3 className="font-bold text-white mb-2">{t(`proServices.how.step${i + 1}.title`)}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{t(`proServices.how.step${i + 1}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Important Notice ── */}
      <section className="py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-8">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-amber-400" /> {t('proServices.noticeTitle')}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{t('proServices.noticeDesc')}</p>
          </div>
        </div>
      </section>

      {/* ── Contact / CTA ── */}
      <section id="contact" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('proServices.ctaTitle')}</h2>
          <p className="mt-4 text-lg text-slate-400">{t('proServices.ctaDesc')}</p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <a
              href="mailto:hello@clarityco.co.uk"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold text-sm hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Mail className="h-5 w-5" /> {t('proServices.ctaEmail')}
            </a>
            <a
              href="https://wa.me/447000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10 transition-all"
            >
              <Phone className="h-5 w-5" /> {t('proServices.ctaWhatsapp')}
            </a>
          </div>

          <p className="mt-6 text-sm text-slate-500">{t('proServices.ctaFree')}</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-slate-900/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg overflow-hidden shadow-md shadow-amber-500/20">
                <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-bold text-white">Clarity & Co</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/" className="hover:text-amber-400 transition-colors">{t('proServices.footerHome')}</Link>
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">{t('landing.footer.privacyPolicy')}</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">{t('landing.footer.termsOfService')}</Link>
            </div>
            <p className="text-sm text-slate-600">&copy; {new Date().getFullYear()} Clarity & Co</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
