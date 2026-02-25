'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  CalendarClock, ChevronLeft, ChevronRight, ExternalLink, AlertTriangle,
  CheckCircle, Clock, Calendar, Building2, Receipt, Landmark, FileText,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

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

interface TimelineData {
  deadlines: Deadline[];
  year: number;
  hasCompany: boolean;
  hasSelfAssessment: boolean;
  isVatRegistered: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  self_assessment: { label: 'Self Assessment', icon: FileText, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  vat: { label: 'VAT', icon: Receipt, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  corporation_tax: { label: 'Corp Tax', icon: Building2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  paye: { label: 'PAYE', icon: Landmark, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  other: { label: 'Other', icon: Calendar, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', icon: AlertTriangle },
  due_soon: { label: 'Due Soon', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: Clock },
  upcoming: { label: 'Upcoming', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: Calendar },
  completed: { label: 'Done', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
};

export function TaxTimelineClient() {
  const { t } = useTranslation();
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tax-timeline?year=${year}`);
      if (res.ok) setData(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [year]);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const filtered = filterCategory === 'all'
    ? data.deadlines
    : data.deadlines.filter(d => d.category === filterCategory);

  const overdue = filtered.filter(d => d.status === 'overdue');
  const dueSoon = filtered.filter(d => d.status === 'due_soon');
  const upcoming = filtered.filter(d => d.status === 'upcoming');

  const monthGroups: Record<string, Deadline[]> = {};
  filtered.forEach(d => {
    const key = new Date(d.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
    if (!monthGroups[key]) monthGroups[key] = [];
    monthGroups[key].push(d);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-primary" />
            {t('taxTimeline.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('taxTimeline.subtitle')} {year}/{year + 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-16 text-center">{year}</span>
          <Button variant="outline" size="icon" onClick={() => setYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="self_assessment">Self Assessment</SelectItem>
              <SelectItem value="vat">VAT</SelectItem>
              <SelectItem value="corporation_tax">Corporation Tax</SelectItem>
              <SelectItem value="paye">PAYE</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {overdue.length > 0 && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdue.length}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{dueSoon.length}</p>
              <p className="text-xs text-muted-foreground">Due within 30 days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entity context */}
      <div className="flex flex-wrap gap-2 text-xs">
        {data.hasSelfAssessment && <Badge variant="secondary">Self Assessment</Badge>}
        {data.isVatRegistered && <Badge variant="secondary">VAT Registered</Badge>}
        {data.hasCompany && <Badge variant="secondary">Company / LLP</Badge>}
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(monthGroups).map(([month, deadlines]) => (
          <div key={month}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 sticky top-0 bg-background py-1 z-10">
              {month}
            </h3>
            <div className="space-y-3 relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              {deadlines.map((d) => {
                const catConfig = CATEGORY_CONFIG[d.category] || CATEGORY_CONFIG.other;
                const statusConfig = STATUS_CONFIG[d.status] || STATUS_CONFIG.upcoming;
                const CatIcon = catConfig.icon;
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={d.id} className="relative pl-12">
                    {/* Timeline dot */}
                    <div className={`absolute left-3 top-4 h-4 w-4 rounded-full border-2 border-background z-10 ${
                      d.status === 'overdue' ? 'bg-red-500' :
                      d.status === 'due_soon' ? 'bg-amber-500' :
                      'bg-blue-500'
                    }`} />

                    <Card className={`transition-all hover:shadow-md ${
                      d.status === 'overdue' ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' :
                      d.status === 'due_soon' ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' :
                      ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-[10px] ${catConfig.color}`}>
                                <CatIcon className="h-3 w-3 mr-1" />
                                {catConfig.label}
                              </Badge>
                              <Badge variant="outline" className={`text-[10px] ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {d.daysUntil < 0
                                  ? `${Math.abs(d.daysUntil)} days overdue`
                                  : d.daysUntil === 0
                                  ? 'Today'
                                  : `${d.daysUntil} days`}
                              </Badge>
                            </div>
                            <h4 className="font-semibold">{d.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{d.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          {d.url && (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No deadlines found for this filter</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
