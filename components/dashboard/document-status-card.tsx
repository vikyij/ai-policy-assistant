import { FileText, CircleCheck, Clock, Sparkles } from "lucide-react"
import { Card } from "./ui"

const rows = [
  { label: "Pages processed", value: "38 / 38", icon: FileText },
  { label: "Controls extracted", value: "24", icon: Sparkles },
  { label: "Last analyzed", value: "2 min ago", icon: Clock },
]

export function DocumentStatusCard() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Document Status</p>
          <p className="text-xs text-muted-foreground">Responsible AI Policy v2.4</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
          <CircleCheck className="size-3" />
          Analyzed
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <div key={row.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                {row.label}
              </span>
              <span className="text-sm font-medium text-foreground">{row.value}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Analysis confidence</span>
          <span className="font-medium text-foreground">92%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: "92%" }} />
        </div>
      </div>
    </Card>
  )
}
