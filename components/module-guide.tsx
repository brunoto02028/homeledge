'use client'

import { useState, useEffect } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Lightbulb, CheckCircle2, X } from 'lucide-react'
import { MODULE_GUIDES } from '@/lib/module-guides'
import { useTranslation } from '@/lib/i18n'

const DISMISSED_KEY = 'homeledger-guide-dismissed'

function getDismissed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const val = localStorage.getItem(DISMISSED_KEY)
    return val ? JSON.parse(val) : []
  } catch { return [] }
}

function setDismissed(keys: string[]) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(keys)) } catch {}
}

export function ModuleGuide({ moduleKey }: { moduleKey: string }) {
  const { locale } = useTranslation()
  const isPt = locale === 'pt-BR'
  const guide = MODULE_GUIDES[moduleKey]
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissedState] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const list = getDismissed()
    if (list.includes(moduleKey)) setDismissedState(true)
  }, [moduleKey])

  if (!guide || !mounted || dismissed) return null

  const title = isPt ? guide.titlePt : guide.title
  const description = isPt ? guide.descriptionPt : guide.description
  const whyImportant = isPt ? guide.whyImportantPt : guide.whyImportant
  const steps = guide.steps.map(s => isPt ? s.labelPt : s.label)

  const handleDismiss = () => {
    const list = getDismissed()
    list.push(moduleKey)
    setDismissed(list)
    setDismissedState(true)
  }

  return (
    <div className="mb-4 rounded-xl border border-blue-200/30 dark:border-blue-800/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 overflow-hidden transition-all">
      {/* Header - always visible */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 shrink-0">
          <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">{title}</h3>
          {!expanded && (
            <p className="text-xs text-blue-700/70 dark:text-blue-300/60 truncate">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors"
          >
            {expanded ? (
              <>{isPt ? 'Recolher' : 'Collapse'} <ChevronUp className="h-3.5 w-3.5" /></>
            ) : (
              <>{isPt ? 'Saiba mais' : 'Learn more'} <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </button>
          <button
            onClick={handleDismiss}
            title={isPt ? 'Fechar guia' : 'Dismiss guide'}
            className="text-blue-400/60 hover:text-blue-600 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-200/20 dark:border-blue-800/20 pt-3">
          <p className="text-sm text-blue-900/80 dark:text-blue-100/80 leading-relaxed">
            {description}
          </p>

          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isPt ? 'Como usar:' : 'How to use:'}
            </h4>
            <ol className="space-y-1 ml-1">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-800/70 dark:text-blue-200/70">
                  <span className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-200/50 dark:bg-blue-800/40 text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20 px-3 py-2">
            <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5 mb-1">
              <Lightbulb className="h-3.5 w-3.5" />
              {isPt ? 'Por que é importante:' : 'Why it matters:'}
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/70 leading-relaxed">
              {whyImportant}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
