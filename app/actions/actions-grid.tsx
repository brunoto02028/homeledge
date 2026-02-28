"use client"

import { useState } from "react"
import { AlertTriangle, Pencil, Trash2, Check, X, Clock, ChevronDown, ChevronRight, CircleDot, CircleCheck, CircleX, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { formatDate } from "@/lib/utils"
import type { Action, ActionStatus } from "@/lib/types"

interface ActionsGridProps {
  groupedActions: {
    pending: Action[]
    approved: Action[]
    completed: Action[]
    rejected: Action[]
  }
  allActions?: Action[]
  viewMode?: 'board' | 'list'
  onEdit: (action: Action) => void
  onDelete: (id: string) => void
  onStatusChange: (action: Action, status: ActionStatus) => void
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", icon: Clock },
  approved: { label: "Approved", color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", icon: Check },
  completed: { label: "Completed", color: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800", icon: Check },
  rejected: { label: "Rejected", color: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", icon: X },
}

const priorityVariants: Record<string, "high" | "medium" | "low"> = {
  high: "high",
  medium: "medium",
  low: "low",
}

function ActionCard({
  action,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  action: Action
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: ActionStatus) => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="p-4 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {action.isOverdue && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
            <h4 className="font-medium text-foreground truncate">{action.title}</h4>
          </div>
          {action.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{action.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={priorityVariants[action.priority] ?? "medium"}>
              {action.priority}
            </Badge>
            {action.dueDate && (
              <span className={`text-xs ${action.isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                Due: {formatDate(action.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setShowActions(!showActions)}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-popover rounded-lg shadow-lg border border-border py-1 z-10 min-w-[140px]">
              <button
                onClick={() => { onEdit(); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              {action.status === "pending" && (
                <>
                  <button
                    onClick={() => { onStatusChange("approved"); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-blue-500"
                  >
                    <Check className="h-3 w-3" /> Approve
                  </button>
                  <button
                    onClick={() => { onStatusChange("rejected"); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                  >
                    <X className="h-3 w-3" /> Reject
                  </button>
                </>
              )}
              {(action.status === "pending" || action.status === "approved") && (
                <button
                  onClick={() => { onStatusChange("completed"); setShowActions(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-green-500"
                >
                  <Check className="h-3 w-3" /> Complete
                </button>
              )}
              <button
                onClick={() => { onDelete(); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const listStatusIcons: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Circle, color: 'text-amber-500' },
  approved: { icon: CircleDot, color: 'text-blue-500' },
  completed: { icon: CircleCheck, color: 'text-green-500' },
  rejected: { icon: CircleX, color: 'text-red-500' },
}

function ActionListItem({
  action,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  action: Action
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: ActionStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const statusIcon = listStatusIcons[action.status] || listStatusIcons.pending
  const StatusIcon = statusIcon.icon

  return (
    <div className={`border border-border rounded-lg transition-all ${expanded ? 'bg-card shadow-md' : 'bg-card/50 hover:bg-card hover:shadow-sm'}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
        <StatusIcon className={`h-5 w-5 flex-shrink-0 ${statusIcon.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {action.isOverdue && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
            <span className={`font-medium truncate ${action.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {action.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={priorityVariants[action.priority] ?? "medium"} className="text-xs">
            {action.priority}
          </Badge>
          {action.dueDate && (
            <span className={`text-xs hidden sm:inline ${action.isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
              {formatDate(action.dueDate)}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50">
          {action.description ? (
            <p className="text-sm text-muted-foreground leading-relaxed mt-3 whitespace-pre-wrap">
              {action.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic mt-3">No description</p>
          )}
          {action.dueDate && (
            <div className="mt-3 text-xs text-muted-foreground sm:hidden">
              Due: {formatDate(action.dueDate)}
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            {action.status === 'pending' && (
              <Button size="sm" variant="outline" className="text-blue-500 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/30" onClick={(e) => { e.stopPropagation(); onStatusChange('approved'); }}>
                <Check className="h-3 w-3 mr-1" /> Approve
              </Button>
            )}
            {(action.status === 'pending' || action.status === 'approved') && (
              <Button size="sm" variant="outline" className="text-green-500 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30" onClick={(e) => { e.stopPropagation(); onStatusChange('completed'); }}>
                <CircleCheck className="h-3 w-3 mr-1" /> Complete
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 ml-auto" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ActionsGrid({ groupedActions, allActions, viewMode = 'board', onEdit, onDelete, onStatusChange }: ActionsGridProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const statusOrder: (keyof typeof groupedActions)[] = ["pending", "approved", "completed", "rejected"]

  // Sort actions for list view: pending first, then approved, then completed, then rejected. Within each group, high priority first.
  const sortedActions = [...(allActions || [])].sort((a, b) => {
    const statusOrderMap: Record<string, number> = { pending: 0, approved: 1, completed: 2, rejected: 3 }
    const priorityOrderMap: Record<string, number> = { high: 0, medium: 1, low: 2 }
    const statusDiff = (statusOrderMap[a.status] ?? 9) - (statusOrderMap[b.status] ?? 9)
    if (statusDiff !== 0) return statusDiff
    return (priorityOrderMap[a.priority] ?? 9) - (priorityOrderMap[b.priority] ?? 9)
  })

  return (
    <>
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {sortedActions.map((action) => (
            <ActionListItem
              key={action.id}
              action={action}
              onEdit={() => onEdit(action)}
              onDelete={() => setDeleteId(action.id)}
              onStatusChange={(newStatus) => onStatusChange(action, newStatus)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusOrder.map((status) => {
            const config = statusConfig[status]
            const actions = groupedActions[status] ?? []
            const Icon = config?.icon ?? Clock

            return (
              <Card key={status} className={`${config?.color ?? ""} border`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4" />
                    {config?.label ?? status}
                    <span className="ml-auto bg-background px-2 py-0.5 rounded-full text-xs font-medium">
                      {actions.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {actions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No actions</p>
                  ) : (
                    actions.map((action) => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        onEdit={() => onEdit(action)}
                        onDelete={() => setDeleteId(action.id)}
                        onStatusChange={(newStatus) => onStatusChange(action, newStatus)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this action? This cannot be undone.
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
