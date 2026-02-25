"use client"

import Link from "next/link"
import { ListTodo, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Action } from "@/lib/types"

interface RecentActionsProps {
  actions: Action[]
}

const priorityVariants: Record<string, "high" | "medium" | "low"> = {
  high: "high",
  medium: "medium",
  low: "low",
}

const statusVariants: Record<string, "pending" | "approved" | "rejected" | "completed"> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  completed: "completed",
}

export function RecentActions({ actions }: RecentActionsProps) {
  const safeActions = actions ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Recent Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {safeActions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No pending actions</p>
        ) : (
          <div className="space-y-3">
            {safeActions.map((action) => (
              <div key={action.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {action.isOverdue && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                      <p className="font-medium truncate">{action.title}</p>
                    </div>
                    {action.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={priorityVariants[action.priority] ?? "medium"}>
                        {action.priority}
                      </Badge>
                      <Badge variant={statusVariants[action.status] ?? "pending"}>
                        {action.status}
                      </Badge>
                    </div>
                  </div>
                  {action.dueDate && (
                    <p className="text-xs text-muted-foreground flex-shrink-0">
                      Due: {formatDate(action.dueDate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/actions" className="w-full">
          <Button variant="outline" className="w-full">
            View All Actions
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
