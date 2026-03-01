"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { PoundSterling, LogOut, User, PanelLeftClose, PanelLeft, Menu, X, Moon, Sun, Landmark, Building2, ChevronDown, Download } from "lucide-react"
import { Navigation } from "./navigation"
import { IntelligenceAlertBell } from "./intelligence-alerts"
import { AiChat } from "./ai-chat"
import { PWAInstallPrompt, PWAProvider, PWASidebarButton } from "./pwa-install"
import { EntityProvider, useEntityContext } from "./entity-context"
import { NotificationBell } from "./notification-bell"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Sidebar context for collapsed state
const SidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}>({ collapsed: false, setCollapsed: () => {}, mobileOpen: false, setMobileOpen: () => {} })

export const useSidebar = () => useContext(SidebarContext)

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { data: session, status } = useSession() || {}
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render anything on server or before mount
  if (!mounted || status === "loading") {
    return null
  }
  
  if (!session?.user) {
    return null
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex items-center gap-3 w-full rounded-lg p-2 text-sm font-medium transition-colors",
          "text-slate-300 hover:bg-white/10",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-slate-900" />
          </div>
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-white">
                {session.user.name || session.user.email?.split('@')[0]}
              </p>
              <p className="truncate text-xs text-slate-400">{session.user.email}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{session.user.name}</span>
            <span className="text-xs text-muted-foreground">{session.user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        "flex items-center gap-3 w-full rounded-lg p-2 text-sm font-medium transition-colors",
        "text-slate-400 hover:bg-white/10 hover:text-slate-200",
        collapsed && "justify-center"
      )}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5 flex-shrink-0" /> : <Moon className="h-5 w-5 flex-shrink-0" />}
      {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  )
}

function SidebarLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/logo')
      .then(r => r.json())
      .then(d => { if (d.logoUrl) setLogoUrl(d.logoUrl) })
      .catch(() => {})
  }, [])

  if (logoUrl) {
    return (
      <div className="flex-shrink-0 h-9 w-9 rounded-lg overflow-hidden shadow-lg">
        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 h-9 w-9 rounded-lg overflow-hidden shadow-lg">
      <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
    </div>
  )
}

