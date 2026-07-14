"use client"

import {
  Check,
  CircleDashed,
  Download,
  FileText,
  ListChecks,
  Quote,
  TriangleAlert,
} from "lucide-react"
import type { AnswerResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card } from "./ui"

type ParsedChecklistItem = {
  id: string
  title: string
  status: "pass" | "partial" | "gap"
  statusLabel: string
  evidence: string[]
  recommendation: string
}

const statusConfig = {
  pass: {
    label: "Covered",
    icon: Check,
    className: "bg-success/10 text-success",
    borderClassName: "border-l-success",
  },
  partial: {
    label: "Partial",
    icon: CircleDashed,
    className: "bg-warning/15 text-warning-foreground",
    borderClassName: "border-l-warning",
  },
  gap: {
    label: "Missing",
    icon: TriangleAlert,
    className: "bg-destructive/10 text-destructive",
    borderClassName: "border-l-destructive",
  },
}

function cleanMarkdown(value: string) {
  return value
    .replace(/^[-*\s]+/, "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "")
    .trim()
}

function normalizeStatus(value: string): ParsedChecklistItem["status"] {
  const lower = value.toLowerCase()

  if (lower.includes("missing") || lower.includes("not covered") || lower.includes("gap")) {
    return "gap"
  }

  if (lower.includes("partial") || lower.includes("weak") || lower.includes("limited")) {
    return "partial"
  }

  return "pass"
}

function isChecklistCategory(title: string) {
  return !/(responsible ai checklist|summary|recommendations?|overall assessment|top\s*3)/i.test(title)
}

function parseChecklist(answer: string): ParsedChecklistItem[] {
  const normalized = answer.replace(/\r\n/g, "\n")
  const headingPattern = /(?:^|\n)#{2,6}\s*(?:\d+\.?\s*)?(.+?)(?=\n)/g
  const matches = Array.from(normalized.matchAll(headingPattern))
    .map((match) => ({
      title: cleanMarkdown(match[1]),
      index: match.index ?? 0,
      fullHeading: match[0],
    }))
    .filter((match) => isChecklistCategory(match.title))

  if (matches.length === 0) {
    return []
  }

  return matches.flatMap((match, index) => {
    const start = match.index + match.fullHeading.length
    const end = matches[index + 1]?.index ?? normalized.length
    const block = normalized.slice(start, end)
    const statusMatch = block.match(/\*\*Status:\*\*\s*([^\n]+)/i) ?? block.match(/Status:\s*([^\n]+)/i)
    const recommendationMatch =
      block.match(/\*\*Recommendation:\*\*\s*([\s\S]*?)(?=\n\s*-\s*\*\*[A-Z][^:]+:\*\*|\n\s*#{2,6}|$)/i) ??
      block.match(/Recommendation:\s*([\s\S]*?)(?=\n\s*-\s*[A-Z][^:]+:|\n\s*#{2,6}|$)/i)
    const evidenceMatch =
      block.match(/\*\*Evidence:\*\*\s*([\s\S]*?)(?=\n\s*-\s*\*\*Recommendation:\*\*|\n\s*Recommendation:|\n\s*#{2,6}|$)/i) ??
      block.match(/Evidence:\s*([\s\S]*?)(?=\n\s*-\s*Recommendation:|\n\s*#{2,6}|$)/i)

    if (!statusMatch && !evidenceMatch && !recommendationMatch) {
      return []
    }

    const statusLabel = cleanMarkdown(statusMatch?.[1] ?? "Covered")
    const evidence = (evidenceMatch?.[1] ?? "")
      .split("\n")
      .map(cleanMarkdown)
      .filter(Boolean)

    return [{
      id: `${index}-${match.title}`,
      title: match.title,
      status: normalizeStatus(statusLabel),
      statusLabel,
      evidence,
      recommendation: cleanMarkdown(recommendationMatch?.[1] ?? ""),
    }]
  })
}

function ChecklistStatusBadge({ status, label }: { status: ParsedChecklistItem["status"]; label: string }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", config.className)}>
      <Icon className="size-3.5" />
      {label || config.label}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  status,
}: {
  label: string
  value: number
  status: ParsedChecklistItem["status"]
}) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className={cn("mb-3 flex size-9 items-center justify-center rounded-lg", config.className)}>
        <Icon className="size-4" />
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function MarkdownFallback({ answer, compact }: { answer: string; compact: boolean }) {
  const lines = answer
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <div className="space-y-2 text-sm leading-relaxed text-foreground">
        {lines.slice(0, compact ? 12 : undefined).map((line, index) => {
          const cleaned = cleanMarkdown(line)

          if (/^#{2,6}/.test(line)) {
            return (
              <h3 key={`${line}-${index}`} className="pt-3 text-base font-semibold text-foreground first:pt-0">
                {cleaned}
              </h3>
            )
          }

          if (line.startsWith("-")) {
            return (
              <p key={`${line}-${index}`} className="pl-4 text-muted-foreground">
                {cleaned}
              </p>
            )
          }

          return <p key={`${line}-${index}`}>{cleaned}</p>
        })}
      </div>
    </div>
  )
}

function SourceList({ result, compact }: { result: AnswerResponse; compact: boolean }) {
  const uniqueSources = result.sources.filter(
    (source, index, sources) =>
      sources.findIndex(
        (item) =>
          item.document === source.document &&
          item.page === source.page &&
          item.text.slice(0, 140) === source.text.slice(0, 140),
      ) === index,
  )
  const visibleSources = uniqueSources.slice(0, compact ? 3 : 4)
  const hiddenSources = uniqueSources.slice(visibleSources.length)

  if (uniqueSources.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Quote className="size-3.5" />
          Sources used
        </p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {uniqueSources.length} unique passages
        </span>
      </div>

      <div className="grid gap-3">
        {visibleSources.map((source, index) => (
          <div key={`${source.document}-${source.page}-${index}`} className="rounded-xl border border-border bg-card p-3.5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{source.document}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                Page {source.page} · score {source.score.toFixed(3)}
              </span>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{source.text}</p>
          </div>
        ))}
      </div>

      {!compact && hiddenSources.length > 0 && (
        <details className="rounded-xl border border-border bg-muted/20 px-3.5 py-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Show {hiddenSources.length} more source{hiddenSources.length === 1 ? "" : "s"}
          </summary>
          <div className="mt-3 grid gap-3">
            {hiddenSources.map((source, index) => (
              <div key={`${source.document}-${source.page}-${index}`} className="rounded-lg border border-border bg-card p-3">
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-foreground">{source.document}</span>
                  <span className="shrink-0 text-muted-foreground">
                    Page {source.page} · score {source.score.toFixed(3)}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{source.text}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

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
  const checklistItems = result ? parseChecklist(result.answer) : []
  const visibleItems = compact ? checklistItems.slice(0, 3) : checklistItems
  const coveredCount = checklistItems.filter((item) => item.status === "pass").length
  const partialCount = checklistItems.filter((item) => item.status === "partial").length
  const missingCount = checklistItems.filter((item) => item.status === "gap").length

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Responsible AI Checklist</h2>
          <p className="text-xs text-muted-foreground">
            Generate checklist from the indexed policy evidence
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

      <div className="space-y-5 p-5">
        {!result && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground">No checklist generated yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload a document, then generate a checklist grounded in retrieved source passages.
            </p>
          </div>
        )}

        {result && checklistItems.length > 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Covered" value={coveredCount} status="pass" />
              <SummaryCard label="Partially covered" value={partialCount} status="partial" />
              <SummaryCard label="Missing" value={missingCount} status="gap" />
            </div>

            <div className="grid gap-3">
              {visibleItems.map((item) => {
                const config = statusConfig[item.status]

                return (
                  <section
                    key={item.id}
                    className={cn(
                      "rounded-xl border border-border border-l-4 bg-card p-4 shadow-sm shadow-foreground/[0.02]",
                      config.borderClassName,
                    )}
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Checklist category</p>
                      </div>
                      <ChecklistStatusBadge status={item.status} label={item.statusLabel} />
                    </div>

                    <div className={cn("grid gap-3", item.recommendation && "md:grid-cols-2")}>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Evidence
                        </p>
                        {item.evidence.length > 0 ? (
                          <ul className="space-y-1.5 text-sm leading-relaxed text-foreground">
                            {item.evidence.slice(0, compact ? 1 : 3).map((evidence, index) => (
                              <li key={`${item.id}-evidence-${index}`}>{evidence}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No direct evidence returned.</p>
                        )}
                      </div>

                      {item.recommendation && (
                        <div className="rounded-lg bg-muted/30 p-3">
                          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Recommendation
                          </p>
                          <p className="text-sm leading-relaxed text-foreground">
                            {item.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>

            {compact && checklistItems.length > visibleItems.length && (
              <p className="text-center text-xs text-muted-foreground">
                Showing {visibleItems.length} of {checklistItems.length} checklist areas.
              </p>
            )}
          </>
        )}

        {result && checklistItems.length === 0 && <MarkdownFallback answer={result.answer} compact={compact} />}

        {result && <SourceList result={result} compact={compact} />}
      </div>
    </Card>
  )
}
