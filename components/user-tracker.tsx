'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// ── Device detection helpers ──
function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);
  const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  let browser = 'unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return {
    userAgent: ua,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    device,
    browser,
    os,
  };
}

// ── Screenshot key detection ──
const SCREENSHOT_KEYS = new Set([
  'PrintScreen',
  'F13', // Some Mac keyboards
]);

const SCREENSHOT_COMBOS: { keys: string[]; label: string }[] = [
  { keys: ['Control', 'Shift', 'KeyS'], label: 'Ctrl+Shift+S (Snipping Tool)' },
  { keys: ['Control', 'Shift', 'Key4'], label: 'Ctrl+Shift+4' },
  { keys: ['Meta', 'Shift', 'Digit3'], label: 'Cmd+Shift+3 (Mac Screenshot)' },
  { keys: ['Meta', 'Shift', 'Digit4'], label: 'Cmd+Shift+4 (Mac Screenshot Area)' },
  { keys: ['Meta', 'Shift', 'Digit5'], label: 'Cmd+Shift+5 (Mac Screen Record)' },
  { keys: ['Meta', 'Shift', 'KeyS'], label: 'Cmd+Shift+S' },
  { keys: ['Alt', 'PrintScreen'], label: 'Alt+PrintScreen (Window)' },
  // Windows Game Bar
  { keys: ['Meta', 'KeyG'], label: 'Win+G (Game Bar)' },
  { keys: ['Meta', 'Alt', 'KeyR'], label: 'Win+Alt+R (Game Bar Record)' },
];

// ── Recording event types for rrweb-lite approach ──
interface RecordingEvent {
  type: string;
  timestamp: number;
  data: any;
}

