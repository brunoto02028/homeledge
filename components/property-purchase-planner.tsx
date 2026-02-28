'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, TrendingUp,
  Home, Clock, Banknote, Brain, Target, Lightbulb, Building2, PiggyBank,
  Users, Wallet, BarChart3, Calendar, ArrowRight, Loader2, Plus, Trash2,
  Percent, CircleDollarSign, Landmark, LineChart, Shield, Sparkles, X,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

interface AccountData {
  id: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  isActive: boolean;
  entityId: string | null;
  entity: { id: string; name: string; type: string; companyStatus: string | null } | null;
  provider: { id: string; name: string; logoUrl: string | null };
}

interface EntityData {
  id: string;
  name: string;
  type: string;
  taxRegime: string;
  isDefault: boolean;
  _count: { bankStatements: number; accounts: number };
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface SavingsGoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

interface DebtData {
  id: string;
  name: string;
  type: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number | null;
  monthlyPayment: number | null;
  isActive: boolean;
}

interface Investment {
  id: string;
  name: string;
  type: 'cash_isa' | 'stocks_shares_isa' | 'savings_account' | 'pension' | 'stocks' | 'crypto' | 'bonds' | 'company_retained' | 'other';
  owner: 'personal' | 'partner' | 'company';
  currentValue: number;
  monthlyContribution: number;
  annualReturnRate: number; // %
  dividendYield: number; // %
  reinvestDividends: boolean;
}

interface PlannerConfig {
  targetPrice: number;
  depositPercent: number;
  timelineMonths: number;
  partnerIncome: number;
  partnerMonthlySavings: number;
  additionalMonthlySavings: number;
  monthlyExpenseCuts: number;
}

const defaultConfig: PlannerConfig = {
  targetPrice: 300000,
  depositPercent: 10,
  timelineMonths: 36,
  partnerIncome: 0,
  partnerMonthlySavings: 0,
  additionalMonthlySavings: 0,
  monthlyExpenseCuts: 0,
};

const defaultInvestment: Omit<Investment, 'id'> = {
  name: '', type: 'savings_account', owner: 'personal',
  currentValue: 0, monthlyContribution: 0, annualReturnRate: 4,
  dividendYield: 0, reinvestDividends: true,
};

const INVESTMENT_TYPES: { value: Investment['type']; label: string; defaultRate: number; defaultDividend: number }[] = [
  { value: 'cash_isa', label: 'Cash ISA', defaultRate: 4.5, defaultDividend: 0 },
  { value: 'stocks_shares_isa', label: 'Stocks & Shares ISA', defaultRate: 7, defaultDividend: 2 },
  { value: 'savings_account', label: 'Savings Account', defaultRate: 4.2, defaultDividend: 0 },
  { value: 'pension', label: 'Pension (SIPP/Workplace)', defaultRate: 6, defaultDividend: 0 },
  { value: 'stocks', label: 'Individual Stocks', defaultRate: 8, defaultDividend: 2.5 },
  { value: 'bonds', label: 'Bonds / Gilts', defaultRate: 4, defaultDividend: 3 },
  { value: 'crypto', label: 'Cryptocurrency', defaultRate: 10, defaultDividend: 0 },
  { value: 'company_retained', label: 'Company Retained Profits', defaultRate: 3, defaultDividend: 0 },
  { value: 'other', label: 'Other Investment', defaultRate: 5, defaultDividend: 0 },
];

const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
const fmtDec = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ──────────────────────────────────────────────────────────────────
// Compound Interest Engine
// ──────────────────────────────────────────────────────────────────

function projectInvestment(inv: Investment, months: number): { values: number[]; totalDividends: number; totalGrowth: number } {
  const monthlyRate = inv.annualReturnRate / 100 / 12;
  const monthlyDivRate = inv.dividendYield / 100 / 12;
  const values: number[] = [];
  let balance = inv.currentValue;
  let totalDividends = 0;
  let totalGrowth = 0;

  for (let m = 0; m < months; m++) {
    // Capital growth
    const growth = balance * monthlyRate;
    totalGrowth += growth;
    balance += growth;

    // Dividends
    const dividend = balance * monthlyDivRate;
    totalDividends += dividend;
    if (inv.reinvestDividends) {
      balance += dividend;
    }

    // Monthly contribution
    balance += inv.monthlyContribution;
    values.push(balance);
  }

  return { values, totalDividends, totalGrowth };
}

function projectAllInvestments(investments: Investment[], months: number) {
  let totalCurrent = 0;
  let totalFinalValue = 0;
  let totalContributions = 0;
  let totalGrowth = 0;
  let totalDividends = 0;
  const monthlyTotals = new Array(months).fill(0);

  const details = investments.map(inv => {
    const proj = projectInvestment(inv, months);
    const finalValue = proj.values[months - 1] || inv.currentValue;
    totalCurrent += inv.currentValue;
    totalFinalValue += finalValue;
    totalContributions += inv.monthlyContribution * months;
    totalGrowth += proj.totalGrowth;
    totalDividends += proj.totalDividends;
    proj.values.forEach((v, i) => { monthlyTotals[i] += v; });
    return { ...inv, finalValue, growth: proj.totalGrowth, dividends: proj.totalDividends };
  });

  return { details, totalCurrent, totalFinalValue, totalContributions, totalGrowth, totalDividends, monthlyTotals };
}

// ──────────────────────────────────────────────────────────────────
// Cross-Entity Intelligence
// ──────────────────────────────────────────────────────────────────

interface EntityAnalysis {
  entity: EntityData;
  accounts: AccountData[];
  totalBalance: number;
  isCompany: boolean;
  strategies: { title: string; detail: string; impact: string; risk: string }[];
}

function analyseEntities(entities: EntityData[], accounts: AccountData[]): EntityAnalysis[] {
  return entities.map(e => {
    const entityAccounts = accounts.filter(a => a.entityId === e.id);
    const totalBalance = entityAccounts.reduce((s, a) => s + (a.accountType !== 'credit_card' ? a.balance : 0), 0);
    const isCompany = e.type === 'limited_company' || e.type === 'llp';
    const strategies: EntityAnalysis['strategies'] = [];

    if (isCompany) {
      if (totalBalance > 10000) {
        strategies.push({
          title: 'Dividend Extraction for Deposit',
          detail: `${e.name} has ${fmt(totalBalance)} available. You can extract dividends tax-efficiently. 2025/26: £1,000 dividend allowance tax-free, then 8.75% (basic), 33.75% (higher), 39.35% (additional).`,
          impact: `Could contribute ${fmt(Math.round(totalBalance * 0.7))} after corporation tax provisions towards deposit.`,
          risk: 'Must leave enough for Corporation Tax (25% on profits >£250k, 19% if <£50k). Don\'t strip the company of working capital.',
        });
      }
      strategies.push({
        title: 'Purchase via SPV (Special Purpose Vehicle)',
        detail: `If buying as a buy-to-let investment, ${e.name} or a new SPV company could purchase the property directly. Mortgage interest is fully deductible against Corporation Tax.`,
        impact: 'Corporation Tax at 19-25% vs personal income tax at 20-45%. Section 24 doesn\'t apply to companies.',
        risk: 'Higher mortgage rates (+1-2%), 3% SDLT surcharge, ATED charges for properties over £500k. Need specialist mortgage.',
      });
      if (totalBalance > 5000) {
        strategies.push({
          title: 'Director\'s Loan for Deposit',
          detail: `You can loan yourself money from ${e.name} as a director\'s loan. Must be repaid within 9 months of company year-end to avoid Section 455 tax (33.75%).`,
          impact: `Could access up to ${fmt(totalBalance)} temporarily. Tax-free if repaid on time.`,
          risk: 'S.455 tax if not repaid. Counts as a benefit-in-kind if over £10,000 (taxed at official rate 2.25%). Reduces company cash flow.',
        });
      }
      strategies.push({
        title: 'Salary vs Dividend Optimisation',
        detail: `For mortgage applications, lenders prefer higher salary. But salary has higher NI costs. Optimal 2025/26: salary to £12,570 (personal allowance) + dividends.`,
        impact: 'Higher salary = higher mortgage multiplier. But dividend route saves ~£2,000-5,000/year in NI.',
        risk: 'If salary too low, some lenders won\'t approve large mortgages. Balance tax efficiency with mortgage needs.',
      });
    } else {
      if (totalBalance > 5000) {
        strategies.push({
          title: 'Personal Savings Allocation',
          detail: `${e.name} accounts hold ${fmt(totalBalance)}. Consider maximising ISA allowance (£20,000/year) for tax-free growth.`,
          impact: `ISA returns are completely tax-free. At 4.5% interest, ${fmt(totalBalance)} could grow to ${fmt(Math.round(totalBalance * 1.045))} in 1 year.`,
          risk: 'Cash ISA rates can drop. Consider Lifetime ISA (£4,000/year, 25% government bonus) if first-time buyer under 40.',
        });
      }
    }
    return { entity: e, accounts: entityAccounts, totalBalance, isCompany, strategies };
  });
}

// ──────────────────────────────────────────────────────────────────
// Readiness Score
// ──────────────────────────────────────────────────────────────────

interface ReadinessResult {
  score: number;
  label: string;
  factors: { name: string; score: number; max: number; detail: string }[];
}

function calcReadiness(
  totalSavings: number, depositTarget: number, avgMonthlyNet: number,
  debts: DebtData[], investmentTotal: number, monthsOfData: number,
  incomeConsistency: number,
): ReadinessResult {
  const factors: ReadinessResult['factors'] = [];

  // 1. Deposit Progress (0-25)
  const depositPct = Math.min(totalSavings / Math.max(depositTarget, 1), 1);
  const depositScore = Math.round(depositPct * 25);
  factors.push({ name: 'Deposit Progress', score: depositScore, max: 25, detail: `${fmt(totalSavings)} of ${fmt(depositTarget)} (${(depositPct * 100).toFixed(0)}%)` });

  // 2. Savings Rate (0-20)
  const monthlySavingsRate = avgMonthlyNet > 0 ? 1 : 0;
  const savingsScore = avgMonthlyNet > 500 ? 20 : avgMonthlyNet > 200 ? 15 : avgMonthlyNet > 0 ? 10 : 0;
  factors.push({ name: 'Monthly Savings Rate', score: savingsScore, max: 20, detail: avgMonthlyNet > 0 ? `${fmt(avgMonthlyNet)}/month net surplus` : 'No net surplus — spending exceeds income' });

  // 3. Debt Level (0-20)
  const totalDebt = debts.filter(d => d.isActive).reduce((s, d) => s + d.remainingAmount, 0);
  const debtScore = totalDebt === 0 ? 20 : totalDebt < 5000 ? 15 : totalDebt < 15000 ? 10 : totalDebt < 30000 ? 5 : 0;
  factors.push({ name: 'Debt Level', score: debtScore, max: 20, detail: totalDebt === 0 ? 'Debt-free — excellent position' : `${fmt(totalDebt)} outstanding debt` });

  // 4. Income Stability (0-15)
  const stabilityScore = monthsOfData >= 6 ? (incomeConsistency > 0.8 ? 15 : incomeConsistency > 0.5 ? 10 : 5) : 3;
  factors.push({ name: 'Income Stability', score: stabilityScore, max: 15, detail: monthsOfData >= 6 ? `${monthsOfData} months of data, ${(incomeConsistency * 100).toFixed(0)}% consistency` : 'Insufficient data — need 6+ months of transactions' });

  // 5. Investment / Emergency Fund (0-10)
  const emergencyMonths = avgMonthlyNet > 0 ? investmentTotal / (avgMonthlyNet + 500) : 0;
  const investScore = emergencyMonths >= 6 ? 10 : emergencyMonths >= 3 ? 7 : emergencyMonths >= 1 ? 4 : 0;
  factors.push({ name: 'Emergency Fund / Investments', score: investScore, max: 10, detail: investmentTotal > 0 ? `${fmt(investmentTotal)} in investments (${emergencyMonths.toFixed(1)} months buffer)` : 'No investment buffer yet' });

  // 6. Emergency Fund (0-10)
  const efScore = totalSavings > depositTarget * 1.1 ? 10 : totalSavings > depositTarget ? 7 : 3;
  factors.push({ name: 'Buffer Above Deposit', score: efScore, max: 10, detail: totalSavings > depositTarget ? `${fmt(totalSavings - depositTarget)} above deposit target for fees/moving costs` : 'No buffer above deposit yet — budget £3-5k for legal fees, surveys, moving' });

  const total = factors.reduce((s, f) => s + f.score, 0);
  const label = total >= 80 ? 'Ready to Buy' : total >= 60 ? 'Nearly Ready' : total >= 40 ? 'Making Progress' : total >= 20 ? 'Early Stage' : 'Just Starting';

  return { score: total, label, factors };
}

// ──────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────

export function PropertyPurchasePlanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'investments' | 'entities' | 'plan' | 'timeline'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Real data from APIs
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalData[]>([]);
  const [debts, setDebts] = useState<DebtData[]>([]);

