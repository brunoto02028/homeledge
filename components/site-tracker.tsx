'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Simple browser fingerprint (no external lib needed)
function generateFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || '',
    (nav as any).deviceMemory || '',
  ].join('|');
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36) + '_' + raw.length.toString(36);
}

function getSessionId(): string {
  let sid = sessionStorage.getItem('hl-session-id');
  if (!sid) {
    sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem('hl-session-id', sid);
  }
  return sid;
}

function hasAnalyticsConsent(): boolean {
  const consent = localStorage.getItem('hl-cookie-consent');
  return consent === 'accepted';
}

function getDescriptiveSelector(el: HTMLElement): string {
  // Build a human-readable selector
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const text = el.textContent?.trim().substring(0, 60) || '';
  const href = el.getAttribute('href') || '';
  const ariaLabel = el.getAttribute('aria-label') || '';

  let desc = tag + id;
  if (ariaLabel) desc += `[aria-label="${ariaLabel}"]`;
  else if (href) desc += `[href="${href}"]`;
  if (text && text.length < 40) desc += ` "${text}"`;
  return desc.substring(0, 500);
}

async function sendEvent(data: Record<string, any>) {
  try {
    const res = await fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true, // Allow sending during page unload
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export function SiteTracker() {
  const pathname = usePathname();
  const pageViewIdRef = useRef<string | null>(null);
  const enteredAtRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const clickTimesRef = useRef<number[]>([]);
  const sentRef = useRef(false);

  // Track page view
  useEffect(() => {
    if (!hasAnalyticsConsent()) return;

    const fingerprint = generateFingerprint();
    const sessionId = getSessionId();
    enteredAtRef.current = Date.now();
    maxScrollRef.current = 0;
    sentRef.current = false;
    pageViewIdRef.current = null;

    sendEvent({
      type: 'pageview',
      fingerprint,
      sessionId,
      path: pathname,
      title: document.title,
      referrer: document.referrer || null,
    }).then((res) => {
      if (res?.pageViewId) {
        pageViewIdRef.current = res.pageViewId;
      }
    });

    // Cleanup: send page exit
    return () => {
      if (sentRef.current) return;
      sentRef.current = true;
      const timeOnPage = Math.round((Date.now() - enteredAtRef.current) / 1000);
      sendEvent({
        type: 'page_exit',
        fingerprint,
        sessionId,
        path: pathname,
        pageViewId: pageViewIdRef.current,
        timeOnPage,
        scrollDepth: maxScrollRef.current,
      });
    };
  }, [pathname]);

  // Track scroll depth
  useEffect(() => {
    if (!hasAnalyticsConsent()) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);
      if (pct > maxScrollRef.current) {
        maxScrollRef.current = pct;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Track clicks
  useEffect(() => {
    if (!hasAnalyticsConsent()) return;

    const fingerprint = generateFingerprint();
    const sessionId = getSessionId();

    const handleClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el) return;

      // Calculate position as % of viewport
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round(((e.clientY + window.scrollY) / document.documentElement.scrollHeight) * 100);

      // Determine click type
      const closest = el.closest('a, button, [role="button"], input[type="submit"]');
      let type = 'click';
      if (closest) {
        const href = closest.getAttribute('href') || '';
        if (href.startsWith('#') || closest.closest('nav')) type = 'nav_click';
        else if (closest.classList.contains('cta') || closest.textContent?.match(/start|buy|sign up|register|get started|try/i)) type = 'cta_click';
      }
      if ((el as HTMLFormElement).tagName === 'FORM' || el.closest('form')?.querySelector('[type="submit"]') === el) {
        type = 'form_submit';
      }

      // Rage click detection (3+ clicks within 1 second)
      const now = Date.now();
      clickTimesRef.current.push(now);
      clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 1000);
      if (clickTimesRef.current.length >= 3) {
        type = 'rage_click';
        clickTimesRef.current = [];
      }

      const target = getDescriptiveSelector(closest as HTMLElement || el);

      sendEvent({
        type,
        fingerprint,
        sessionId,
        path: pathname,
        pageViewId: pageViewIdRef.current,
        target,
        x,
        y,
        metadata: { text: (closest || el).textContent?.trim().substring(0, 100) },
      });
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  // Send exit on beforeunload
  useEffect(() => {
    if (!hasAnalyticsConsent()) return;

    const fingerprint = generateFingerprint();
    const sessionId = getSessionId();

    const handleUnload = () => {
      if (sentRef.current) return;
      sentRef.current = true;
      const timeOnPage = Math.round((Date.now() - enteredAtRef.current) / 1000);
      // Use sendBeacon for reliability during unload
      const data = JSON.stringify({
        type: 'page_exit',
        fingerprint,
        sessionId,
        path: pathname,
        pageViewId: pageViewIdRef.current,
        timeOnPage,
        scrollDepth: maxScrollRef.current,
      });
      navigator.sendBeacon('/api/analytics/collect', new Blob([data], { type: 'application/json' }));
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [pathname]);

  return null; // Invisible component
}
