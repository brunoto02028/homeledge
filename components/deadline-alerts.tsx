'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Calendar, CheckCircle, ExternalLink, ArrowRight, CalendarClock } from 'lucide-react';

interface Deadline {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
  url?: string;
  daysUntil: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  overdue: { label: 'Overdue', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', icon: AlertTriangle },
  due_soon: { label: 'Due Soon', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', icon: Clock },
  upcoming: { label: 'Upcoming', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', icon: Calendar },
  completed: { label: 'Done', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
};

export function DeadlineAlerts({ limit = 5 }: { limit?: number }) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const year = new Date().getFullYear();
        const res = await fetch(`/api/tax-timeline?year=${year}`);
        if (res.ok) {
          const data = await res.json();
          // Show overdue + due_soon + next upcoming, sorted by urgency
          const urgent = (data.deadlines || [])
            .filter((d: Deadline) => d.status !== 'completed')
            .sort((a: Deadline, b: Deadline) => {
              const priority: Record<string, number> = { overdue: 0, due_soon: 1, upcoming: 2 };
              const pa = priority[a.status] ?? 3;
              const pb = priority[b.status] ?? 3;
              if (pa !== pb) return pa - pb;
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            })
            .slice(0, limit);
          setDeadlines(urgent);
        }
      } catch (error) {
        console.error('Error fetching deadlines:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeadlines();
  }, [limit]);

  if (loading || deadlines.length === 0) return null;

  const overdueCount = deadlines.filter(d => d.status === 'overdue').length;
  const dueSoonCount = deadlines.filter(d => d.status === 'due_soon').length;

  return (
    <Card className={overdueCount > 0 ? 'border-red-300 dark:border-red-800' : dueSoonCount > 0 ? 'border-amber-300 dark:border-amber-800' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Tax & Filing Deadlines
            {overdueCount > 0 && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">
                {overdueCount} overdue
              </Badge>
            )}
            {dueSoonCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs">
                {dueSoonCount} due soon
              </Badge>
            )}
          </CardTitle>
          <Link href="/tax-timeline" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {deadlines.map((d) => {
          const config = STATUS_CONFIG[d.status] || STATUS_CONFIG.upcoming;
          const Icon = config.icon;
          const dateStr = new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const daysText = d.daysUntil === 0 ? 'Today' : d.daysUntil === 1 ? 'Tomorrow' : d.daysUntil < 0 ? `${Math.abs(d.daysUntil)}d overdue` : `${d.daysUntil}d left`;

          return (
            <div key={d.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${config.bg}`}>
              <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">{dateStr}</p>
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${config.color}`}>
                {daysText}
              </span>
              {d.url && (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
