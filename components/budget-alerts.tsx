'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface BudgetData {
  category: { name: string };
  amount: number;
  currentSpending: number;
  percentageUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export function BudgetAlerts() {
  const { toast } = useToast();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkBudgets = async () => {
      try {
        const res = await fetch('/api/budgets');
        if (!res.ok) return;
        const budgets: BudgetData[] = await res.json();

        const overBudget = budgets.filter(b => b.isOverBudget);
        const nearLimit = budgets.filter(b => b.isNearLimit);

        if (overBudget.length > 0) {
          toast({
            title: `${overBudget.length} budget(s) exceeded`,
            description: overBudget.map(b => `${b.category?.name}: £${b.currentSpending.toFixed(0)} / £${b.amount.toFixed(0)} (${b.percentageUsed.toFixed(0)}%)`).join(', '),
            variant: 'destructive',
          });
        }

        if (nearLimit.length > 0) {
          toast({
            title: `${nearLimit.length} budget(s) nearing limit`,
            description: nearLimit.map(b => `${b.category?.name}: ${b.percentageUsed.toFixed(0)}% used`).join(', '),
          });
        }
      } catch {
        // Silently fail - budget alerts are non-critical
      }
    };

    // Delay check so it doesn't block initial page load
    const timer = setTimeout(checkBudgets, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  return null;
}
