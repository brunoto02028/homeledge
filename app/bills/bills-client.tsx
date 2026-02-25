"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Filter, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BillsTable } from "./bills-table"
import { BillDialog } from "./bill-dialog"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/hooks/use-toast"
import type { Bill, Account, Category, ExpenseType } from "@/lib/types"
import { EXPENSE_TYPE_LABELS } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"

export function BillsClient() {
  const { t } = useTranslation()
  const [bills, setBills] = useState<Bill[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [filters, setFilters] = useState({
    categoryId: "",
    frequency: "",
    accountId: "",
    isActive: "",
    expenseType: "",
  })
  const { toast } = useToast()

  const fetchBills = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.categoryId) params.set("categoryId", filters.categoryId)
      if (filters.frequency) params.set("frequency", filters.frequency)
      if (filters.accountId) params.set("accountId", filters.accountId)
      if (filters.isActive) params.set("isActive", filters.isActive)
      if (filters.expenseType) params.set("expenseType", filters.expenseType)

      const res = await fetch(`/api/bills?${params.toString()}`)
      const data = await res.json()
      setBills(data ?? [])
    } catch (error) {
      console.error("Error fetching bills:", error)
      toast({ title: t('common.error'), description: t('common.errorLoading'), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts")
      const data = await res.json()
      setAccounts(data ?? [])
    } catch (error) {
      console.error("Error fetching accounts:", error)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      let data = await res.json()
      
      // Seed default categories if empty
      if (data.length === 0) {
        await fetch('/api/categories', { method: 'PUT' })
        const newRes = await fetch('/api/categories')
        data = await newRes.json()
      }
      
      setCategories(data ?? [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [])

  useEffect(() => {
    fetchBills()
    fetchAccounts()
    fetchCategories()
  }, [fetchBills, fetchAccounts, fetchCategories])

  const handleCreate = () => {
    setEditingBill(null)
    setDialogOpen(true)
  }

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill)
    setDialogOpen(true)
  }

  const handleDelete = async (billId: string) => {
    try {
      const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: t('common.deleted') })
      fetchBills()
    } catch (error) {
      console.error("Error deleting bill:", error)
      toast({ title: t('common.error'), variant: "destructive" })
    }
  }

  const handleToggleActive = async (bill: Bill) => {
    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !bill.isActive }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast({ title: t('common.updated') })
      fetchBills()
    } catch (error) {
      console.error("Error toggling bill:", error)
      toast({ title: t('common.error'), variant: "destructive" })
    }
  }

  const handleSave = async (data: Partial<Bill>) => {
    try {
      const url = editingBill ? `/api/bills/${editingBill.id}` : "/api/bills"
      const method = editingBill ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast({ title: editingBill ? t('common.updated') : t('common.created') })
      setDialogOpen(false)
      fetchBills()
    } catch (error) {
      console.error("Error saving bill:", error)
      toast({ title: t('common.error'), variant: "destructive" })
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('bills.title')}</h2>
          <p className="text-muted-foreground mt-1">{t('bills.subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t('bills.add')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center p-4 bg-card rounded-xl border shadow-sm">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{t('common.filters')}:</span>
        
        <Select value={filters.categoryId || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: cat.color || '#6b7280' }} />
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.expenseType || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, expenseType: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {Object.entries(EXPENSE_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.frequency || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, frequency: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="weekly">{t('bills.weekly')}</SelectItem>
            <SelectItem value="monthly">{t('bills.monthly')}</SelectItem>
            <SelectItem value="quarterly">{t('bills.quarterly')}</SelectItem>
            <SelectItem value="yearly">{t('bills.yearly')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.accountId || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, accountId: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.isActive || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="true">{t('common.active')}</SelectItem>
            <SelectItem value="false">{t('common.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t('bills.noBills')}
          description={t('bills.subtitle')}
        >
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('bills.add')}
          </Button>
        </EmptyState>
      ) : (
        <BillsTable
          bills={bills}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}

      <BillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bill={editingBill}
        accounts={accounts}
        categories={categories}
        onSave={handleSave}
      />
    </div>
  )
}
