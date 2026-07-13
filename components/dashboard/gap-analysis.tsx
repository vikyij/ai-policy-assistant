"use client"

import { ChartColumnIncreasing, Quote, TriangleAlert } from "lucide-react"
import type { AnswerResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "./ui"

export function GapAnalysis({
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
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="flex flex-col justify-between gap-4 p-6 lg:col-span-1">
        <div>
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">Gap Analysis</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Identify missing or weak Responsible AI controls from the indexed document.
          </p>
        </div>
        <Button onClick={onGenerate} disabled={disabled || loading}>
          <ChartColumnIncreasing className="size-4" />
          {loading ? "Generating..." : "Generate Gap Analysis"}
        </Button>
      </Card>

      <Card className="p-6 lg:col-span-2">
        {!result && (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground">No gap analysis generated yet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              Upload a document, then run the analysis to review fairness, transparency,
              accountability, privacy, oversight, monitoring, and incident response coverage.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {compact ? result.answer.slice(0, 1000) : result.answer}
                {compact && result.answer.length > 1000 ? "..." : ""}
              </p>
            </div>

            {!compact && result.sources.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Quote className="size-3.5" />
                  Sources used
                </p>
                {result.sources.slice(0, 8).map((source, index) => (
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
      </Card>
    </div>
  )
}
