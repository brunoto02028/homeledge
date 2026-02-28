"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { StatsCards } from "@/components/overview/stats-cards"
import { CategoryChart } from "@/components/overview/category-chart"
import { UpcomingBills } from "@/components/overview/upcoming-bills"
import { RecentActions } from "@/components/overview/recent-actions"
import { EventsFeed } from "@/components/events-feed"
import { HealthScore } from "@/components/health-score"
import { BudgetAlerts } from "@/components/budget-alerts"
import { DeadlineAlerts } from "@/components/deadline-alerts"
import { CurrencyConverter } from "@/components/currency-converter"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, User, UserPlus, FileSpreadsheet, Camera, FileText, Receipt, Upload, Plus, Landmark, AlertTriangle, Clock, ArrowRight } from "lucide-react"

import type { Bill, Action } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"

interface DashboardData {
  totalMonthly: number;
  billsMonthly: number;
  bankIncome: number;
  bankExpenses: number;
  currency: string;
  byCategory: { category: string; amount: number; color?: string }[];
  upcomingBills: (Bill & { nextDueDate?: string })[];
  recentActions: Action[];
  stats: {
    totalAccounts: number;
    activeBills: number;
    pendingActions: number;
    totalInvoices: number;
    totalBankTransactions: number;
  };
}

interface Entity {
  id: string;
  name: string;
  type: string;
  companyNumber?: string;
  utr?: string;
  isDefault: boolean;
  taxRegime: string;
  registeredAddress?: string;
  officers?: any;
  _count?: { bankStatements: number; accounts: number };
}

function useGreeting(): string {
  const { t } = useTranslation()
  const hour = new Date().getHours()
  if (hour < 12) return t('overview.goodMorning')
  if (hour < 18) return t('overview.goodAfternoon')
  return t('overview.goodEvening')
}

const ENTITY_TYPE_CONFIG: Record<string, { label: string; color: string; gradient: string; icon: any }> = {
  limited_company: { label: 'Ltd', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800', gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600', icon: Building2 },
  llp: { label: 'LLP', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800', gradient: 'bg-gradient-to-br from-violet-500 to-purple-600', icon: Building2 },
  sole_trader: { label: 'Sole Trader', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800', gradient: 'bg-gradient-to-br from-amber-500 to-orange-600', icon: User },
  partnership: { label: 'Partnership', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', gradient: 'bg-gradient-to-br from-emerald-500 to-green-600', icon: Building2 },
  individual: { label: 'Personal', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700', gradient: 'bg-gradient-to-br from-slate-500 to-slate-700', icon: User },
}

function EntityCards({ entities }: { entities: Entity[] }) {
  const { t } = useTranslation()
  if (entities.length === 0) {
    return (
      <Card className="border-dashed border-2 border-border">
        <CardContent className="p-6 text-center">
          <Landmark className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{t('overview.noEntities')}</p>
          <Link href="/entities" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <Plus className="h-4 w-4" /> {t('overview.addFirstEntity')}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entities.map((entity) => {
        const config = ENTITY_TYPE_CONFIG[entity.type] || ENTITY_TYPE_CONFIG.individual
        const Icon = config.icon
        return (
          <Link key={entity.id} href="/entities">
            <Card className="hover:shadow-md transition-all group cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${config.gradient} shadow-md ring-1 ring-white/20`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {entity.isDefault && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Default</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{config.label}</Badge>
                  </div>
                </div>
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{entity.name}</h3>
                <div className="mt-2 space-y-1">
                  {entity.companyNumber && (
                    <p className="text-xs text-muted-foreground">Co. #{entity.companyNumber}</p>
                  )}
                  {entity.utr && (
                    <p className="text-xs text-muted-foreground">UTR: {entity.utr}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span>{entity._count?.bankStatements || 0} {t('overview.statements')}</span>
                    <span>{entity._count?.accounts || 0} {t('overview.accountsCount')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function QuickActions() {
  const { t } = useTranslation()
  const actions = [
    { href: '/statements?action=upload', icon: Upload, label: t('overview.uploadStatement'), gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { href: '/documents?action=scan', icon: Camera, label: t('overview.scanDocument'), gradient: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { href: '/invoices?action=new', icon: FileText, label: t('overview.newInvoice'), gradient: 'bg-gradient-to-br from-violet-500 to-purple-600' },
    { href: '/bills?action=new', icon: Receipt, label: t('overview.addBill'), gradient: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { href: '/household?action=invite', icon: UserPlus, label: t('overview.inviteTeam'), gradient: 'bg-gradient-to-br from-pink-500 to-rose-600' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className={`p-2.5 rounded-xl ${action.gradient} shadow-lg ring-1 ring-white/20`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

export function OverviewClient() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [data, setData] = useState<DashboardData | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const firstName = session?.user?.name?.split(' ')[0] || ''
  const greeting = useGreeting()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, entRes] = await Promise.all([
          fetch("/api/commitments/monthly"),
          fetch("/api/entities"),
        ])
        if (dashRes.ok) setData(await dashRes.json())
        if (entRes.ok) setEntities(await entRes.json())
      } catch (err) {
        console.error("Error fetching dashboard:", err)
        setError(t('overview.failedToLoad'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  const netIncome = (data?.bankIncome ?? 0) - (data?.bankExpenses ?? 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <BudgetAlerts />
      <DeadlineAlerts limit={5} />
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            {firstName ? `${greeting}, ${firstName}` : t('overview.dashboardOverview')}
          </h2>
          <p className="text-muted-foreground mt-1">{t('overview.subtitle')}</p>
        </div>
        {netIncome !== 0 && (
          <div className={`text-right px-4 py-2 rounded-xl ${netIncome >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
            <p className="text-xs text-muted-foreground">{t('overview.netPosition')}</p>
            <p className={`text-xl font-bold ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netIncome >= 0 ? '+' : ''}£{Math.abs(netIncome).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Entity Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('overview.yourEntities')}</h3>
          <Link href="/entities" className="text-xs text-primary hover:underline flex items-center gap-1">
            {t('common.manage')} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <EntityCards entities={entities} />
      </div>

      {/* KPI Cards */}
      <StatsCards
        totalMonthly={data?.totalMonthly ?? 0}
        totalAccounts={data?.stats?.totalAccounts ?? 0}
        activeBills={data?.stats?.activeBills ?? 0}
        pendingActions={data?.stats?.pendingActions ?? 0}
        bankIncome={data?.bankIncome ?? 0}
        bankExpenses={data?.bankExpenses ?? 0}
        totalTransactions={data?.stats?.totalBankTransactions ?? 0}
        totalInvoices={data?.stats?.totalInvoices ?? 0}
      />

      {/* Charts + Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={data?.byCategory ?? []} />
        <UpcomingBills bills={data?.upcomingBills ?? []} />
      </div>

      {/* Actions + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActions actions={data?.recentActions ?? []} />
        <EventsFeed limit={5} />
      </div>

      {/* Health + Currency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthScore />
        <CurrencyConverter />
      </div>
    </div>
  )
}