  // User inputs
  const [config, setConfig] = useState<PlannerConfig>(defaultConfig);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showInvForm, setShowInvForm] = useState(false);
  const [invForm, setInvForm] = useState<Omit<Investment, 'id'>>(defaultInvestment);

  const setConf = (key: keyof PlannerConfig, val: string) =>
    setConfig(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, entRes, repRes, goalRes, debtRes] = await Promise.all([
        fetch('/api/accounts'), fetch('/api/entities'),
        fetch('/api/reports?type=monthly-summary'),
        fetch('/api/savings-goals'), fetch('/api/debts'),
      ]);
      if (accRes.ok) setAccounts(await accRes.json());
      if (entRes.ok) setEntities(await entRes.json());
      if (goalRes.ok) setSavingsGoals(await goalRes.json());
      if (debtRes.ok) setDebts(await debtRes.json());
      if (repRes.ok) {
        const r = await repRes.json();
        if (r.monthlySummary) setMonthlyData(r.monthlySummary.slice(-12));
      }
      setDataLoaded(true);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (isOpen && !dataLoaded) fetchData(); }, [isOpen, dataLoaded, fetchData]);

  // ── Computed from real data ──
  const personalAccounts = useMemo(() => accounts.filter(a => a.isActive && (!a.entity || a.entity.type === 'individual' || a.entity.type === 'sole_trader')), [accounts]);
  const companyAccounts = useMemo(() => accounts.filter(a => a.isActive && a.entity && (a.entity.type === 'limited_company' || a.entity.type === 'llp')), [accounts]);

  const personalBalance = useMemo(() => personalAccounts.reduce((s, a) => s + (a.accountType !== 'credit_card' ? a.balance : 0), 0), [personalAccounts]);
  const companyBalance = useMemo(() => companyAccounts.reduce((s, a) => s + (a.accountType !== 'credit_card' ? a.balance : 0), 0), [companyAccounts]);
  const totalBalance = personalBalance + companyBalance;

  const savingsBalance = useMemo(() => accounts.filter(a => a.isActive && a.accountType === 'savings').reduce((s, a) => s + a.balance, 0), [accounts]);

  const avgMonthlyIncome = useMemo(() => monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.income, 0) / monthlyData.length : 0, [monthlyData]);
  const avgMonthlyExpenses = useMemo(() => monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length : 0, [monthlyData]);
  const avgMonthlyNet = avgMonthlyIncome - avgMonthlyExpenses;

  const incomeConsistency = useMemo(() => {
    if (monthlyData.length < 3) return 0;
    const incomes = monthlyData.map(m => m.income).filter(i => i > 0);
    if (incomes.length < 3) return 0;
    const avg = incomes.reduce((s, i) => s + i, 0) / incomes.length;
    const variance = incomes.reduce((s, i) => s + Math.pow(i - avg, 2), 0) / incomes.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 1 - (stdDev / avg));
  }, [monthlyData]);

  const totalDebts = useMemo(() => debts.filter(d => d.isActive).reduce((s, d) => s + d.remainingAmount, 0), [debts]);
  const totalDebtPayments = useMemo(() => debts.filter(d => d.isActive).reduce((s, d) => s + (d.monthlyPayment || 0), 0), [debts]);

  // ── Investment projections ──
  const depositTarget = config.targetPrice * (config.depositPercent / 100);
  const investProjection = useMemo(() => projectAllInvestments(investments, config.timelineMonths), [investments, config.timelineMonths]);

  // ── Total available for deposit ──
  const currentSavingsForDeposit = savingsBalance + savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const monthlySavingsCapacity = Math.max(0, avgMonthlyNet + config.partnerMonthlySavings + config.additionalMonthlySavings + config.monthlyExpenseCuts - totalDebtPayments);
  const projectedSavings = currentSavingsForDeposit + (monthlySavingsCapacity * config.timelineMonths);
  const projectedWithInvestments = projectedSavings + (investProjection.totalFinalValue - investProjection.totalCurrent);

  // ── Months to deposit ──
  const monthsToDeposit = useMemo(() => {
    if (currentSavingsForDeposit >= depositTarget) return 0;
    const gap = depositTarget - currentSavingsForDeposit;
    const monthlyGain = monthlySavingsCapacity + investments.reduce((s, inv) => {
      const monthlyReturn = inv.currentValue * (inv.annualReturnRate / 100 / 12);
      return s + inv.monthlyContribution + monthlyReturn;
    }, 0);
    if (monthlyGain <= 0) return Infinity;
    // Approximate with compound growth
    let balance = currentSavingsForDeposit;
    for (let m = 1; m <= 600; m++) {
      balance += monthlySavingsCapacity;
      investments.forEach(inv => {
        const monthlyRate = inv.annualReturnRate / 100 / 12;
        balance += inv.monthlyContribution + (balance * monthlyRate * (inv.currentValue / Math.max(balance, 1)));
      });
      if (balance >= depositTarget) return m;
    }
    return Infinity;
  }, [currentSavingsForDeposit, depositTarget, monthlySavingsCapacity, investments]);

  const targetDate = monthsToDeposit !== Infinity && monthsToDeposit > 0
    ? new Date(Date.now() + monthsToDeposit * 30 * 24 * 60 * 60 * 1000) : null;

  // ── Entity analysis ──
  const entityAnalysis = useMemo(() => analyseEntities(entities, accounts), [entities, accounts]);

  // ── Readiness ──
  const readiness = useMemo(() => calcReadiness(
    currentSavingsForDeposit, depositTarget, avgMonthlyNet,
    debts, investProjection.totalCurrent, monthlyData.length, incomeConsistency,
  ), [currentSavingsForDeposit, depositTarget, avgMonthlyNet, debts, investProjection.totalCurrent, monthlyData.length, incomeConsistency]);

  // ── Add investment ──
  const addInvestment = () => {
    if (!invForm.name) return;
    setInvestments(prev => [...prev, { ...invForm, id: crypto.randomUUID() }]);
    setInvForm(defaultInvestment);
    setShowInvForm(false);
  };

  const removeInvestment = (id: string) => setInvestments(prev => prev.filter(i => i.id !== id));

  // ── Milestones ──
  const milestones = useMemo(() => {
    const ms: { label: string; amount: number; monthsAway: number; date: string; done: boolean }[] = [];
    const targets = [
      { pct: 5, label: '5% Deposit' }, { pct: 10, label: '10% Deposit' },
      { pct: 15, label: '15% Deposit' }, { pct: 20, label: '20% Deposit' },
    ];
    targets.forEach(t => {
      const amt = config.targetPrice * (t.pct / 100);
      const done = currentSavingsForDeposit >= amt;
      let monthsAway = 0;
      if (!done && monthlySavingsCapacity > 0) {
        monthsAway = Math.ceil((amt - currentSavingsForDeposit) / monthlySavingsCapacity);
      }
      const d = new Date(Date.now() + monthsAway * 30 * 24 * 60 * 60 * 1000);
      ms.push({ label: t.label, amount: amt, monthsAway, date: done ? 'Achieved!' : d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), done });
    });
    // Extra milestones
    const fees = 5000;
    ms.push({ label: 'Deposit + Fees Buffer', amount: depositTarget + fees, monthsAway: 0, date: currentSavingsForDeposit >= depositTarget + fees ? 'Achieved!' : '—', done: currentSavingsForDeposit >= depositTarget + fees });
    return ms;
  }, [config.targetPrice, currentSavingsForDeposit, monthlySavingsCapacity, depositTarget]);

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'investments' as const, label: 'Investments', icon: LineChart },
    { id: 'entities' as const, label: 'Entity Strategy', icon: Building2 },
    { id: 'plan' as const, label: 'Savings Plan', icon: Target },
    { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
  ];

  const scoreColor = readiness.score >= 70 ? 'text-emerald-600' : readiness.score >= 45 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = readiness.score >= 70 ? 'from-emerald-500 to-green-600' : readiness.score >= 45 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600';

  return (
    <Card>
      <CardHeader>
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 w-full text-left">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Property Purchase Planner</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              AI-powered plan using your real financial data, investments &amp; entity strategy
            </p>
          </div>
          {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading your financial data...
            </div>
          )}

          {!loading && (
            <>
              {/* Config Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/30 border">
                <div className="space-y-1"><Label className="text-[11px]">Target Price (£)</Label><Input type="number" step="5000" value={config.targetPrice || ''} onChange={e => setConf('targetPrice', e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-[11px]">Deposit %</Label>
                  <Select value={String(config.depositPercent)} onValueChange={v => setConf('depositPercent', v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{[5, 10, 15, 20, 25].map(p => <SelectItem key={p} value={String(p)}>{p}% ({fmt(config.targetPrice * p / 100)})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-[11px]">Timeline (months)</Label><Input type="number" value={config.timelineMonths || ''} onChange={e => setConf('timelineMonths', e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-[11px]">Partner Monthly Savings (£)</Label><Input type="number" step="100" value={config.partnerMonthlySavings || ''} onChange={e => setConf('partnerMonthlySavings', e.target.value)} className="h-8 text-sm" placeholder="0" /></div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {tabs.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'}`}>
                      <Icon className="h-3.5 w-3.5" />{t.label}
                    </button>
                  );
                })}
              </div>

              {/* ═══ DASHBOARD TAB ═══ */}
              {activeTab === 'dashboard' && (
                <div className="space-y-4">
                  {/* Readiness Score */}
                  <div className="p-4 rounded-xl border text-center space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mortgage Readiness Score</p>
                    <div className="relative mx-auto w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                        <circle cx="60" cy="60" r="50" fill="none" stroke="url(#readGrad)" strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${readiness.score * 3.14} ${314 - readiness.score * 3.14}`} />
                        <defs><linearGradient id="readGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={readiness.score >= 70 ? '#10b981' : readiness.score >= 45 ? '#f59e0b' : '#ef4444'} />
                          <stop offset="100%" stopColor={readiness.score >= 70 ? '#059669' : readiness.score >= 45 ? '#d97706' : '#dc2626'} />
                        </linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${scoreColor}`}>{readiness.score}</span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <Badge className={`bg-gradient-to-r ${scoreBg} text-white border-0`}>{readiness.label}</Badge>
                  </div>

                  {/* Factor Breakdown */}
                  <div className="space-y-2">
                    {readiness.factors.map(f => (
                      <div key={f.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{f.name}</span>
                          <span className="text-muted-foreground">{f.score}/{f.max}</span>
                        </div>
                        <Progress value={(f.score / f.max) * 100} className="h-2" />
                        <p className="text-[11px] text-muted-foreground">{f.detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* Financial Snapshot */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Personal Balance', val: fmt(personalBalance), g: 'from-blue-500 to-indigo-600', icon: Wallet },
                      { label: 'Company Balance', val: fmt(companyBalance), g: 'from-emerald-500 to-green-600', icon: Building2 },
                      { label: 'Savings Accounts', val: fmt(savingsBalance), g: 'from-amber-500 to-orange-600', icon: PiggyBank },
                      { label: 'Avg Monthly Income', val: fmt(Math.round(avgMonthlyIncome)), g: 'from-cyan-500 to-blue-600', icon: TrendingUp },
                      { label: 'Avg Monthly Net', val: fmt(Math.round(avgMonthlyNet)), g: avgMonthlyNet >= 0 ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600', icon: Banknote },
                      { label: 'Total Debts', val: fmt(totalDebts), g: 'from-red-500 to-rose-600', icon: AlertTriangle },
                    ].map(c => {
                      const Icon = c.icon;
                      return (
                        <div key={c.label} className={`p-3 rounded-xl bg-gradient-to-br ${c.g} text-white`}>
                          <div className="flex items-center gap-1.5 mb-1"><Icon className="h-3 w-3 opacity-80" /><p className="text-[10px] opacity-80">{c.label}</p></div>
                          <p className="text-base font-bold">{c.val}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Deposit Progress */}
                  <div className="p-4 rounded-xl border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Deposit Target Progress</span>
                      <Badge variant="secondary">{fmt(depositTarget)}</Badge>
                    </div>
                    <Progress value={Math.min((currentSavingsForDeposit / Math.max(depositTarget, 1)) * 100, 100)} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Current: {fmt(currentSavingsForDeposit)}</span>
                      <span>Gap: {fmt(Math.max(0, depositTarget - currentSavingsForDeposit))}</span>
                    </div>
                    {monthsToDeposit > 0 && monthsToDeposit !== Infinity && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          Estimated <strong>{monthsToDeposit} months</strong> to reach deposit
                          {targetDate && <> (by <strong>{targetDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong>)</>}
                        </p>
                      </div>
                    )}
                    {monthsToDeposit === 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">You already have enough for the deposit!</p>
                      </div>
                    )}
                  </div>

                  {!dataLoaded && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300">Add your bank accounts, upload statements, and create entities to get accurate data-driven projections.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ INVESTMENTS TAB ═══ */}
              {activeTab === 'investments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold flex items-center gap-2"><LineChart className="h-4 w-4" /> Investment Portfolio &amp; Projections</p>
                    <Button size="sm" variant="outline" onClick={() => setShowInvForm(true)} className="text-xs h-7"><Plus className="h-3 w-3 mr-1" />Add Investment</Button>
                  </div>

                  <p className="text-xs text-muted-foreground">Add your investments (personal, partner, or company) to see compound growth projections towards your deposit.</p>

                  {/* Add Investment Form */}
                  {showInvForm && (
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Add Investment</span>
                        <button onClick={() => setShowInvForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1"><Label className="text-[11px]">Name</Label><Input className="h-8 text-sm" value={invForm.name} onChange={e => setInvForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Vanguard S&S ISA" /></div>
                        <div className="space-y-1"><Label className="text-[11px]">Type</Label>
                          <Select value={invForm.type} onValueChange={v => {
                            const t = INVESTMENT_TYPES.find(x => x.value === v);
                            setInvForm(p => ({ ...p, type: v as Investment['type'], annualReturnRate: t?.defaultRate || 5, dividendYield: t?.defaultDividend || 0 }));
                          }}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>{INVESTMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1"><Label className="text-[11px]">Owner</Label>
                          <Select value={invForm.owner} onValueChange={v => setInvForm(p => ({ ...p, owner: v as Investment['owner'] }))}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="personal">Personal</SelectItem>
                              <SelectItem value="partner">Partner</SelectItem>
                              <SelectItem value="company">Company</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1"><Label className="text-[11px]">Current Value (£)</Label><Input type="number" className="h-8 text-sm" value={invForm.currentValue || ''} onChange={e => setInvForm(p => ({ ...p, currentValue: parseFloat(e.target.value) || 0 }))} /></div>
                        <div className="space-y-1"><Label className="text-[11px]">Monthly Contribution (£)</Label><Input type="number" className="h-8 text-sm" value={invForm.monthlyContribution || ''} onChange={e => setInvForm(p => ({ ...p, monthlyContribution: parseFloat(e.target.value) || 0 }))} /></div>
                        <div className="space-y-1"><Label className="text-[11px]">Annual Return %</Label><Input type="number" step="0.1" className="h-8 text-sm" value={invForm.annualReturnRate || ''} onChange={e => setInvForm(p => ({ ...p, annualReturnRate: parseFloat(e.target.value) || 0 }))} /></div>
                        <div className="space-y-1"><Label className="text-[11px]">Dividend Yield %</Label><Input type="number" step="0.1" className="h-8 text-sm" value={invForm.dividendYield || ''} onChange={e => setInvForm(p => ({ ...p, dividendYield: parseFloat(e.target.value) || 0 }))} /></div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={invForm.reinvestDividends} onChange={e => setInvForm(p => ({ ...p, reinvestDividends: e.target.checked }))} className="rounded" />
                            Reinvest Dividends
                          </label>
                        </div>
                      </div>
                      <Button size="sm" onClick={addInvestment} className="text-xs">Add to Portfolio</Button>
                    </div>
                  )}

                  {/* Investment List */}
                  {investments.length > 0 && (
                    <div className="space-y-2">
                      {investProjection.details.map(inv => {
                        const typeInfo = INVESTMENT_TYPES.find(t => t.value === inv.type);
                        return (
                          <div key={inv.id} className="p-3 rounded-lg border flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <LineChart className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold">{inv.name}</span>
                                <Badge variant="secondary" className="text-[10px]">{typeInfo?.label}</Badge>
                                <Badge variant="outline" className="text-[10px]">{inv.owner}</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[11px]">
                                <div><span className="text-muted-foreground">Current:</span> <strong>{fmt(inv.currentValue)}</strong></div>
                                <div><span className="text-muted-foreground">Projected:</span> <strong className="text-emerald-600">{fmt(Math.round(inv.finalValue))}</strong></div>
                                <div><span className="text-muted-foreground">Growth:</span> <strong className="text-blue-600">{fmt(Math.round(inv.growth))}</strong></div>
                                <div><span className="text-muted-foreground">Dividends:</span> <strong className="text-purple-600">{fmt(Math.round(inv.dividends))}</strong></div>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {inv.annualReturnRate}% annual return + {inv.monthlyContribution > 0 ? `${fmt(inv.monthlyContribution)}/mo` : 'no'} contributions
                                {inv.dividendYield > 0 && ` + ${inv.dividendYield}% dividend yield${inv.reinvestDividends ? ' (reinvested)' : ''}`}
                              </p>
                            </div>
                            <button onClick={() => removeInvestment(inv.id)} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Investment Summary */}
                  {investments.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Current Value', val: fmt(investProjection.totalCurrent), g: 'from-blue-500 to-indigo-600' },
                        { label: `Projected (${config.timelineMonths}mo)`, val: fmt(Math.round(investProjection.totalFinalValue)), g: 'from-emerald-500 to-green-600' },
                        { label: 'Total Growth', val: fmt(Math.round(investProjection.totalGrowth)), g: 'from-purple-500 to-violet-600' },
                        { label: 'Total Dividends', val: fmt(Math.round(investProjection.totalDividends)), g: 'from-amber-500 to-orange-600' },
                      ].map(c => (
                        <div key={c.label} className={`p-3 rounded-xl bg-gradient-to-br ${c.g} text-white`}>
                          <p className="text-[10px] opacity-80">{c.label}</p>
                          <p className="text-base font-bold">{c.val}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {investments.length === 0 && !showInvForm && (
                    <div className="p-6 text-center rounded-xl border border-dashed">
                      <LineChart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No investments added yet. Add your savings accounts, ISAs, stocks, pension contributions, or company investments to see compound growth projections.</p>
                    </div>
                  )}

                  {/* Compound Interest Explainer */}
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 space-y-1">
                    <p className="text-xs font-semibold flex items-center gap-1"><Sparkles className="h-3 w-3 text-blue-600" /> How Compound Interest Accelerates Your Deposit</p>
                    <p className="text-[11px] text-blue-800 dark:text-blue-300">
                      Compound interest means you earn interest on your interest. For example, £10,000 at 5% annual return grows to £10,500 after year 1,
                      but to £11,025 after year 2 (earning on £10,500, not £10,000). With monthly contributions, the effect is even stronger.
                      Dividends, if reinvested, further accelerate growth through the same compounding mechanism.
                    </p>
                  </div>
                </div>
              )}

              {/* ═══ ENTITY STRATEGY TAB ═══ */}
              {activeTab === 'entities' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Cross-Entity Financial Strategy</p>
                  <p className="text-xs text-muted-foreground">Analysis of how your personal and company finances can work together for property purchase.</p>

                  {entityAnalysis.length === 0 && (
                    <div className="p-6 text-center rounded-xl border border-dashed">
                      <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No entities found. Add your personal entity and/or companies in the Entities page to get cross-entity strategies.</p>
                    </div>
                  )}

                  {entityAnalysis.map(ea => (
                    <div key={ea.entity.id} className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${ea.isCompany ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                          {ea.isCompany ? <Building2 className="h-4 w-4 text-white" /> : <Users className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{ea.entity.name}</span>
                            <Badge variant="secondary" className="text-[10px]">{ea.entity.type.replace('_', ' ')}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{ea.accounts.length} account(s) — Total: {fmt(ea.totalBalance)}</p>
                        </div>
                      </div>

                      {ea.accounts.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-4">
                          {ea.accounts.map(acc => (
                            <div key={acc.id} className="p-2 rounded-lg border text-xs">
                              <span className="font-medium">{acc.accountName}</span>
                              <div className="flex justify-between mt-1 text-muted-foreground">
                                <span>{acc.accountType.replace('_', ' ')}</span>
                                <span className={`font-semibold ${acc.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtDec(acc.balance)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {ea.strategies.map((s, i) => (
                        <div key={i} className="ml-4 p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border space-y-2">
                          <p className="text-xs font-semibold flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5 text-amber-500" /> {s.title}</p>
                          <p className="text-[11px] text-muted-foreground">{s.detail}</p>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-900/20">
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">Impact:</span> <span className="text-emerald-800 dark:text-emerald-300">{s.impact}</span>
                            </div>
                            <div className="p-2 rounded bg-red-50 dark:bg-red-900/20">
                              <span className="font-medium text-red-700 dark:text-red-400">Risk:</span> <span className="text-red-800 dark:text-red-300">{s.risk}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* General Cross-Entity Tips */}
                  {entityAnalysis.some(e => e.isCompany) && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 space-y-1">
                      <p className="text-xs font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> Important: Tax Planning Warning</p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Extracting funds from a company for a property deposit has tax implications. Corporation Tax must be paid before dividends.
                        Director's loans have strict rules (S.455). Always consult an accountant before making significant extractions.
                        Source: <a href="https://www.gov.uk/tax-on-dividends" className="underline" target="_blank" rel="noopener noreferrer">GOV.UK — Tax on Dividends</a>,
                        <a href="https://www.gov.uk/directors-loans" className="underline ml-1" target="_blank" rel="noopener noreferrer">GOV.UK — Director's Loans</a>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ SAVINGS PLAN TAB ═══ */}
              {activeTab === 'plan' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4" /> Personalised Savings Plan</p>

                  {/* Scenario Inputs */}
                  <div className="p-3 rounded-lg border space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Adjust scenarios to see how changes impact your timeline:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="space-y-1"><Label className="text-[11px]">Additional Monthly Savings (£)</Label><Input type="number" step="50" className="h-8 text-sm" value={config.additionalMonthlySavings || ''} onChange={e => setConf('additionalMonthlySavings', e.target.value)} placeholder="e.g. 200" /></div>
                      <div className="space-y-1"><Label className="text-[11px]">Monthly Expense Cuts (£)</Label><Input type="number" step="50" className="h-8 text-sm" value={config.monthlyExpenseCuts || ''} onChange={e => setConf('monthlyExpenseCuts', e.target.value)} placeholder="e.g. 150" /></div>
                      <div className="space-y-1"><Label className="text-[11px]">Partner Annual Income (£)</Label><Input type="number" step="1000" className="h-8 text-sm" value={config.partnerIncome || ''} onChange={e => setConf('partnerIncome', e.target.value)} placeholder="0" /></div>
                    </div>
                  </div>

                  {/* Savings Breakdown */}
                  <div className="p-4 rounded-xl border space-y-3">
                    <p className="text-xs font-semibold">Monthly Savings Capacity</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Your avg monthly net income</span><span className="font-medium">{fmt(Math.round(avgMonthlyNet))}</span></div>
                      {config.partnerMonthlySavings > 0 && <div className="flex justify-between"><span className="text-muted-foreground">+ Partner monthly savings</span><span className="font-medium text-blue-600">+{fmt(config.partnerMonthlySavings)}</span></div>}
                      {config.additionalMonthlySavings > 0 && <div className="flex justify-between"><span className="text-muted-foreground">+ Additional savings effort</span><span className="font-medium text-emerald-600">+{fmt(config.additionalMonthlySavings)}</span></div>}
                      {config.monthlyExpenseCuts > 0 && <div className="flex justify-between"><span className="text-muted-foreground">+ Expense reductions</span><span className="font-medium text-emerald-600">+{fmt(config.monthlyExpenseCuts)}</span></div>}
                      {totalDebtPayments > 0 && <div className="flex justify-between"><span className="text-muted-foreground">- Debt payments</span><span className="font-medium text-red-600">-{fmt(totalDebtPayments)}</span></div>}
                      <div className="border-t pt-2 flex justify-between font-semibold"><span>Total monthly capacity</span><span className={monthlySavingsCapacity >= 0 ? 'text-emerald-600' : 'text-red-600'}>{fmt(Math.round(monthlySavingsCapacity))}</span></div>
                    </div>
                  </div>

                  {/* Projected Total */}
                  <div className="p-4 rounded-xl border space-y-3">
                    <p className="text-xs font-semibold">Projected Total in {config.timelineMonths} Months</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Current savings for deposit</span><span>{fmt(currentSavingsForDeposit)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">+ Monthly savings × {config.timelineMonths}</span><span>+{fmt(Math.round(monthlySavingsCapacity * config.timelineMonths))}</span></div>
                      {investments.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">+ Investment growth &amp; dividends</span><span className="text-purple-600">+{fmt(Math.round(investProjection.totalGrowth + investProjection.totalDividends))}</span></div>}
                      {investments.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">+ Investment contributions</span><span className="text-blue-600">+{fmt(Math.round(investProjection.totalContributions))}</span></div>}
                      <div className="border-t pt-2 flex justify-between font-semibold text-sm"><span>Projected Total</span><span className="text-emerald-600">{fmt(Math.round(projectedWithInvestments))}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Deposit target</span><span>{fmt(depositTarget)}</span></div>
                      <div className={`flex justify-between font-semibold ${projectedWithInvestments >= depositTarget ? 'text-emerald-600' : 'text-red-600'}`}>
                        <span>{projectedWithInvestments >= depositTarget ? 'Surplus' : 'Shortfall'}</span>
                        <span>{fmt(Math.abs(Math.round(projectedWithInvestments - depositTarget)))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Smart Suggestions */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Smart Suggestions</p>
                    {[
                      monthlySavingsCapacity < 200 && { text: 'Your monthly savings capacity is low. Consider reducing discretionary spending (dining out, subscriptions, entertainment) by £100-200/month.', icon: '💰' },
                      totalDebtPayments > 0 && { text: `You have ${fmt(totalDebtPayments)}/month in debt payments. Paying off debts first would free up cash for your deposit — consider the avalanche method (highest interest first).`, icon: '📉' },
                      investments.length === 0 && { text: 'You have no investments added. Even a savings account at 4-5% helps your money grow while you save for a deposit. Consider a Cash ISA for tax-free interest.', icon: '📈' },
                      currentSavingsForDeposit < depositTarget * 0.5 && config.timelineMonths <= 12 && { text: 'Your timeline is ambitious. Consider either extending to 24-36 months, targeting a cheaper property, or adding partner income.', icon: '⏰' },
                      personalBalance > 10000 && savingsBalance < personalBalance * 0.3 && { text: `You have ${fmt(personalBalance)} in current accounts but only ${fmt(savingsBalance)} in savings. Move idle cash to a high-interest savings account.`, icon: '🏦' },
                      companyBalance > 20000 && { text: `Your company has ${fmt(companyBalance)}. Consider extracting dividends tax-efficiently or using retained profits for a company property purchase.`, icon: '🏢' },
                      config.partnerMonthlySavings === 0 && config.partnerIncome === 0 && { text: 'If buying jointly, add your partner\'s savings contribution. Two incomes significantly increase affordability and reduce time to deposit.', icon: '👫' },
                    ].filter((x): x is { text: string; icon: string } => Boolean(x)).map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">{tip.icon}</span>
                        <p className="text-[11px] text-muted-foreground">{tip.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TIMELINE TAB ═══ */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Purchase Timeline &amp; Milestones</p>

                  {/* Milestones */}
                  <div className="space-y-2">
                    {milestones.map((ms, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${ms.done ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' : ''}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${ms.done ? 'bg-emerald-500' : 'bg-muted'}`}>
                          {ms.done ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Target className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{ms.label}</span>
                            <Badge variant="secondary" className="text-[10px]">{fmt(ms.amount)}</Badge>
                          </div>
                          {!ms.done && ms.monthsAway > 0 && (
                            <p className="text-[11px] text-muted-foreground">{ms.monthsAway} months away — {ms.date}</p>
                          )}
                        </div>
                        {ms.done && <Badge className="bg-emerald-500 text-white text-[10px] border-0">Achieved</Badge>}
                      </div>
                    ))}
                  </div>

                  {/* Action Timeline */}
                  <div className="p-4 rounded-xl border space-y-4">
                    <p className="text-xs font-semibold">Recommended Action Timeline</p>
                    {[
                      { month: 'Now', actions: ['Open a Cash ISA or LISA (if under 40, first-time buyer)', 'Check credit score with all 3 agencies (free)', 'Register on electoral roll', 'Set up standing order for monthly deposit savings'], color: 'from-blue-500 to-indigo-600' },
                      { month: 'Month 1-3', actions: ['Pay down any high-interest debts', 'Cut unnecessary subscriptions', 'Get 3 months of payslips organised', 'If self-employed: ensure SA302 / accounts are up to date'], color: 'from-cyan-500 to-blue-600' },
                      { month: 'Month 3-6', actions: ['Review investment portfolio performance', 'Research areas and property types', 'Get a Mortgage in Principle (doesn\'t commit you)', 'Avoid any new credit applications'], color: 'from-emerald-500 to-green-600' },
                      { month: `Month ${Math.max(6, monthsToDeposit === Infinity ? 12 : monthsToDeposit - 3)}-${monthsToDeposit === Infinity ? '...' : monthsToDeposit}`, actions: ['Instruct a solicitor/conveyancer', 'Arrange building survey / valuation', 'Finalise mortgage application', 'Exchange and complete!'], color: 'from-purple-500 to-violet-600' },
                    ].map((phase, i) => (
                      <div key={i} className="flex gap-3">
                        <div className={`w-1 rounded-full bg-gradient-to-b ${phase.color} flex-shrink-0`} />
                        <div>
                          <p className="text-xs font-semibold">{phase.month}</p>
                          <ul className="mt-1 space-y-0.5">
                            {phase.actions.map((a, j) => (
                              <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground/50" />{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Card */}
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${scoreBg} text-white text-center space-y-1`}>
                    <p className="text-xs opacity-90">Based on your current trajectory</p>
                    {monthsToDeposit > 0 && monthsToDeposit !== Infinity && targetDate && (
                      <p className="text-lg font-bold">You could be a homeowner by {targetDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                    )}
                    {monthsToDeposit === 0 && <p className="text-lg font-bold">You&apos;re ready to start the buying process!</p>}
                    {monthsToDeposit === Infinity && <p className="text-lg font-bold">Increase savings or adjust your target to set a date</p>}
                    <p className="text-[11px] opacity-80">Target: {fmt(config.targetPrice)} property with {config.depositPercent}% deposit ({fmt(depositTarget)})</p>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground">
                        Projections are estimates based on current data and assumed constant returns. Investment values can go down as well as up.
                        Past performance is not a reliable indicator of future results. This is not financial advice — consult a qualified financial adviser for personalised guidance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
