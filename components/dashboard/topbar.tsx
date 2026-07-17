"use client"

import { useState } from "react"
import { Bell, CheckCircle2, CircleAlert, Info, Menu, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type NotificationItem = {
  id: string
  title: string
  description: string
  type: "success" | "warning" | "error" | "neutral"
  createdAt: number
  read: boolean
}

const notificationConfig = {
  success: {
    icon: CheckCircle2,
    className: "bg-success/10 text-success",
  },
  warning: {
    icon: TriangleAlert,
    className: "bg-warning/15 text-warning-foreground",
  },
  error: {
    icon: CircleAlert,
    className: "bg-destructive/10 text-destructive",
  },
  neutral: {
    icon: Info,
    className: "bg-accent text-accent-foreground",
  },
}

function formatNotificationTime(timestamp: number) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))

  if (elapsedSeconds < 60) return "Just now"

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours} hr ago`

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(timestamp)
}

export function Topbar({
  title,
  subtitle,
  onMenu,
  notifications,
  onMarkNotificationsRead,
  onClearNotifications,
}: {
  title: string
  subtitle: string
  onMenu: () => void
  notifications: NotificationItem[]
  onMarkNotificationsRead: () => void
  onClearNotifications: () => void
}) {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <button
        onClick={onMenu}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
      </div>

      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          aria-expanded={open}
          className="relative"
          onClick={() => setOpen((current) => !current)}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {open && (
          <div className="absolute right-0 top-11 z-30 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Recent activity</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "All caught up"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={onMarkNotificationsRead}
                  >
                    Mark read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={onClearNotifications}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bell className="size-4" />
                </div>
                <p className="text-sm font-medium text-foreground">No activity yet</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Upload a document or run an analysis to see updates here.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto p-2">
                {notifications.map((notification) => {
                  const config = notificationConfig[notification.type]
                  const Icon = config.icon

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex gap-3 rounded-lg px-3 py-2.5",
                        notification.read ? "hover:bg-muted/50" : "bg-primary/[0.04]",
                      )}
                    >
                      <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", config.className)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          {!notification.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {notification.description}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
