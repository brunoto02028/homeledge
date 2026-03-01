"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { LayoutDashboard, Receipt, ListTodo, FileText, Tag, BarChart3, Building2, FileSpreadsheet, CalendarDays, Camera, Shield, KeyRound, TrendingUp, Landmark, Users, CalendarClock, ArrowLeftRight, Settings, Home, GraduationCap, Calculator, Languages, CreditCard, Cable, FolderOpen, Link2, Briefcase, Lock, Brain, GripVertical, ArrowDownAZ, Globe, ShoppingBag, BookOpen, Mail, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation, type Locale } from "@/lib/i18n"
import { ROUTE_PERMISSION_MAP, hasPermission, ADMIN_ONLY_MODULES, type PermissionKey } from "@/lib/permissions"

const navItems = [
  { href: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard, permission: 'dashboard' as PermissionKey },
  { href: "/academy", labelKey: "nav.academy", icon: GraduationCap, permission: 'academy' as PermissionKey },
  { href: "/actions", labelKey: "nav.actions", icon: ListTodo, permission: 'actions' as PermissionKey },
  { href: "/bills", labelKey: "nav.bills", icon: Receipt, permission: 'bills' as PermissionKey },
  { href: "/documents", labelKey: "nav.documents", icon: Camera, permission: 'documents' as PermissionKey },
  { href: "/categories", labelKey: "nav.categories", icon: Tag, permission: 'categories' as PermissionKey },
  { href: "/english-hub", labelKey: "nav.englishHub", icon: Languages, permission: 'english_hub' as PermissionKey },
  { href: "/email", labelKey: "nav.email", icon: Mail, permission: 'email' as PermissionKey },
  { href: "/intelligence", labelKey: "nav.intelligence", icon: Radio, permission: 'intelligence' as PermissionKey },
  { href: "/entities", labelKey: "nav.entities", icon: Landmark, permission: 'entities' as PermissionKey },
  { href: "/files", labelKey: "nav.files", icon: FolderOpen, permission: 'files' as PermissionKey },
  { href: "/household", labelKey: "nav.household", icon: Users, permission: 'household' as PermissionKey },
  { href: "/invoices", labelKey: "nav.invoices", icon: FileText, permission: 'invoices' as PermissionKey },
  { href: "/learn", labelKey: "nav.learn", icon: BookOpen, permission: 'learn' as PermissionKey },
  { href: "/life-events", labelKey: "nav.lifeEvents", icon: CalendarDays, permission: 'life_events' as PermissionKey },
  { href: "/product-calculator", labelKey: "nav.productCalculator", icon: Calculator, permission: 'product_calculator' as PermissionKey },
  { href: "/projections", labelKey: "nav.projections", icon: TrendingUp, permission: 'projections' as PermissionKey },
  { href: "/properties", labelKey: "nav.properties", icon: Home, permission: 'properties' as PermissionKey },
  { href: "/providers", labelKey: "nav.providers", icon: Building2, permission: 'providers' as PermissionKey },
  { href: "/relocation", labelKey: "nav.relocation", icon: Globe, permission: 'relocation' as PermissionKey },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3, permission: 'reports' as PermissionKey },
  { href: "/services", labelKey: "nav.services", icon: ShoppingBag, permission: 'services' as PermissionKey },
  { href: "/categorization-rules", labelKey: "nav.categorizationRules", icon: Brain, permission: 'categories' as PermissionKey },
  { href: "/statements", labelKey: "nav.statements", icon: FileSpreadsheet, permission: 'statements' as PermissionKey },
  { href: "/tax-timeline", labelKey: "nav.taxTimeline", icon: CalendarClock, permission: 'tax_timeline' as PermissionKey },
  { href: "/transfers", labelKey: "nav.transfers", icon: ArrowLeftRight, permission: 'transfers' as PermissionKey },
  { href: "/vault", labelKey: "nav.vault", icon: KeyRound, permission: 'vault' as PermissionKey },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, permission: 'settings' as PermissionKey },
]

const adminItems = [
  { href: "/admin/cms", labelKey: "nav.cms", icon: Languages },
  { href: "/admin/users", labelKey: "nav.users", icon: Shield },
  { href: "/admin/plans", labelKey: "nav.plans", icon: CreditCard },
  { href: "/admin/compliance", labelKey: "nav.compliance", icon: Lock },
  { href: "/admin/integrations", labelKey: "nav.integrations", icon: Cable },
  { href: "/admin/credentials", labelKey: "nav.credentials", icon: KeyRound },
  { href: "/admin/analytics", labelKey: "nav.analytics", icon: BarChart3 },
]

const NAV_ORDER_KEY = 'homeledger-nav-order'

function getStoredOrder(): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(NAV_ORDER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch { return null }
}

function saveOrder(order: string[]) {
  try { localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(order)) } catch {}
}

