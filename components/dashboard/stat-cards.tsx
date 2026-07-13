import { ShieldCheck, TriangleAlert, CircleDashed, FileText } from "lucide-react"
import type { AnswerResponse, UploadResponse } from "@/lib/api"
import { Card } from "./ui"

export function StatCards({
  document,
  checklist,
  gapAnalysis,
  chatCount,
}: {
  document: UploadResponse | null
  checklist: AnswerResponse | null
  gapAnalysis: AnswerResponse | null
  chatCount: number
}) {
  const stats = [
    {
      label: "Document",
      value: document ? 1 : 0,
      icon: ShieldCheck,
      className: "bg-success/10 text-success",
    },
    {
      label: "Checklist",
      value: checklist ? "Ready" : "Pending",
      icon: CircleDashed,
      className: "bg-warning/15 text-warning-foreground",
    },
    {
      label: "Gap Analysis",
      value: gapAnalysis ? "Ready" : "Pending",
      icon: TriangleAlert,
      className: "bg-destructive/10 text-destructive",
    },
    {
      label: "Chat Questions",
      value: chatCount,
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
