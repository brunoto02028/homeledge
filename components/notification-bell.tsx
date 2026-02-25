'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, FileText, Receipt, Upload, ListTodo, Calendar, ArrowLeftRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotifEvent {
  id: string;
  eventType: string;
  entityType: string;
  payload: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  'invoice': FileText,
  'bill': Receipt,
  'statement': Upload,
  'action': ListTodo,
  'life_event': Calendar,
  'transfer': ArrowLeftRight,
};

function getIcon(entityType: string) {
  const key = Object.keys(EVENT_ICONS).find(k => entityType.toLowerCase().includes(k));
  return key ? EVENT_ICONS[key] : Shield;
}

function formatEventTitle(e: NotifEvent): string {
  const type = e.eventType.replace(/\./g, ' ').replace(/_/g, ' ');
  const name = (e.payload as any)?.name || (e.payload as any)?.billName || (e.payload as any)?.title || '';
  return name ? `${type}: ${name}` : type;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [events, setEvents] = useState<NotifEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = () => {
    fetch('/api/notifications?limit=15')
      .then(r => r.json())
      .then(d => {
        setEvents(d.events || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    fetchNotifs();
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-popover border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              events.map((e) => {
                const Icon = getIcon(e.entityType);
                return (
                  <div
                    key={e.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors',
                      !e.readAt && 'bg-primary/5'
                    )}
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug', !e.readAt && 'font-medium')}>
                        {formatEventTitle(e)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(e.createdAt)}</p>
                    </div>
                    {!e.readAt && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