export function Navigation({ collapsed = false, onItemClick }: { collapsed?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t, locale, setLocale } = useTranslation()
  const userRole = (session?.user as any)?.role || 'user'
  const userPermissions: string[] = (session?.user as any)?.permissions || []
  const isAdmin = userRole === 'admin'
  const isAccountant = userRole === 'accountant'
  const [orderedItems, setOrderedItems] = useState(navItems)
  const [reorderMode, setReorderMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  // Sort alphabetically by translated label
  const sortAlphabetically = useCallback(() => {
    const sorted = [...navItems].sort((a, b) => {
      const la = t(a.labelKey).toLowerCase()
      const lb = t(b.labelKey).toLowerCase()
      return la.localeCompare(lb)
    })
    setOrderedItems(sorted)
    saveOrder(sorted.map(i => i.href))
  }, [t])

  // Load order on mount
  useEffect(() => {
    setMounted(true)
    const stored = getStoredOrder()
    if (stored && stored.length > 0) {
      const map = new Map(navItems.map(item => [item.href, item]))
      const ordered: typeof navItems = []
      for (const href of stored) {
        const item = map.get(href)
        if (item) { ordered.push(item); map.delete(href) }
      }
      // Add any new items not in stored order (alphabetically at end)
      const remaining = Array.from(map.values()).sort((a, b) => t(a.labelKey).localeCompare(t(b.labelKey)))
      setOrderedItems([...ordered, ...remaining])
    } else {
      sortAlphabetically()
    }
  }, [t, sortAlphabetically])

  const handleDragStart = (index: number) => {
    dragItem.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index
  }

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const items = [...orderedItems]
    const draggedItem = items[dragItem.current]
    items.splice(dragItem.current, 1)
    items.splice(dragOverItem.current, 0, draggedItem)
    dragItem.current = null
    dragOverItem.current = null
    setOrderedItems(items)
    saveOrder(items.map(i => i.href))
  }

  const handleSortAZ = () => {
    sortAlphabetically()
    setReorderMode(false)
  }

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'pt-BR' : 'en')
  }

  // Filter out admin-only modules for non-admin users (completely hidden)
  // All other modules are visible but may be locked (padlock icon)
  const visibleItems = orderedItems.filter(item => {
    if (ADMIN_ONLY_MODULES.includes(item.permission) && !isAdmin) return false
    return true
  })

  return (
    <nav className="flex flex-col gap-0.5">
      {/* Reorder controls */}
      {!collapsed && mounted && (
        <div className="flex items-center gap-1 px-1 mb-1">
          <button
            onClick={() => setReorderMode(!reorderMode)}
            title={reorderMode ? 'Done reordering' : 'Reorder menu'}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-medium transition-colors",
              reorderMode
                ? "bg-amber-500/20 text-amber-400"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            <GripVertical className="h-3 w-3" />
            {reorderMode ? 'Done' : 'Reorder'}
          </button>
          <button
            onClick={handleSortAZ}
            title="Sort A-Z"
            className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          >
            <ArrowDownAZ className="h-3 w-3" />
            A-Z
          </button>
        </div>
      )}
      {visibleItems.map((item, index) => {
        const Icon = item.icon
        const label = t(item.labelKey)
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
        const isLocked = !hasPermission(userRole, userPermissions, item.permission)
        return (
          <div
            key={item.href}
            draggable={reorderMode && !isLocked}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={cn(reorderMode && !isLocked && "cursor-grab active:cursor-grabbing")}
          >
            <Link
              href={isLocked ? '/settings?upgrade=1' : item.href}
              onClick={reorderMode ? (e) => e.preventDefault() : onItemClick}
              title={collapsed ? (isLocked ? `${label} (Upgrade)` : label) : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                collapsed && "justify-center px-2",
                isLocked
                  ? "text-slate-600 hover:bg-white/5 hover:text-slate-500 opacity-60"
                  : isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/10 hover:text-slate-200",
                reorderMode && !isLocked && "hover:bg-white/5 border border-transparent hover:border-white/10"
              )}
            >
              {reorderMode && !collapsed && !isLocked && <GripVertical className="h-4 w-4 text-slate-600 flex-shrink-0" />}
              <Icon className={cn("h-5 w-5 flex-shrink-0", isLocked ? "text-slate-600" : isActive ? "text-amber-400" : "")} />
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between">
                  <span>{label}</span>
                  {isLocked && <Lock className="h-3 w-3 text-slate-600 ml-auto" />}
                </span>
              )}
              {collapsed && isLocked && <Lock className="h-2.5 w-2.5 text-slate-600 absolute -top-0.5 -right-0.5" />}
            </Link>
          </div>
        )
      })}

      {isAccountant && (
        <>
          <div className={cn("my-2 border-t border-white/10", collapsed && "mx-2")} />
          {!collapsed && (
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('nav.accountantSection') || 'Accountant'}</span>
          )}
          <Link
            href="/accountant"
            onClick={onItemClick}
            title={collapsed ? (t('nav.accountantDashboard') || 'My Clients') : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              collapsed && "justify-center px-2",
              pathname.startsWith('/accountant')
                ? "bg-white/15 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            <Briefcase className={cn("h-5 w-5 flex-shrink-0", pathname.startsWith('/accountant') ? "text-amber-400" : "")} />
            {!collapsed && <span>{t('nav.accountantDashboard') || 'My Clients'}</span>}
          </Link>
        </>
      )}

      {isAdmin && (
        <>
          <div className={cn("my-2 border-t border-white/10", collapsed && "mx-2")} />
          {!collapsed && (
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('nav.admin')}</span>
          )}
          {adminItems.map((item) => {
            const Icon = item.icon
            const label = t(item.labelKey)
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-amber-400" : "")} />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </>
      )}

      {/* Language Switcher */}
      <div className={cn("my-2 border-t border-white/10", collapsed && "mx-2")} />
      <button
        onClick={toggleLocale}
        title={collapsed ? (locale === 'en' ? 'Português (BR)' : 'English') : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          collapsed && "justify-center px-2",
          "text-slate-400 hover:bg-white/10 hover:text-slate-200"
        )}
      >
        <Languages className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{locale === 'en' ? 'Português (BR)' : 'English'}</span>}
      </button>
    </nav>
  )
}
