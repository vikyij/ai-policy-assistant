import { ShieldCheck, TriangleAlert, CircleDashed, FileText } from "lucide-react"
import { checklistItems } from "@/lib/data"
import { Card } from "./ui"

export function StatCards() {
  const pass = checklistItems.filter((i) => i.status === "pass").length
  const partial = checklistItems.filter((i) => i.status === "partial").length
  const gap = checklistItems.filter((i) => i.status === "gap").length

  const stats = [
    {
      label: "Compliant Controls",
      value: pass,
      icon: ShieldCheck,
      className: "bg-success/10 text-success",
    },
    {
      label: "Partial Controls",
      value: partial,
      icon: CircleDashed,
      className: "bg-warning/15 text-warning-foreground",
    },
    {
      label: "Open Gaps",
      value: gap,
      icon: TriangleAlert,
      className: "bg-destructive/10 text-destructive",
    },
    {
      label: "Documents",
      value: 1,
      icon: FileText,
      className: "bg-accent text-accent-foreground",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon
        return (
          <Card key={s.label} className="p-4">
            <div className={`mb-3 flex size-9 items-center justify-center rounded-lg ${s.className}`}>
              <Icon className="size-4.5" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        )
      })}
    </div>
  )
}
