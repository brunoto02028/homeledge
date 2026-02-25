"use client"

import { useEffect, useState, useRef } from "react"
import { CreditCard, Receipt, ArrowUpCircle, ArrowDownCircle, FileText, ListTodo, Info, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface StatsCardsProps {
  totalMonthly: number
  totalAccounts: number
  activeBills: number
  pendingActions: number
  bankIncome?: number
  bankExpenses?: number
  totalTransactions?: number
  totalInvoices?: number
}

function AnimatedCounter({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    // Skip animation if value hasn't changed meaningfully
    if (Math.abs(prevValue.current - value) < 0.01) {
      setDisplayValue(value)
      return
    }
    
    prevValue.current = value
    const startValue = displayValue
    const duration = 800
    const steps = 40
    const increment = (value - startValue) / steps
    let current = startValue
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  // Format with UK locale (commas as thousand separators)
  const formattedValue = displayValue.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return <span>{prefix}{formattedValue}{suffix}</span>
}

export function StatsCards({ 
  totalMonthly, 
  totalAccounts, 
  activeBills, 
  pendingActions,
  bankIncome = 0,
  bankExpenses = 0,
  totalTransactions = 0,
  totalInvoices = 0
}: StatsCardsProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const stats = [
    {
      id: "income",
      label: "Total Income",
      value: bankIncome,
      icon: ArrowUpCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
      format: "currency",
      description: "Sum of all credit transactions from your uploaded bank statements",
      source: "Bank Statements → Credit Transactions",
      link: "/statements",
      linkText: "View Statements",
    },
    {
      id: "expenses",
      label: "Total Expenses",
      value: bankExpenses,
      icon: ArrowDownCircle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-500/10",
      format: "currency",
      description: "Sum of all debit transactions from your uploaded bank statements",
      source: "Bank Statements → Debit Transactions",
      link: "/statements",
      linkText: "View Statements",
    },
    {
      id: "transactions",
      label: "Transactions",
      value: totalTransactions,
      icon: Receipt,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      format: "number",
      description: "Total number of transactions imported from all your bank statements",
      source: "Bank Statements → All Transactions",
      link: "/statements",
      linkText: "View Statements",
    },
    {
      id: "invoices",
      label: "Invoices",
      value: totalInvoices,
      icon: FileText,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-500/10",
      format: "number",
      description: "Total number of invoices created or uploaded in the system",
      source: "Invoices Module",
      link: "/invoices",
      linkText: "View Invoices",
    },
  ]

  const selectedStat = stats.find(s => s.id === selectedCard)

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card 
              key={stat.label} 
              className="hover:shadow-md transition-all cursor-pointer group border-border/60 dark:border-border"
              onClick={() => setSelectedCard(stat.id)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                      <Info className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>
                      {stat.format === "currency" ? (
                        <AnimatedCounter value={stat.value} prefix="£" decimals={2} />
                      ) : (
                        <AnimatedCounter value={stat.value} decimals={0} />
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStat && (
                <>
                  <selectedStat.icon className={`h-5 w-5 ${selectedStat.color}`} />
                  {selectedStat.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Understand where this data comes from
            </DialogDescription>
          </DialogHeader>
          {selectedStat && (
            <div className="space-y-4 py-4">
              <div className={`p-4 rounded-lg ${selectedStat.bgColor}`}>
                <p className={`text-3xl font-bold ${selectedStat.color}`}>
                  {selectedStat.format === "currency" 
                    ? `£${selectedStat.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : selectedStat.value.toLocaleString('en-GB')
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedStat.description}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Data Source</h4>
                <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
                  📊 {selectedStat.source}
                </p>
              </div>

              <div className="pt-2">
                <Link href={selectedStat.link}>
                  <Button className="w-full" onClick={() => setSelectedCard(null)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {selectedStat.linkText}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
