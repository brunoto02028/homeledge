'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Shared PWA context so sidebar button & banner share state ──────────────
interface PWAContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  triggerInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextValue>({
  canInstall: false,
  isInstalled: false,
  triggerInstall: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration failed:', err);
      });
    }

    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installedHandler = () => setIsInstalled(true);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return (
    <PWAContext.Provider value={{ canInstall: !!deferredPrompt, isInstalled, triggerInstall }}>
      {children}
    </PWAContext.Provider>
  );
}

// ─── Floating banner (shows once, dismissible) ─────────────────────────────
export function PWAInstallPrompt() {
  const { canInstall, isInstalled, triggerInstall } = usePWA();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!canInstall || isInstalled) return;
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
      setShowBanner(true);
    }
  }, [canInstall, isInstalled]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-center gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-600 dark:from-amber-500 dark:to-amber-400 flex items-center justify-center">
          <Download className="h-5 w-5 text-white dark:text-slate-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Install HomeLedger</p>
          <p className="text-xs text-muted-foreground">Quick access from your desktop</p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={triggerInstall} className="h-8 text-xs">
            Install
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Permanent sidebar install button (always visible) ──────────────────────
export function PWASidebarButton({ collapsed = false }: { collapsed?: boolean }) {
  const { canInstall, isInstalled, triggerInstall } = usePWA();

  const handleClick = async () => {
    if (canInstall) {
      await triggerInstall();
    } else {
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
      const isEdge = /Edg/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      let msg = 'To install HomeLedger as a desktop app:\n\n';
      if (isEdge) msg += '• Click the install icon in the address bar\n• Or: Menu (\u22EF) \u2192 Apps \u2192 Install HomeLedger';
      else if (isChrome) msg += '• Click the install icon in the address bar\n• Or: Menu (\u22EE) \u2192 "Install HomeLedger"';
      else if (isSafari) msg += '• File \u2192 Add to Dock (macOS Sonoma+)';
      else msg += '• Use Chrome or Edge for best install experience';
      alert(msg);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors',
        isInstalled ? 'text-emerald-400 hover:bg-white/10' : 'text-amber-400 hover:bg-white/10',
        collapsed && 'justify-center px-0'
      )}
    >
      {isInstalled
        ? <Monitor className="h-4 w-4 flex-shrink-0" />
        : <Download className="h-4 w-4 flex-shrink-0" />}
      {!collapsed && (
        <span className="text-xs font-medium">
          {isInstalled ? 'App Installed' : 'Install App'}
        </span>
      )}
    </button>
  );
}
