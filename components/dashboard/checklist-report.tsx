"use client"

import { Download, ListChecks, Quote } from "lucide-react"
import type { AnswerResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "./ui"

export function ChecklistReport({
  compact = false,
  result,
  loading,
  disabled,
  onGenerate,
}: {
  compact?: boolean
  result: AnswerResponse | null
  loading: boolean
  disabled: boolean
  onGenerate: () => void
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Responsible AI Checklist</h2>
          <p className="text-xs text-muted-foreground">
            Generate controls from the indexed policy evidence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onGenerate} disabled={disabled || loading}>
            <ListChecks className="size-3.5" />
            {loading ? "Generating..." : "Generate"}
          </Button>
          {!compact && (
            <Button variant="outline" size="sm" disabled={!result}>
              <Download className="size-3.5" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="p-5">
        {!result && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground">No checklist generated yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload a document, then generate a checklist grounded in retrieved source passages.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {compact ? result.answer.slice(0, 900) : result.answer}
                {compact && result.answer.length > 900 ? "..." : ""}
              </p>
            </div>

            {!compact && result.sources.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Quote className="size-3.5" />
                  Sources used
                </p>
                {result.sources.slice(0, 6).map((source, index) => (
                  <div key={`${source.document}-${source.page}-${index}`} className="rounded-xl border border-border bg-card p-3">
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-medium text-foreground">{source.document}</span>
                      <span className="shrink-0 text-muted-foreground">
                        Page {source.page} · score {source.score.toFixed(3)}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {source.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
