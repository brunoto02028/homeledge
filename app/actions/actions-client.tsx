"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Filter, ListTodo, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ActionsGrid } from "./actions-grid"
import { ActionDialog } from "./action-dialog"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/hooks/use-toast"
import type { Action, ActionStatus, ActionPriority } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"

export function ActionsClient() {
  const { t } = useTranslation()
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<Action | null>(null)
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  })
  const [viewMode, setViewMode] = useState<'board' | 'list'>('list')
  const { toast } = useToast()

  const fetchActions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.priority) params.set("priority", filters.priority)

      const res = await fetch(`/api/actions?${params.toString()}`)
      const data = await res.json()
      setActions(data ?? [])
    } catch (error) {
      console.error("Error fetching actions:", error)
      toast({ title: "Error", description: "Failed to load actions", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  const handleCreate = () => {
    setEditingAction(null)
    setDialogOpen(true)
  }

  const handleEdit = (action: Action) => {
    setEditingAction(action)
    setDialogOpen(true)
  }

  const handleDelete = async (actionId: string) => {
    try {
      const res = await fetch(`/api/actions/${actionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Success", description: "Action deleted successfully" })
      fetchActions()
    } catch (error) {
      console.error("Error deleting action:", error)
      toast({ title: "Error", description: "Failed to delete action", variant: "destructive" })
    }
  }

  const handleStatusChange = async (action: Action, newStatus: ActionStatus) => {
    try {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast({ title: "Success", description: `Action marked as ${newStatus}` })
      fetchActions()
    } catch (error) {
      console.error("Error updating action:", error)
      toast({ title: "Error", description: "Failed to update action", variant: "destructive" })
    }
  }

  const handleSave = async (data: Partial<Action>) => {
    try {
      const url = editingAction ? `/api/actions/${editingAction.id}` : "/api/actions"
      const method = editingAction ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast({ title: "Success", description: `Action ${editingAction ? "updated" : "created"} successfully` })
      setDialogOpen(false)
      fetchActions()
    } catch (error) {
      console.error("Error saving action:", error)
      toast({ title: "Error", description: "Failed to save action", variant: "destructive" })
    }
  }

  // Group actions by status
  const groupedActions = {
    pending: (actions ?? []).filter((a) => a.status === "pending"),
    approved: (actions ?? []).filter((a) => a.status === "approved"),
    completed: (actions ?? []).filter((a) => a.status === "completed"),
    rejected: (actions ?? []).filter((a) => a.status === "rejected"),
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('actions.title')}</h2>
          <p className="text-muted-foreground mt-1">{t('actions.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Board view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Action
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center p-4 bg-card rounded-xl border border-border shadow-sm">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground/60">Filters:</span>
        
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => setFilters((f) => ({ ...f, priority: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {actions.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={t('actions.noActions')}
          description={t('actions.subtitle')}
        >
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Action
          </Button>
        </EmptyState>
      ) : (
        <ActionsGrid
          groupedActions={groupedActions}
          allActions={actions}
          viewMode={viewMode}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      <ActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        action={editingAction}
        onSave={handleSave}
      />
    </div>
  )
}
