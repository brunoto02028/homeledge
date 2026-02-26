'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ScoreComponent {
  name: string;
  score: number;
  weight: number;
  status: 'good' | 'warning' | 'danger';
  tip: string;
}

interface HealthData {
  score: number;
  grade: string;
  status: 'good' | 'warning' | 'danger';
  components: ScoreComponent[];
  summary: {
    income: number;
    expenses: number;
    savingsRate: number;
    totalTransactions: number;
    categorisedPercent: number;
    activeBills: number;
    overdueActions: number;
    budgetsActive: number;
  };
}

const STATUS_COLORS = {
  good: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

const STATUS_BG = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const GRADE_COLORS: Record<string, string> = {
  'A+': 'from-emerald-500 to-green-400',
  'A': 'from-emerald-500 to-teal-400',
  'B': 'from-blue-500 to-cyan-400',
  'C': 'from-amber-500 to-yellow-400',
  'D': 'from-orange-500 to-amber-400',
  'F': 'from-red-500 to-rose-400',
};

export function HealthScore() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health-score')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Financial Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Financial Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Circle */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${GRADE_COLORS[data.grade] || GRADE_COLORS['C']} flex items-center justify-center shadow-lg`}>
              <span className="text-xl font-bold text-white">{data.grade}</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.score}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
            <p className={`text-sm font-medium ${STATUS_COLORS[data.status]}`}>
              {data.status === 'good' ? 'Healthy' : data.status === 'warning' ? 'Needs Attention' : 'At Risk'}
            </p>
          </div>
        </div>

        {/* Component Bars */}
        <div className="space-y-2.5">
          {data.components.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.name}</span>
                <div className="flex items-center gap-1.5">
                  {c.status === 'good' && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                  {c.status === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                  {c.status === 'danger' && <Info className="h-3 w-3 text-red-500" />}
                  <span className={STATUS_COLORS[c.status]}>{c.score}</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${STATUS_BG[c.status]}`}
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{c.tip}</p>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <p className="text-lg font-semibold">
              {data.summary.savingsRate >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">{data.summary.savingsRate.toFixed(0)}%</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">{data.summary.savingsRate.toFixed(0)}%</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">Savings Rate</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <p className="text-lg font-semibold">{data.summary.categorisedPercent.toFixed(0)}%</p>
            <p className="text-[11px] text-muted-foreground">Categorised</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
