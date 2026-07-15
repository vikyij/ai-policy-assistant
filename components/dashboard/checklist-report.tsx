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

type ChecklistSource = AnswerResponse["sources"][number]

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

function extractField(block: string, labels: string[]) {
  const allLabels = [
    "Status",
    "Evidence",
    "Evidence from document",
    "Evidence from the document",
    "Document evidence",
    "Recommendation",
    "Recommendations",
  ]
  const labelPattern = labels.join("|")
  const stopPattern = allLabels
    .filter((label) => !labels.includes(label))
    .join("|")
  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?(?:${labelPattern})(?:\\*\\*)?\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:[-*]\\s*)?(?:\\*\\*)?(?:${stopPattern})(?:\\*\\*)?\\s*:|\\n\\s*#{2,6}\\s|\\n\\s*\\d+[\\.)]\\s+[^:\\n]+(?=\\n)|$)`,
    "i",
  )

  return cleanMarkdown(block.match(regex)?.[1] ?? "")
}

function parseChecklist(answer: string): ParsedChecklistItem[] {
  const normalized = answer.replace(/\r\n/g, "\n")
  const markdownHeadingPattern = /(?:^|\n)\s*#{2,6}\s*(?:\d+\.?\s*)?(.+?)(?=\n)/g
  const numberedHeadingPattern = /(?:^|\n)\s*(?:\d+[\.)]\s+)([^:\n]+?)(?=\n)/g
  const matches = [
    ...Array.from(normalized.matchAll(markdownHeadingPattern)),
    ...Array.from(normalized.matchAll(numberedHeadingPattern)),
  ]
    .map((match) => ({
      title: cleanMarkdown(match[1]),
      index: match.index ?? 0,
      fullHeading: match[0],
    }))
    .filter((match) => isChecklistCategory(match.title))
    .sort((a, b) => a.index - b.index)

  if (matches.length === 0) {
    return []
  }

  return matches.flatMap((match, index) => {
    const start = match.index + match.fullHeading.length
    const end = matches[index + 1]?.index ?? normalized.length
    const block = normalized.slice(start, end)
    const statusLabel = extractField(block, ["Status"]) || "Covered"
    const evidenceText = extractField(block, [
      "Evidence",
      "Evidence from document",
      "Evidence from the document",
      "Document evidence",
    ])
    const recommendation = extractField(block, ["Recommendation", "Recommendations"])

    if (!statusLabel && !evidenceText && !recommendation) {
      return []
    }

    const evidence = evidenceText
      .split("\n")
      .map(cleanMarkdown)
      .filter(Boolean)

    return [{
      id: `${index}-${match.title}`,
      title: match.title,
      status: normalizeStatus(statusLabel),
      statusLabel,
      evidence,
      recommendation,
    }]
  })
}

function uniqueSources(sources: ChecklistSource[]) {
  return sources.filter(
    (source, index, allSources) =>
      allSources.findIndex(
        (item) =>
          item.document === source.document &&
          item.page === source.page &&
          item.text.slice(0, 140) === source.text.slice(0, 140),
      ) === index,
  )
}

