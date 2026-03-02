'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const SESSION_KEY = 'hl_analytics_sid';
const FLUSH_INTERVAL = 10_000; // flush every 10 seconds
const MAX_BUFFER = 100;

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function getViewport(): string {
  if (typeof window === 'undefined') return '0x0';
  return `${window.innerWidth}x${window.innerHeight}`;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const bufferRef = useRef<any[]>([]);
  const pageEnteredRef = useRef<number>(Date.now());
  const prevPathRef = useRef<string | null>(null);
  const maxScrollRef = useRef<number>(0);
  const sessionStartedRef = useRef(false);

  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0) return;
    const events = bufferRef.current.splice(0, bufferRef.current.length);
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch {
      // Re-add failed events to buffer (up to limit)
      bufferRef.current.unshift(...events.slice(0, MAX_BUFFER - bufferRef.current.length));
    }
  }, []);

  const pushEvent = useCallback((eventType: string, extra: Record<string, any> = {}) => {
    bufferRef.current.push({
      sessionId: getSessionId(),
      eventType,
      page: pathname || '/',
      viewport: getViewport(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      ...extra,
    });
    if (bufferRef.current.length >= MAX_BUFFER) {
      flush();
    }
  }, [pathname, flush]);

  // Session start (once per tab)
  useEffect(() => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    pushEvent('session_start');
  }, [pushEvent]);

  // Page view tracking
  useEffect(() => {
    // Send duration for previous page
    if (prevPathRef.current && prevPathRef.current !== pathname) {
      const duration = Math.round((Date.now() - pageEnteredRef.current) / 1000);
      bufferRef.current.push({
        sessionId: getSessionId(),
        eventType: 'page_view',
        page: prevPathRef.current,
        viewport: getViewport(),
        duration,
        scrollDepth: maxScrollRef.current,
        referrer: prevPathRef.current,
      });
    }

    // Reset for new page
    pageEnteredRef.current = Date.now();
    maxScrollRef.current = 0;
    prevPathRef.current = pathname;

    // Log new page view
    pushEvent('page_view', { referrer: document.referrer || null });
  }, [pathname, pushEvent]);

  // Click tracking
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Get the most relevant clickable ancestor (button, a, etc.)
      const clickable = target.closest('button, a, [role="button"], input[type="submit"], [data-track]') as HTMLElement | null;
      const el = clickable || target;

      const rect = document.documentElement;
      const xPct = (e.clientX / rect.clientWidth) * 100;
      const yPct = ((e.clientY + window.scrollY) / Math.max(rect.scrollHeight, rect.clientHeight)) * 100;

      pushEvent('click', {
        x: Math.round(xPct * 100) / 100,
        y: Math.round(yPct * 100) / 100,
        elementTag: el.tagName?.toLowerCase() || null,
        elementText: (el.textContent || '').trim().slice(0, 200) || null,
        elementId: el.id || el.getAttribute('data-track') || null,
      });
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [pushEvent]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        const depth = Math.round((scrollTop / scrollHeight) * 100);
        if (depth > maxScrollRef.current) {
          maxScrollRef.current = depth;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Periodic flush
  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL);
    return () => clearInterval(interval);
  }, [flush]);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => {
      // Send final page duration
      const duration = Math.round((Date.now() - pageEnteredRef.current) / 1000);
      bufferRef.current.push({
        sessionId: getSessionId(),
        eventType: 'page_view',
        page: pathname || '/',
        viewport: getViewport(),
        duration,
        scrollDepth: maxScrollRef.current,
      });
      bufferRef.current.push({
        sessionId: getSessionId(),
        eventType: 'session_end',
        page: pathname || '/',
      });

      // Use sendBeacon for reliable delivery on unload
      const payload = JSON.stringify({ events: bufferRef.current });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', payload);
      } else {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [pathname]);

  // Invisible component — no UI
  return null;
}
