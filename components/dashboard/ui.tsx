import type { ReactNode } from "react"
import { Check, TriangleAlert, CircleDashed } from "lucide-react"
import type { ChecklistStatus } from "@/lib/data"
import { cn } from "@/lib/utils"

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm shadow-foreground/[0.03]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StatusBadge({ status }: { status: ChecklistStatus }) {
  const config = {
    pass: {
      label: "Compliant",
      icon: Check,
      className: "bg-success/10 text-success",
    },
    partial: {
      label: "Partial",
      icon: CircleDashed,
      className: "bg-warning/15 text-warning-foreground",
    },
    gap: {
      label: "Gap",
      icon: TriangleAlert,
      className: "bg-destructive/10 text-destructive",
    },
  }[status]

  const Icon = config.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  )
}
