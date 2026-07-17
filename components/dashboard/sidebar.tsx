"use client"

import {
  LayoutDashboard,
  MessagesSquare,
  ListChecks,
  ChartColumnIncreasing,
  FileText,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewId = "overview" | "assistant" | "checklist" | "gaps" | "documents"

const navItems: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "assistant", label: "Policy Assistant", icon: MessagesSquare },
  { id: "checklist", label: "RAI Checklist", icon: ListChecks },
  { id: "gaps", label: "Gap Analysis", icon: ChartColumnIncreasing },
  { id: "documents", label: "Documents", icon: FileText },
]

const userName = "Victoria Udechukwu"
const userRole = "Responsible AI Engineer"

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return "U"

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function Sidebar({
  active,
  onNavigate,
  open,
  onClose,
}: {
  active: ViewId
  onNavigate: (id: ViewId) => void
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-sidebar-foreground">Policy Pilot</p>
              <p className="text-xs text-muted-foreground">Responsible AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent md:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          <p className="px-3 pb-1 pt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
            <Settings className="size-4.5" />
            Settings
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
