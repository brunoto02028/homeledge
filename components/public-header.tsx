'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X, Globe } from 'lucide-react';

interface PublicHeaderProps {
  locale?: string;
  onLocaleChange?: (locale: string) => void;
}

export function PublicHeader({ locale = 'en', onLocaleChange }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();

  const isPt = locale === 'pt-BR';

  const NAV_PRIMARY = [
    { href: '/#features', label: isPt ? 'Funcionalidades' : 'Features' },
    { href: '/#pricing', label: isPt ? 'Preços' : 'Pricing' },
    { href: '/blog', label: 'Blog' },
    { href: '/professional-services', label: isPt ? 'Serviços' : 'Services' },
    { href: '/intelligence/subscribe', label: '🌐 Intelligence' },
  ];

  const NAV_MORE = [
    { href: '/#business', label: isPt ? 'Para Empresas' : 'For Business' },
    { href: '/#accountants', label: isPt ? 'Para Contadores' : 'For Accountants' },
    { href: '/#verify-id', label: isPt ? 'Verificar ID' : 'Verify ID' },
    { href: '/#new-arrivals', label: isPt ? 'Novos no UK' : 'New to UK' },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md shadow-amber-500/20">
            <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Clarity<span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">&amp; Co</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-5 text-[13px] font-medium text-slate-400">
          {NAV_PRIMARY.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap ${pathname === l.href ? 'text-amber-400' : ''}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors"
            >
              {isPt ? 'Mais' : 'More'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-xl py-2 z-50"
                onMouseLeave={() => setMoreOpen(false)}
              >
                {NAV_MORE.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {onLocaleChange && (
            <button
              onClick={() => onLocaleChange(isPt ? 'en' : 'pt-BR')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors border border-white/10"
            >
              <Globe className="h-3.5 w-3.5" />
              {isPt ? 'EN' : 'PT'}
            </button>
          )}
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            {isPt ? 'Entrar' : 'Sign In'}
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20"
          >
            {isPt ? 'Começar Grátis' : 'Start Free'}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 text-slate-400 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/5 bg-slate-900/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {[...NAV_PRIMARY, ...NAV_MORE].map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                {isPt ? 'Entrar' : 'Sign In'}
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-center">
                {isPt ? 'Começar Grátis' : 'Start Free'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export function PublicFooter({ isPt = false }: { isPt?: boolean }) {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-bold text-white">
                Clarity<span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">&amp; Co</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-xs">
              {isPt
                ? 'Gestão financeira inteligente para imigrantes e autónomos no Reino Unido.'
                : 'Smart financial management for immigrants and self-employed in the UK.'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-3">{isPt ? 'Produto' : 'Product'}</h4>
              <ul className="space-y-2 text-slate-500">
                <li><Link href="/#features" className="hover:text-amber-400 transition-colors">{isPt ? 'Funcionalidades' : 'Features'}</Link></li>
                <li><Link href="/#pricing" className="hover:text-amber-400 transition-colors">{isPt ? 'Preços' : 'Pricing'}</Link></li>
                <li><Link href="/blog" className="hover:text-amber-400 transition-colors">Blog</Link></li>
                <li><Link href="/professional-services" className="hover:text-amber-400 transition-colors">{isPt ? 'Serviços' : 'Services'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">{isPt ? 'Conta' : 'Account'}</h4>
              <ul className="space-y-2 text-slate-500">
                <li><Link href="/register" className="hover:text-amber-400 transition-colors">{isPt ? 'Criar Conta' : 'Sign Up'}</Link></li>
                <li><Link href="/login" className="hover:text-amber-400 transition-colors">{isPt ? 'Entrar' : 'Sign In'}</Link></li>
                <li><Link href="/forgot-password" className="hover:text-amber-400 transition-colors">{isPt ? 'Recuperar Senha' : 'Reset Password'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">{isPt ? 'Legal' : 'Legal'}</h4>
              <ul className="space-y-2 text-slate-500">
                <li><Link href="/privacy" className="hover:text-amber-400 transition-colors">{isPt ? 'Privacidade' : 'Privacy'}</Link></li>
                <li><Link href="/terms" className="hover:text-amber-400 transition-colors">{isPt ? 'Termos' : 'Terms'}</Link></li>
                <li><a href="mailto:hello@clarityco.co.uk" className="hover:text-amber-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Clarity & Co. {isPt ? 'Todos os direitos reservados.' : 'All rights reserved.'}</p>
          <p>clarityco.co.uk</p>
        </div>
      </div>
    </footer>
  );
}
