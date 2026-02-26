'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Settings, Shield, BarChart3, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ConsentPreferences = {
  essential: boolean; // always true
  functional: boolean;
  analytics: boolean;
};

const DEFAULT_PREFS: ConsentPreferences = { essential: true, functional: true, analytics: false };

export function getConsentPreferences(): ConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem('hl-cookie-consent');
    if (!raw) return DEFAULT_PREFS;
    if (raw === 'accepted') return { essential: true, functional: true, analytics: true };
    if (raw === 'essential-only') return { essential: true, functional: false, analytics: false };
    const parsed = JSON.parse(raw);
    return { essential: true, functional: !!parsed.functional, analytics: !!parsed.analytics };
  } catch {
    return DEFAULT_PREFS;
  }
}

function saveConsent(prefs: ConsentPreferences) {
  const value = JSON.stringify(prefs);
  localStorage.setItem('hl-cookie-consent', prefs.analytics && prefs.functional ? 'accepted' : value);
  document.cookie = `hl-cookie-consent=${encodeURIComponent(prefs.analytics && prefs.functional ? 'accepted' : value)}; path=/; max-age=31536000; SameSite=Lax`;
  // Dispatch event so SiteTracker can react
  window.dispatchEvent(new CustomEvent('hl-consent-change', { detail: prefs }));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    const consent = localStorage.getItem('hl-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const p = { essential: true, functional: true, analytics: true };
    saveConsent(p);
    setVisible(false);
    setShowPrefs(false);
  };

  const essentialOnly = () => {
    const p = { essential: true, functional: false, analytics: false };
    saveConsent(p);
    setVisible(false);
    setShowPrefs(false);
  };

  const savePreferences = () => {
    saveConsent({ ...prefs, essential: true });
    setVisible(false);
    setShowPrefs(false);
  };

  // Preferences modal (also accessible from outside via global function)
  useEffect(() => {
    (window as any).__hlOpenCookiePrefs = () => {
      setPrefs(getConsentPreferences());
      setShowPrefs(true);
      setVisible(true);
    };
  }, []);

  if (!visible && !showPrefs) return null;

  // Preferences Modal
  if (showPrefs) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Cookie Preferences</h2>
            </div>
            <button onClick={() => { setShowPrefs(false); if (!localStorage.getItem('hl-cookie-consent')) setVisible(true); else setVisible(false); }} className="text-slate-500 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-slate-400 leading-relaxed">
              Under UK GDPR and PECR regulations, you have the right to choose which cookies we use.
              Essential cookies cannot be disabled as they are required for the site to function.
            </p>

            {/* Essential - always on */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Essential Cookies</p>
                  <p className="text-xs text-slate-400 mt-1">Authentication, CSRF protection, session management. Required for the site to work.</p>
                </div>
              </div>
              <div className="shrink-0 ml-4">
                <div className="w-11 h-6 rounded-full bg-emerald-500/30 relative cursor-not-allowed">
                  <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-emerald-400 shadow" />
                </div>
              </div>
            </div>

            {/* Functional */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <Cog className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Functional Cookies</p>
                  <p className="text-xs text-slate-400 mt-1">Language preference, UI settings. Improves your experience but not strictly required.</p>
                </div>
              </div>
              <div className="shrink-0 ml-4">
                <button
                  onClick={() => setPrefs(p => ({ ...p, functional: !p.functional }))}
                  className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${prefs.functional ? 'bg-blue-500/30' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-200 ${prefs.functional ? 'right-0.5 bg-blue-400' : 'left-0.5 bg-slate-500'}`} />
                </button>
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Analytics Cookies</p>
                  <p className="text-xs text-slate-400 mt-1">Page views, click tracking, scroll depth, and time on page. Helps us improve the site. No data is shared with third parties.</p>
                </div>
              </div>
              <div className="shrink-0 ml-4">
                <button
                  onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                  className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${prefs.analytics ? 'bg-amber-500/30' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-200 ${prefs.analytics ? 'right-0.5 bg-amber-400' : 'left-0.5 bg-slate-500'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-5 border-t border-slate-700/50 bg-slate-900/50">
            <Link href="/cookies" className="text-xs text-slate-500 hover:text-amber-400 transition-colors underline">
              Cookie Policy
            </Link>
            <div className="flex items-center gap-3">
              <Button onClick={essentialOnly} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Essential Only
              </Button>
              <Button onClick={savePreferences} size="sm" className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-5">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main banner
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Cookie className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 leading-relaxed">
              We use <strong>essential cookies</strong> to keep you signed in, plus optional <strong>analytics</strong> to
              improve our service. No advertising or third-party tracking.{' '}
              <Link href="/cookies" className="text-amber-400 hover:text-amber-300 underline">
                Cookie Policy
              </Link>
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button onClick={acceptAll} size="sm" className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-5">
                Accept All
              </Button>
              <Button onClick={essentialOnly} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
                Essential Only
              </Button>
              <button
                onClick={() => { setPrefs(getConsentPreferences()); setShowPrefs(true); }}
                className="text-xs text-slate-500 hover:text-amber-400 underline transition-colors"
              >
                Manage Preferences
              </button>
            </div>
          </div>
          <button onClick={essentialOnly} className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors" aria-label="Close cookie banner">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
