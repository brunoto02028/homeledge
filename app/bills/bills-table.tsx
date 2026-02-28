"use client"

import { useState } from "react"
import Image from "next/image"
import { MoreHorizontal, Pencil, Trash2, Power, ArrowUpDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatCurrency, getFrequencyLabel } from "@/lib/utils"
import type { Bill } from "@/lib/types"
import { EXPENSE_TYPE_LABELS } from "@/lib/types"

interface BillsTableProps {
  bills: Bill[]
  onEdit: (bill: Bill) => void
  onDelete: (id: string) => void
  onToggleActive: (bill: Bill) => void
}

type SortKey = "billName" | "amount" | "dueDay" | "monthlyEquivalent"
type SortOrder = "asc" | "desc"

export function BillsTable({ bills, onEdit, onDelete, onToggleActive }: BillsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("dueDay")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const sortedBills = [...(bills ?? [])].sort((a, b) => {
    const aVal = a?.[sortKey] ?? 0
    const bVal = b?.[sortKey] ?? 0
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortOrder === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
  })

  const SortButton = ({ column, label }: { column: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead><SortButton column="billName" label="Bill Name" /></TableHead>
              <TableHead>Provider / Account</TableHead>
              <TableHead><SortButton column="amount" label="Amount" /></TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead><SortButton column="dueDay" label="Due Day" /></TableHead>
              <TableHead><SortButton column="monthlyEquivalent" label="Monthly" /></TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBills.map((bill) => {
              const billIcon = bill.iconUrl
              const providerLogo = bill.account?.provider?.logoUrl
              const providerName = bill.account?.provider?.name ?? "Unknown"
              const accountName = bill.account?.accountName ?? "Unknown"
              // Use bill icon if available, otherwise fall back to provider logo
              const displayIcon = billIcon || providerLogo

              return (
                <TableRow key={bill.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {displayIcon ? (
                          <Image
                            src={displayIcon}
                            alt={bill.billName}
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold text-sm bg-muted">
                            {bill.billName?.charAt?.(0) ?? "?"}
                          </div>
                        )}
                      </div>
                      <span className="font-medium">{bill.billName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 rounded bg-muted overflow-hidden flex-shrink-0">
                        {providerLogo ? (
                          <Image
                            src={providerLogo}
                            alt={providerName}
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            {providerName?.charAt?.(0) ?? "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{providerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{accountName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(bill.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getFrequencyLabel(bill.frequency)}</Badge>
                  </TableCell>
                  <TableCell>{bill.dueDay}</TableCell>
                  <TableCell className="text-blue-600 dark:text-blue-400 font-medium">
                    {formatCurrency(bill.monthlyEquivalent ?? 0)}
                  </TableCell>
                  <TableCell>
                    {bill.category && (
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: bill.category.color || '#6b7280' }}
                      >
                        {bill.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {bill.expenseType && (
                      <Badge variant="secondary">
                        {EXPENSE_TYPE_LABELS[bill.expenseType]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={bill.isActive}
                        onCheckedChange={() => onToggleActive(bill)}
                      />
                      <span className={`text-xs ${bill.isActive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                        {bill.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(bill)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(bill.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId)
                setDeleteId(null)
              }}
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
