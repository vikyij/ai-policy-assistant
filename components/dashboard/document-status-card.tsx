import { FileText, CircleCheck, Clock, Sparkles } from "lucide-react"
import type { UploadResponse } from "@/lib/api"
import { Card } from "./ui"

export function DocumentStatusCard({ document }: { document: UploadResponse | null }) {
  const rows = [
    { label: "Pages processed", value: document ? String(document.pages_processed) : "0", icon: FileText },
    { label: "Chunks indexed", value: document ? String(document.chunks_indexed) : "0", icon: Sparkles },
    { label: "Last analyzed", value: document ? "Current session" : "Not yet", icon: Clock },
  ]

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Document Status</p>
          <p className="text-xs text-muted-foreground">
            {document ? document.document : "No document indexed"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
          <CircleCheck className="size-3" />
          {document ? "Analyzed" : "Waiting"}
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
          <span className="font-medium text-foreground">{document ? "Ready" : "Pending"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: document ? "100%" : "0%" }} />
        </div>
      </div>
    </Card>
  )
}
