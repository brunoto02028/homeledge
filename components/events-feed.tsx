"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Activity, Receipt, ListTodo, Building2, CreditCard, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Event } from "@/lib/types"

const getEventIcon = (entityType: string) => {
  switch (entityType) {
    case "bill":
      return Receipt
    case "action":
      return ListTodo
    case "provider":
      return Building2
    case "account":
      return CreditCard
    default:
      return Activity
  }
}

const formatEventMessage = (event: Event): string => {
  const payload = event.payload as Record<string, unknown> | null
  const name = payload?.name ?? payload?.title ?? "Item"
  const action = event.eventType?.split?.(".")?.[1] ?? "updated"
  const entity = event.entityType ?? "item"
  return `${entity.charAt(0).toUpperCase() + entity.slice(1)} '${name}' was ${action}`
}

export function EventsFeed({ limit = 10 }: { limit?: number }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/events?limit=${limit}`)
        const data = await res.json()
        setEvents(data?.events ?? [])
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [limit])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events?.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {events?.map?.((event) => {
              const Icon = getEventIcon(event.entityType)
              return (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-card shadow-sm border border-border">
                    <Icon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{formatEventMessage(event)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.occurredAt ? formatDistanceToNow(new Date(event.occurredAt), { addSuffix: true }) : "Recently"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