function SidebarEntitySelector({ collapsed }: { collapsed: boolean }) {
  const { entities, selectedEntityId, selectedEntity, setSelectedEntityId } = useEntityContext()

  if (entities.length === 0) return null

  return (
    <div className={cn("px-3 py-2 border-b border-white/10", collapsed && "px-1")}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            "flex items-center gap-2 w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/10",
            collapsed && "justify-center px-0"
          )}>
            {selectedEntity?.type === 'individual' || selectedEntity?.type === 'sole_trader'
              ? <User className="h-4 w-4 text-amber-400 flex-shrink-0" />
              : <Building2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
            }
            {!collapsed && (
              <>
                <span className="text-xs text-white truncate flex-1">{selectedEntity?.name || 'Select Entity'}</span>
                <ChevronDown className="h-3 w-3 text-slate-400 flex-shrink-0" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
          <DropdownMenuLabel className="text-xs">Switch Entity</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {entities.map((e) => (
            <DropdownMenuItem
              key={e.id}
              onClick={() => setSelectedEntityId(e.id)}
              className={cn(selectedEntityId === e.id && "bg-muted")}
            >
              {e.type === 'individual' || e.type === 'sole_trader'
                ? <User className="h-3.5 w-3.5 mr-2" />
                : <Building2 className="h-3.5 w-3.5 mr-2" />
              }
              <span className="truncate">{e.name}</span>
              {e.isDefault && <span className="text-[10px] text-muted-foreground ml-auto">default</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full flex-col sidebar-executive transition-all duration-300",
          // Desktop
          "lg:relative lg:translate-x-0",
          collapsed ? "lg:w-[68px]" : "lg:w-64",
          // Mobile
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo + collapse */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <div className={cn("flex items-center gap-3 min-w-0", collapsed && "lg:justify-center lg:w-full")}>
            <SidebarLogo />
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white">HomeLedger</h1>
                <p className="text-xs text-slate-400 truncate">Your finances, simplified</p>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-white/10"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>

          {/* Collapse button for desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden lg:flex p-1 rounded-md hover:bg-white/10",
              collapsed && "lg:hidden"
            )}
          >
            <PanelLeftClose className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="hidden lg:flex justify-center py-2">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-md hover:bg-white/10"
            >
              <PanelLeft className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        )}

        {/* Entity Selector */}
        <SidebarEntitySelector collapsed={collapsed} />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Navigation collapsed={collapsed} onItemClick={() => setMobileOpen(false)} />
        </div>

        {/* Theme toggle + Install + User menu + Logout at bottom */}
        <div className="border-t border-white/10 px-3 py-2 space-y-1">
          <InstallAppButton collapsed={collapsed} />
          <ThemeToggle collapsed={collapsed} />
          <UserMenu collapsed={collapsed} />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-red-400 hover:bg-white/10 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-xs font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Install App button (self-contained, no PWA context dependency) ──────────
function InstallAppButton({ collapsed = false }: { collapsed?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    } else {
      const ua = navigator.userAgent
      const isEdge = /Edg/.test(ua)
      const isChrome = /Chrome/.test(ua) && !isEdge
      const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
      let msg = 'To install HomeLedger as a desktop app:\n\n'
      if (isEdge) msg += '• Click the install icon in the address bar\n• Or: Menu (⋯) → Apps → Install HomeLedger'
      else if (isChrome) msg += '• Click the install icon in the address bar\n• Or: Menu (⋮) → "Install HomeLedger"'
      else if (isSafari) msg += '• File → Add to Dock (macOS Sonoma+)'
      else msg += '• Use Chrome or Edge for best install experience'
      alert(msg)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-amber-400 hover:bg-white/10 ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Download className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="text-xs font-medium">Install App</span>}
    </button>
  )
}

// Mobile top bar with hamburger
export function MobileTopBar() {
  const { setMobileOpen } = useSidebar()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
      <button
        onClick={() => setMobileOpen(true)}
        className="p-1.5 rounded-md hover:bg-muted"
      >
        <Menu className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-2 flex-1">
        <div className="h-7 w-7 rounded-lg overflow-hidden">
          <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
        </div>
        <span className="font-bold">HomeLedger</span>
      </div>
      <div className="relative flex items-center gap-1">
        <IntelligenceAlertBell />
        <NotificationBell />
      </div>
    </header>
  )
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Show bare layout (no sidebar) for public/auth pages or when not authenticated
  const isPublicPage = pathname === "/"
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password"
  const isLoading = status === "loading"
  const isUnauthenticated = status === "unauthenticated"

  if (isPublicPage || isAuthPage || isUnauthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 animate-pulse">
            <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Map pathname to AI chat section
  const aiSection = pathname.startsWith('/statements') ? 'statements'
    : pathname.startsWith('/invoices') ? 'invoices'
    : pathname.startsWith('/bills') ? 'bills'
    : pathname.startsWith('/reports') ? 'reports'
    : pathname.startsWith('/categories') ? 'categories'
    : pathname.startsWith('/documents') ? 'documents'
    : pathname.startsWith('/life-events') ? 'life'
    : pathname.startsWith('/vault') ? 'vault'
    : pathname.startsWith('/projections') ? 'general'
    : pathname.startsWith('/entities') ? 'general'
    : 'general';

  const isFullscreen = pathname === '/intelligence';

  return (
    <PWAProvider>
      <EntityProvider>
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <MobileTopBar />
              {isFullscreen ? (
                <main className="relative flex-1 overflow-hidden bg-[#050510]">
                  {children}
                </main>
              ) : (
                <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
                  <div className="mx-auto max-w-7xl">
                    {children}
                  </div>
                </main>
              )}
            </div>
          </div>
          <AiChat section={aiSection} />
          <PWAInstallPrompt />
        </SidebarProvider>
      </EntityProvider>
    </PWAProvider>
  )
}
