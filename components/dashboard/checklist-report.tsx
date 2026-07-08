"use client"

import { useMemo, useState } from "react"
import { Download } from "lucide-react"
import { checklistItems, type ChecklistStatus } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, StatusBadge } from "./ui"
import { cn } from "@/lib/utils"

const filters: { id: ChecklistStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pass", label: "Compliant" },
  { id: "partial", label: "Partial" },
  { id: "gap", label: "Gaps" },
]

export function ChecklistReport({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<ChecklistStatus | "all">("all")

  const items = useMemo(
    () => (filter === "all" ? checklistItems : checklistItems.filter((i) => i.status === filter)),
    [filter],
  )

  const grouped = useMemo(() => {
    return items.reduce<Record<string, typeof items>>((acc, item) => {
      acc[item.category] = acc[item.category] || []
      acc[item.category].push(item)
      return acc
    }, {})
  }, [items])

  const passCount = checklistItems.filter((i) => i.status === "pass").length

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Responsible AI Checklist</h2>
          <p className="text-xs text-muted-foreground">
            {passCount} of {checklistItems.length} controls compliant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {!compact && (
            <Button variant="outline" size="sm">
              <Download className="size-3.5" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category} className="p-5">
            <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {category}
            </p>
            <ul className="flex flex-col gap-2.5">
              {catItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-primary">{item.reference}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        {items.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No controls match this filter.
          </p>
        )}
      </div>
    </Card>
  )
}