function exportChecklistPdf({
  items,
  result,
  coveredCount,
  partialCount,
  missingCount,
}: {
  items: ParsedChecklistItem[]
  result: AnswerResponse
  coveredCount: number
  partialCount: number
  missingCount: number
}) {
  const pageWidth = 612
  const pageHeight = 792
  const margin = 54
  const maxWidth = pageWidth - margin * 2
  const lineHeight = 14
  const generatedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date())
  const sources = uniqueSources(result.sources)
  const pages: string[][] = [[]]
  let y = pageHeight - margin

  function sanitizePdfText(value: string) {
    return value
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/•/g, "-")
      .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E]/g, "")
      .trim()
  }

  function escapePdfText(value: string) {
    return sanitizePdfText(value)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
  }

  function wrapText(text: string, fontSize: number) {
    const maxChars = Math.max(24, Math.floor(maxWidth / (fontSize * 0.52)))
    const words = sanitizePdfText(text).split(" ").filter(Boolean)
    const lines: string[] = []
    let line = ""

    for (const word of words) {
      const next = line ? `${line} ${word}` : word

      if (next.length > maxChars && line) {
        lines.push(line)
        line = word
      } else {
        line = next
      }
    }

    if (line) lines.push(line)
    return lines
  }

  function currentPage() {
    return pages[pages.length - 1]
  }

  function addPage() {
    pages.push([])
    y = pageHeight - margin
  }

  function ensureSpace(height: number) {
    if (y - height < margin) {
      addPage()
    }
  }

  function addText(text: string, options: { fontSize?: number; bold?: boolean; indent?: number; gapAfter?: number } = {}) {
    const fontSize = options.fontSize ?? 10
    const indent = options.indent ?? 0
    const lines = wrapText(text, fontSize)

    for (const line of lines) {
      ensureSpace(lineHeight)
      currentPage().push(`BT /${options.bold ? "F2" : "F1"} ${fontSize} Tf ${margin + indent} ${y} Td (${escapePdfText(line)}) Tj ET`)
      y -= lineHeight
    }

    y -= options.gapAfter ?? 2
  }

  function addDivider() {
    ensureSpace(12)
    currentPage().push(`${margin} ${y} m ${pageWidth - margin} ${y} l S`)
    y -= 12
  }

  addText("POLICY PILOT", { fontSize: 9, bold: true })
  addText("Responsible AI Checklist Report", { fontSize: 20, bold: true, gapAfter: 4 })
  addText(`Generated ${generatedAt} from indexed policy evidence.`, { fontSize: 10, gapAfter: 8 })
  addDivider()
  addText(`Covered: ${coveredCount}    Partially covered: ${partialCount}    Missing: ${missingCount}`, {
    fontSize: 12,
    bold: true,
    gapAfter: 12,
  })

  if (items.length > 0) {
    items.forEach((item, index) => {
      ensureSpace(82)
      addText(`${index + 1}. ${item.title}`, { fontSize: 13, bold: true })
      addText(`Status: ${item.statusLabel || statusConfig[item.status].label}`, { fontSize: 10, bold: true })
      addText("Evidence", { fontSize: 10, bold: true })

      if (item.evidence.length > 0) {
        item.evidence.forEach((evidence) => addText(`- ${evidence}`, { indent: 12 }))
      } else {
        addText("No direct evidence returned.", { indent: 12 })
      }

      if (item.recommendation) {
        addText("Recommendation", { fontSize: 10, bold: true })
        addText(item.recommendation, { indent: 12 })
      }

      y -= 8
    })
  } else {
    addText(result.answer)
  }

  if (sources.length > 0) {
    addPage()
    addText("Sources Used", { fontSize: 16, bold: true, gapAfter: 8 })

    sources.forEach((source, index) => {
      ensureSpace(64)
      addText(`${index + 1}. ${source.document} - Page ${source.page} - score ${source.score.toFixed(3)}`, {
        fontSize: 11,
        bold: true,
      })
      addText(source.text, { indent: 12, gapAfter: 8 })
    })
  }

  const objects: string[] = []
  const pageObjects: number[] = []

  objects.push("<< /Type /Catalog /Pages 2 0 R >>")
  objects.push("PAGES_PLACEHOLDER")
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

  pages.forEach((commands) => {
    const content = `0.8 w\n${commands.join("\n")}`
    const contentObjectNumber = objects.length + 1
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)

    const pageObjectNumber = objects.length + 1
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    )
    pageObjects.push(pageObjectNumber)
  })

  objects[1] = `<< /Type /Pages /Kids [${pageObjects.map((objectNumber) => `${objectNumber} 0 R`).join(" ")}] /Count ${pageObjects.length} >>`

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const blob = new Blob([pdf], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "responsible-ai-checklist.pdf"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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
  const sources = uniqueSources(result.sources)
  const visibleSources = sources.slice(0, compact ? 3 : 4)
  const hiddenSources = sources.slice(visibleSources.length)

  if (sources.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Quote className="size-3.5" />
          Sources used
        </p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {sources.length} unique passages
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
            <Button
              variant="outline"
              size="sm"
              disabled={!result}
              onClick={() => {
                if (!result) return
                exportChecklistPdf({
                  items: checklistItems,
                  result,
                  coveredCount,
                  partialCount,
                  missingCount,
                })
              }}
            >
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
