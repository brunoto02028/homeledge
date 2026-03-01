'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Radio, X, ExternalLink, Bell, BellOff, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────
interface AlertConfig {
  enabled: boolean;
  keywords: string[];
  checkIntervalMinutes: number;
  soundEnabled: boolean;
}

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  sentiment: string;
  ukImpact: boolean;
  prophecyRelated: boolean;
  prophecyRef: string | null;
  category: string;
}

interface AlertNotification {
  id: string;
  article: NewsArticle;
  matchedKeyword: string;
  timestamp: number;
}

const DEFAULT_CONFIG: AlertConfig = {
  enabled: false,
  keywords: ['war', 'crisis', 'uk economy', 'bank of england', 'recession', 'israel', 'earthquake'],
  checkIntervalMinutes: 15,
  soundEnabled: true,
};

const STORAGE_KEY = 'intelligence-alert-config';
const SEEN_KEY = 'intelligence-seen-ids';

function getConfig(): AlertConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}

function saveConfig(config: AlertConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function getSeenIds(): Set<string> {
  try {
    const stored = localStorage.getItem(SEEN_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function addSeenIds(ids: string[]) {
  const seen = getSeenIds();
  ids.forEach(id => seen.add(id));
  // Keep only last 500 to avoid bloating
  const arr = [...seen].slice(-500);
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

// ─── Alert Bell Component (goes in AppShell header) ─────────────────────────
export function IntelligenceAlertBell() {
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  const checkNews = useCallback(async () => {
    if (!config.enabled || config.keywords.length === 0) return;

    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (!data.articles) return;

      const seen = getSeenIds();
      const newAlerts: AlertNotification[] = [];

      for (const article of data.articles) {
        if (seen.has(article.id)) continue;

        const text = `${article.title} ${article.description}`.toLowerCase();
        for (const keyword of config.keywords) {
          if (text.includes(keyword.toLowerCase())) {
            newAlerts.push({
              id: article.id,
              article,
              matchedKeyword: keyword,
              timestamp: Date.now(),
            });
            break;
          }
        }
      }

      if (newAlerts.length > 0) {
        setNotifications(prev => [...newAlerts.slice(0, 5), ...prev].slice(0, 20));
        addSeenIds(newAlerts.map(a => a.id));

        // Play notification sound
        if (config.soundEnabled) {
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdmSIkpONfnJ5h4yLiYF4dXuAgoSCfXl5fICBgYB+fHx+gIGBgH59fX+AgYGAfn19f4CBgYB+fX1/gIGBgH59fX+AgQ==');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {}
        }
      }
    } catch (err) {
      console.error('[Intelligence Alert] Check failed:', err);
    }
  }, [config]);

  // Set up periodic checking
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (config.enabled) {
      // Check immediately on enable
      checkNews();
      intervalRef.current = setInterval(checkNews, config.checkIntervalMinutes * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config.enabled, config.checkIntervalMinutes, checkNews]);

  const toggleEnabled = () => {
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    saveConfig(updated);
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    const updated = { ...config, keywords: [...config.keywords, newKeyword.trim()] };
    setConfig(updated);
    saveConfig(updated);
    setNewKeyword('');
  };

  const removeKeyword = (kw: string) => {
    const updated = { ...config, keywords: config.keywords.filter(k => k !== kw) };
    setConfig(updated);
    saveConfig(updated);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-accent/50 transition-colors"
        title="Intelligence Alerts"
      >
        {config.enabled ? (
          <Radio className="h-4 w-4 text-cyan-400" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center
                           rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Alert Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-12 w-[380px] max-h-[500px] z-50 overflow-hidden
                       rounded-xl border border-border bg-card shadow-2xl"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold">Intelligence Alerts</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 rounded hover:bg-accent/50"
                  title="Alert Settings"
                >
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={toggleEnabled}
                  className={`p-1.5 rounded ${config.enabled ? 'text-cyan-400 bg-cyan-500/10' : 'text-muted-foreground hover:bg-accent/50'}`}
                  title={config.enabled ? 'Disable alerts' : 'Enable alerts'}
                >
                  {config.enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setShowPanel(false)} className="p-1.5 rounded hover:bg-accent/50">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border overflow-hidden"
                >
                  <div className="px-4 py-3 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">MONITORED KEYWORDS</label>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {config.keywords.map(kw => (
                          <span key={kw} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                                                     bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {kw}
                            <button onClick={() => removeKeyword(kw)} className="hover:text-red-400">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={newKeyword}
                          onChange={e => setNewKeyword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addKeyword()}
                          placeholder="Add keyword..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background
                                     focus:outline-none focus:border-cyan-500/50"
                        />
                        <button onClick={addKeyword} className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/10 text-cyan-400
                                                                    border border-cyan-500/20 hover:bg-cyan-500/20">
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Check every</label>
                      <select
                        value={config.checkIntervalMinutes}
                        onChange={e => {
                          const updated = { ...config, checkIntervalMinutes: Number(e.target.value) };
                          setConfig(updated);
                          saveConfig(updated);
                        }}
                        className="px-2 py-1 text-xs rounded border border-border bg-background"
                      >
                        <option value={5}>5 min</option>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={60}>1 hour</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Sound notifications</label>
                      <button
                        onClick={() => {
                          const updated = { ...config, soundEnabled: !config.soundEnabled };
                          setConfig(updated);
                          saveConfig(updated);
                        }}
                        className={`w-10 h-5 rounded-full transition-colors ${config.soundEnabled ? 'bg-cyan-500' : 'bg-zinc-600'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications List */}
            <div className="max-h-[320px] overflow-y-auto">
              {!config.enabled ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <BellOff className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Alerts are disabled</p>
                  <button onClick={toggleEnabled} className="mt-2 text-cyan-400 text-xs hover:underline">
                    Enable alerts
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Radio className="h-8 w-8 mx-auto mb-2 opacity-30 animate-pulse" />
                  <p>Monitoring {config.keywords.length} keywords...</p>
                  <p className="text-xs mt-1 opacity-60">Checking every {config.checkIntervalMinutes} min</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-accent/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full ${
                              n.article.sentiment === 'negative' ? 'bg-red-500' :
                              n.article.sentiment === 'positive' ? 'bg-green-500' : 'bg-cyan-500'
                            }`} />
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 rounded">
                              {n.matchedKeyword}
                            </span>
                            {n.article.prophecyRelated && (
                              <span className="text-[10px] font-mono text-amber-400">✝</span>
                            )}
                          </div>
                          <h4 className="text-xs font-medium leading-snug line-clamp-2">{n.article.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span>{n.article.source}</span>
                            <span>{new Date(n.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {n.article.prophecyRef && (
                            <div className="mt-1 text-[10px] text-amber-300/70 italic">{n.article.prophecyRef}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={n.article.url} target="_blank" rel="noopener noreferrer"
                             className="p-1 rounded hover:bg-accent/50">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                          <button onClick={() => dismissNotification(n.id)} className="p-1 rounded hover:bg-accent/50">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
              <Link href="/intelligence" className="text-xs text-cyan-400 hover:underline"
                    onClick={() => setShowPanel(false)}>
                Open Intelligence Dashboard
              </Link>
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
