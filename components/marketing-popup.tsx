'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Mail } from 'lucide-react';

interface PopupConfig {
  id: string;
  type: string;
  triggerValue: number;
  titleEn: string;
  titlePt: string | null;
  bodyEn: string;
  bodyPt: string | null;
  ctaEn: string;
  ctaPt: string | null;
  showOnPaths: string[];
}

const DISMISSED_KEY = 'clarity-popup-dismissed';

export function MarketingPopup() {
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [active, setActive] = useState<PopupConfig | null>(null);
  const [shown, setShown] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isPt = typeof window !== 'undefined' && localStorage.getItem('homeledger-locale') === 'pt-BR';

  useEffect(() => {
    // Don't show if recently dismissed
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    fetch('/api/marketing/popups')
      .then(r => r.json())
      .then((data: PopupConfig[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const path = window.location.pathname;
        const eligible = data.filter(p =>
          p.showOnPaths.length === 0 || p.showOnPaths.some(pp => path.startsWith(pp))
        );
        if (eligible.length > 0) setPopups(eligible);
      })
      .catch(() => {});
  }, []);

  // Setup triggers
  useEffect(() => {
    if (popups.length === 0 || shown) return;

    const handlers: (() => void)[] = [];

    for (const popup of popups) {
      if (popup.type === 'exit_intent') {
        const handler = (e: MouseEvent) => {
          if (e.clientY <= 0 && !shown) {
            setActive(popup);
            setShown(true);
          }
        };
        document.addEventListener('mouseleave', handler);
        handlers.push(() => document.removeEventListener('mouseleave', handler));

      } else if (popup.type === 'time') {
        const timeout = setTimeout(() => {
          if (!shown) {
            setActive(popup);
            setShown(true);
          }
        }, popup.triggerValue * 1000);
        handlers.push(() => clearTimeout(timeout));

      } else if (popup.type === 'scroll') {
        const handler = () => {
          const scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPct >= popup.triggerValue && !shown) {
            setActive(popup);
            setShown(true);
          }
        };
        window.addEventListener('scroll', handler, { passive: true });
        handlers.push(() => window.removeEventListener('scroll', handler));
      }
    }

    return () => handlers.forEach(h => h());
  }, [popups, shown]);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setActive(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup', sourceSlug: active?.id }),
      });
      setSubmitted(true);
      setTimeout(dismiss, 3000);
    } finally {
      setSubmitting(false);
    }
  }

  if (!active) return null;

  const title = isPt ? (active.titlePt || active.titleEn) : active.titleEn;
  const body = isPt ? (active.bodyPt || active.bodyEn) : active.bodyEn;
  const cta = isPt ? (active.ctaPt || active.ctaEn) : active.ctaEn;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl overflow-hidden">
            <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
          </div>
          <span className="text-sm font-medium text-slate-400">Clarity & Co</span>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isPt ? 'Obrigado!' : "You're in!"}
            </h3>
            <p className="text-slate-400 text-sm">
              {isPt ? 'Verifique o seu email em breve.' : 'Check your email soon.'}
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-5">{body}</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-800 border border-white/10 rounded-xl px-3 py-2">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isPt ? 'seu@email.com' : 'your@email.com'}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold text-sm hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-60"
              >
                {submitting ? '...' : cta}
              </button>
              <button type="button" onClick={dismiss} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors py-1">
                {isPt ? 'Não, obrigado' : 'No thanks'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
