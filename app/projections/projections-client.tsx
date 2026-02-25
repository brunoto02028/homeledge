'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard, Target,
  Plus, Trash2, Pencil, Check, X, Loader2, ArrowUpRight, ArrowDownRight,
  CalendarDays, Banknote, BarChart3, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';

interface BudgetItem {
  id: string;
  categoryId: string;
  amount: number;
  period: string;
  category: { id: string; name: string; type: string; color: string | null };
  currentSpending: number;
  monthlyBillAmount: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

interface DebtItem {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate: number;
}

export function ProjectionsClient() {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [savingsForm, setSavingsForm] = useState({ name: '', targetAmount: '', currentAmount: '', deadline: '' });
  const [debtForm, setDebtForm] = useState({ name: '', totalAmount: '', remainingAmount: '', monthlyPayment: '', interestRate: '' });

  const fetchData = useCallback(async () => {
    try {
      const [budgetRes, txRes, goalsRes, debtsRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/reports?type=monthly-summary'),
        fetch('/api/savings-goals'),
        fetch('/api/debts'),
      ]);

      if (budgetRes.ok) setBudgets(await budgetRes.json());
      if (goalsRes.ok) setSavingsGoals(await goalsRes.json());
      if (debtsRes.ok) setDebts(await debtsRes.json());

      if (txRes.ok) {
        const reportData = await txRes.json();
        if (reportData.monthlySummary) {
          setMonthlyData(reportData.monthlySummary.slice(-6));
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load financial data', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Computed metrics
  const totalMonthlyIncome = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    return monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length;
  }, [monthlyData]);

  const totalMonthlyExpenses = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    return monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;
  }, [monthlyData]);

  const monthlyNet = totalMonthlyIncome - totalMonthlyExpenses;

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.currentSpending + b.monthlyBillAmount, 0);
  const budgetUsage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalDebtRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalDebtPayments = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);

  const handleAddSavingsGoal = async () => {
    if (!savingsForm.name || !savingsForm.targetAmount) return;
    try {
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savingsForm),
      });
      if (res.ok) {
        const goal = await res.json();
        setSavingsGoals(prev => [...prev, goal]);
        setSavingsForm({ name: '', targetAmount: '', currentAmount: '', deadline: '' });
        setShowSavingsForm(false);
      }
    } catch { toast({ title: 'Failed to save goal', variant: 'destructive' }); }
  };

  const handleAddDebt = async () => {
    if (!debtForm.name || !debtForm.totalAmount) return;
    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtForm),
      });
      if (res.ok) {
        const debt = await res.json();
        setDebts(prev => [...prev, debt]);
        setDebtForm({ name: '', totalAmount: '', remainingAmount: '', monthlyPayment: '', interestRate: '' });
        setShowDebtForm(false);
      }
    } catch { toast({ title: 'Failed to save debt', variant: 'destructive' }); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-blue-700" />
          {t('projections.title')}
        </h2>
        <p className="text-muted-foreground mt-1">{t('projections.subtitle')}</p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Monthly Income</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">£{totalMonthlyIncome.toFixed(0)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">£{totalMonthlyExpenses.toFixed(0)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Net</p>
                <p className={`text-2xl font-bold ${monthlyNet >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  £{monthlyNet.toFixed(0)}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${monthlyNet >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <Wallet className={`h-5 w-5 ${monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">12-Month Forecast</p>
                <p className={`text-2xl font-bold ${monthlyNet >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  £{(monthlyNet * 12).toFixed(0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Bar Chart (text-based) */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Monthly Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((m) => {
                const maxVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)));
                const incWidth = maxVal > 0 ? (m.income / maxVal) * 100 : 0;
                const expWidth = maxVal > 0 ? (m.expenses / maxVal) * 100 : 0;
                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium w-20">{m.month}</span>
                      <span className={`text-xs font-medium ${m.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Net: £{m.net.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${incWidth}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-green-700 dark:text-green-400 w-16 text-right">£{m.income.toFixed(0)}</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${expWidth}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-red-700 dark:text-red-400 w-16 text-right">£{m.expenses.toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Tracking */}
      {budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-blue-600" />
                Budget Tracking
              </span>
              <span className={`text-sm font-medium ${budgetUsage > 100 ? 'text-red-600' : budgetUsage > 80 ? 'text-orange-600' : 'text-green-600'}`}>
                {budgetUsage.toFixed(0)}% used
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.map((b) => {
                const spent = b.currentSpending + b.monthlyBillAmount;
                const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                const isOver = pct > 100;
                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium border-border">{b.category.name}</span>
                      <span className={isOver ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                        £{spent.toFixed(0)} / £{b.amount.toFixed(0)}
                        {isOver && <AlertTriangle className="h-3.5 w-3.5 inline ml-1" />}
                      </span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className={`h-2 ${isOver ? '[&>div]:bg-red-500' : pct > 80 ? '[&>div]:bg-orange-500' : ''}`} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-pink-600" />
              Savings Goals
              {totalSavingsCurrent > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  £{totalSavingsCurrent.toFixed(0)} / £{totalSavingsTarget.toFixed(0)}
                </span>
              )}
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowSavingsForm(!showSavingsForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add Goal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSavingsForm && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-pink-50 rounded-lg">
              <Input placeholder="Goal name" value={savingsForm.name} onChange={(e) => setSavingsForm({ ...savingsForm, name: e.target.value })} />
              <Input type="number" placeholder="Target £" value={savingsForm.targetAmount} onChange={(e) => setSavingsForm({ ...savingsForm, targetAmount: e.target.value })} />
              <Input type="number" placeholder="Current £" value={savingsForm.currentAmount} onChange={(e) => setSavingsForm({ ...savingsForm, currentAmount: e.target.value })} />
              <div className="flex gap-2">
                <Input type="date" value={savingsForm.deadline} onChange={(e) => setSavingsForm({ ...savingsForm, deadline: e.target.value })} />
                <Button size="sm" onClick={handleAddSavingsGoal}><Check className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {savingsGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No savings goals yet. Add one to start tracking!</p>
          ) : (
            <div className="space-y-4">
              {savingsGoals.map((goal) => {
                const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                const monthsLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000))) : null;
                const remaining = goal.targetAmount - goal.currentAmount;
                const monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-foreground">{goal.name}</span>
                        {monthlyNeeded !== null && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (need £{monthlyNeeded.toFixed(0)}/mo for {monthsLeft} months)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          £{goal.currentAmount.toFixed(0)} / £{goal.targetAmount.toFixed(0)}
                        </span>
                        <button onClick={async () => { await fetch(`/api/savings-goals/${goal.id}`, { method: 'DELETE' }); setSavingsGoals(prev => prev.filter(g => g.id !== goal.id)); }} className="text-muted-foreground/60 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-3 [&>div]:bg-pink-500" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debt Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              Debt Tracker
              {totalDebtRemaining > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  £{totalDebtRemaining.toFixed(0)} remaining
                </span>
              )}
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowDebtForm(!showDebtForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add Debt
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showDebtForm && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 p-3 bg-orange-50 rounded-lg">
              <Input placeholder="Debt name" value={debtForm.name} onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })} />
              <Input type="number" placeholder="Total £" value={debtForm.totalAmount} onChange={(e) => setDebtForm({ ...debtForm, totalAmount: e.target.value })} />
              <Input type="number" placeholder="Remaining £" value={debtForm.remainingAmount} onChange={(e) => setDebtForm({ ...debtForm, remainingAmount: e.target.value })} />
              <Input type="number" placeholder="Monthly £" value={debtForm.monthlyPayment} onChange={(e) => setDebtForm({ ...debtForm, monthlyPayment: e.target.value })} />
              <div className="flex gap-2">
                <Input type="number" placeholder="Rate %" value={debtForm.interestRate} onChange={(e) => setDebtForm({ ...debtForm, interestRate: e.target.value })} />
                <Button size="sm" onClick={handleAddDebt}><Check className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {debts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No debts tracked. Add any loans, credit cards, or mortgages.</p>
          ) : (
            <div className="space-y-4">
              {debts.map((debt) => {
                const paidPct = debt.totalAmount > 0 ? ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100 : 0;
                const monthsToPayoff = debt.monthlyPayment > 0 ? Math.ceil(debt.remainingAmount / debt.monthlyPayment) : null;
                return (
                  <div key={debt.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-foreground">{debt.name}</span>
                        {debt.interestRate > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">{debt.interestRate}% APR</span>
                        )}
                        {monthsToPayoff !== null && (
                          <span className="text-xs text-orange-600 ml-2">
                            ~{monthsToPayoff} months to payoff
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          £{(debt.totalAmount - debt.remainingAmount).toFixed(0)} paid / £{debt.totalAmount.toFixed(0)}
                        </span>
                        {debt.monthlyPayment > 0 && (
                          <span className="text-xs text-muted-foreground/60">£{debt.monthlyPayment.toFixed(0)}/mo</span>
                        )}
                        <button onClick={async () => { await fetch(`/api/debts/${debt.id}`, { method: 'DELETE' }); setDebts(prev => prev.filter(d => d.id !== debt.id)); }} className="text-muted-foreground/60 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <Progress value={Math.min(paidPct, 100)} className="h-3 [&>div]:bg-orange-500" />
                  </div>
                );
              })}
              {totalDebtPayments > 0 && (
                <div className="pt-2 border-t text-sm text-muted-foreground flex justify-between">
                  <span>Total monthly debt payments:</span>
                  <span className="font-medium text-orange-700">£{totalDebtPayments.toFixed(0)}/month</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
