'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('hl-cookie-consent');
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('hl-cookie-consent', 'accepted');
    document.cookie = 'hl-cookie-consent=accepted; path=/; max-age=31536000; SameSite=Lax';
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('hl-cookie-consent', 'essential-only');
    document.cookie = 'hl-cookie-consent=essential-only; path=/; max-age=31536000; SameSite=Lax';
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Cookie className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 leading-relaxed">
              We use <strong>essential cookies</strong> to keep you signed in and protect your account.
              No tracking or advertising cookies are used.{' '}
              <Link href="/cookies" className="text-amber-400 hover:text-amber-300 underline">
                Cookie Policy
              </Link>
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={accept}
                size="sm"
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-5"
              >
                Accept All
              </Button>
              <Button
                onClick={decline}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                Essential Only
              </Button>
            </div>
          </div>
          <button
            onClick={decline}
            className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