export default function UserTracker() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const sessionTokenRef = useRef<string | null>(null);
  const statsRef = useRef({ pagesVisited: 0, clickCount: 0, scrollEvents: 0 });
  const eventsBufferRef = useRef<RecordingEvent[]>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const isActiveRef = useRef(false);
  const lastPageRef = useRef<string>('');

  const user = session?.user as any;
  const isTestUser = user?.isTestUser === true;
  const userId = user?.id;
  const isLoggedIn = !!userId;

  // ── Send alert to server ──
  const sendAlert = useCallback(async (alertType: string, method: string, extra?: any) => {
    try {
      await fetch('/api/analytics/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType,
          method,
          page: window.location.pathname,
          keyCombo: extra?.keyCombo || null,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          sessionId: sessionTokenRef.current,
          metadata: extra?.metadata || null,
        }),
      });
    } catch (e) {
      console.error('[Tracker] Failed to send alert:', e);
    }
  }, []);

  // ── Record an event (lightweight DOM recording — test users only) ──
  const recordEvent = useCallback((type: string, data: any) => {
    eventsBufferRef.current.push({
      type,
      timestamp: Date.now(),
      data,
    });
  }, []);

  // ── Flush events buffer to server ──
  const flushEvents = useCallback(async () => {
    if (!sessionTokenRef.current || eventsBufferRef.current.length === 0) return;
    const events = [...eventsBufferRef.current];
    eventsBufferRef.current = [];

    try {
      await fetch('/api/analytics/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'append',
          sessionToken: sessionTokenRef.current,
          events,
          stats: statsRef.current,
        }),
      });
    } catch (e) {
      // Re-add events on failure
      eventsBufferRef.current = [...events, ...eventsBufferRef.current];
    }
  }, []);

  // ── Start session ──
  const startSession = useCallback(async () => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;

    const token = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionTokenRef.current = token;
    statsRef.current = { pagesVisited: 1, clickCount: 0, scrollEvents: 0 };

    try {
      await fetch('/api/analytics/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          sessionToken: token,
          deviceInfo: getDeviceInfo(),
        }),
      });
    } catch (e) {
      console.error('[Tracker] Failed to start session:', e);
    }

    // Record initial page
    recordEvent('page_view', { path: window.location.pathname, title: document.title });
  }, [recordEvent]);

  // ── End session ──
  const endSession = useCallback(async () => {
    if (!isActiveRef.current || !sessionTokenRef.current) return;
    isActiveRef.current = false;

    await flushEvents();

    try {
      await fetch('/api/analytics/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionToken: sessionTokenRef.current,
          stats: statsRef.current,
        }),
        keepalive: true,
      });
    } catch (e) {
      // Best effort
    }
  }, [flushEvents]);

  // ══════════════════════════════════════════════════════════════════════
  // EFFECT 1: Screenshot / Screen Recording / DevTools / Print detection
  // Active for ALL logged-in users — alerts saved to DB
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isLoggedIn) return;

    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.code);

      // Direct screenshot key
      if (SCREENSHOT_KEYS.has(e.code)) {
        sendAlert('screenshot', 'keyboard_shortcut', { keyCombo: e.code });
      }

      // Check combos
      for (const combo of SCREENSHOT_COMBOS) {
        const allPressed = combo.keys.every(k => {
          if (k === 'Control') return e.ctrlKey;
          if (k === 'Shift') return e.shiftKey;
          if (k === 'Alt') return e.altKey;
          if (k === 'Meta') return e.metaKey;
          return keysDown.has(k);
        });
        if (allPressed) {
          const isRecording = combo.label.includes('Record') || combo.label.includes('Game Bar');
          sendAlert(
            isRecording ? 'screen_recording' : 'screenshot',
            'keyboard_shortcut',
            { keyCombo: combo.label }
          );
          break;
        }
      }

      // DevTools detection (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        e.code === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.code === 'KeyI' || e.code === 'KeyJ' || e.code === 'KeyC'))
      ) {
        sendAlert('devtools', 'keyboard_shortcut', { keyCombo: e.code });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
    };

    // Print detection
    const handleBeforePrint = () => {
      sendAlert('print', 'browser_print', { metadata: { path: window.location.pathname } });
    };

    // Screen capture API interception (getDisplayMedia)
    const origGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
    if (navigator.mediaDevices && origGetDisplayMedia) {
      (navigator.mediaDevices as any).getDisplayMedia = async function (options?: DisplayMediaStreamOptions) {
        sendAlert('screen_recording', 'api_call', {
          metadata: { api: 'getDisplayMedia', path: window.location.pathname },
        });
        return origGetDisplayMedia.call(navigator.mediaDevices, options);
      };
    }

    // Resize detection (DevTools panel opening changes viewport)
    let lastWidth = window.outerWidth;
    let lastHeight = window.outerHeight;
    const handleResize = () => {
      const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
      const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
      if (widthDiff > 200 || heightDiff > 200) {
        if (lastWidth !== window.outerWidth || lastHeight !== window.outerHeight) {
          sendAlert('devtools', 'resize_detection', {
            metadata: {
              outerWidth: window.outerWidth,
              innerWidth: window.innerWidth,
              outerHeight: window.outerHeight,
              innerHeight: window.innerHeight,
            },
          });
        }
      }
      lastWidth = window.outerWidth;
      lastHeight = window.outerHeight;
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('resize', handleResize);
      if (navigator.mediaDevices && origGetDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = origGetDisplayMedia;
      }
    };
  }, [isLoggedIn, sendAlert]);

  // ══════════════════════════════════════════════════════════════════════
  // EFFECT 2: Full session recording (clicks, scroll, heatmap, navigation)
  // Active ONLY for test users
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isTestUser || !userId) return;

    startSession();

    // Flush events every 30 seconds
    flushTimerRef.current = setInterval(flushEvents, 30000);

    // Click tracking
    const handleClick = (e: MouseEvent) => {
      statsRef.current.clickCount++;
      const target = e.target as HTMLElement;
      recordEvent('click', {
        x: Math.round((e.clientX / window.innerWidth) * 10000) / 100,
        y: Math.round((e.clientY / window.innerHeight) * 10000) / 100,
        tag: target.tagName?.toLowerCase(),
        text: target.textContent?.slice(0, 50) || '',
        id: target.id || undefined,
        className: target.className?.toString().slice(0, 100) || undefined,
        path: window.location.pathname,
      });
    };

    // Scroll tracking (throttled)
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        statsRef.current.scrollEvents++;
        const scrollPercent = Math.round(
          ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
        );
        recordEvent('scroll', {
          depth: scrollPercent,
          path: window.location.pathname,
        });
      }, 500);
    };

    // Mouse movement tracking (heavily throttled for heatmap)
    let moveCount = 0;
    const handleMouseMove = (e: MouseEvent) => {
      moveCount++;
      if (moveCount % 50 !== 0) return;
      recordEvent('mousemove', {
        x: Math.round((e.clientX / window.innerWidth) * 10000) / 100,
        y: Math.round((e.clientY / window.innerHeight) * 10000) / 100,
        path: window.location.pathname,
      });
    };

    // Context menu detection (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      recordEvent('context_menu', {
        x: Math.round((e.clientX / window.innerWidth) * 10000) / 100,
        y: Math.round((e.clientY / window.innerHeight) * 10000) / 100,
        path: window.location.pathname,
      });
    };

    // Visibility change detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordEvent('tab_hidden', { path: window.location.pathname });
        flushEvents();
      } else {
        recordEvent('tab_visible', { path: window.location.pathname });
      }
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', endSession);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', endSession);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      endSession();
    };
  }, [isTestUser, userId, startSession, endSession, recordEvent, flushEvents]);

  // Track page navigation (test users only)
  useEffect(() => {
    if (!isTestUser || !isActiveRef.current) return;
    if (pathname && pathname !== lastPageRef.current) {
      lastPageRef.current = pathname;
      statsRef.current.pagesVisited++;
      recordEvent('page_view', { path: pathname, title: document.title });
    }
  }, [pathname, isTestUser, recordEvent]);

  // This component is invisible — no UI
  return null;
}
