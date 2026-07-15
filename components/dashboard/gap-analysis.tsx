"use client"

import {
  ChartColumnIncreasing,
  CheckCircle2,
  CircleDashed,
  FileText,
  Quote,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react"
import type { AnswerResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card } from "./ui"

type GapStatus = "strong" | "partial" | "weak" | "missing"

type ParsedGapItem = {
  id: string
  title: string
  status: GapStatus
  coverage: string
  evidence: string[]
  gap: string
  recommendation: string
}

type GapSource = AnswerResponse["sources"][number]

const statusConfig = {
  strong: {
    label: "Strong",
    icon: CheckCircle2,
    className: "bg-success/10 text-success",
    borderClassName: "border-l-success",
  },
  partial: {
    label: "Partial",
    icon: CircleDashed,
    className: "bg-warning/15 text-warning-foreground",
    borderClassName: "border-l-warning",
  },
  weak: {
    label: "Weak",
    icon: ShieldAlert,
    className: "bg-orange-50 text-orange-700",
    borderClassName: "border-l-orange-500",
  },
  missing: {
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

function hasAnyPattern(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value))
}

const missingCoveragePatterns = [
  /\bmissing\b/i,
  /\bnot covered\b/i,
  /\bunrelated\b/i,
  /\bwithout (?:mentioning|addressing|including|discussing)\b/i,
  /\bno (?:direct )?evidence\b/i,
  /\bno (?:clear |specific )?(?:reference|references|mention|mentions|indication|sections?|content|provisions?|measures?)\b/i,
  /\bno content related to\b/i,
  /\bnone of (?:the )?(?:content|evidence|excerpts?)\b/i,
  /\bdoes not (?:mention|address|include|discuss|cover|contain)\b/i,
  /\bdo not (?:mention|address|include|discuss|cover|contain)\b/i,
  /\bnot (?:mentioned|addressed|included|discussed|covered)\b/i,
  /\black(?:s|ing)?\b/i,
  /\babsence\b/i,
  /\babsent\b/i,
]

const weakCoveragePatterns = [
  /\bweak\b/i,
  /\blimited\b/i,
  /\binsufficient\b/i,
  /\bminimal\b/i,
  /\bunclear\b/i,
  /\bvague\b/i,
  /\bincomplete\b/i,
]

const partialButIncompletePatterns = [
  /\bbut does not\b/i,
  /\bbut lacks?\b/i,
  /\bdoes not detail\b/i,
  /\bdoes not provide detailed\b/i,
  /\black(?:s|ing)? (?:specific|detailed|clear|formal|proactive)\b/i,
  /\bneed(?:s)? (?:more|specific|detailed|clear|formal)\b/i,
]

const partialCoveragePatterns = [
  /\bpartial(?:ly)?\b/i,
  /\bsome\b/i,
  /\bmoderate\b/i,
  /\bpartly\b/i,
]

const relevantEvidencePatterns = [
  /\bmentions?\b/i,
  /\bdiscuss(?:es|ed)?\b/i,
  /\bemphasiz(?:es|ed)?\b/i,
  /\badvis(?:es|ed)?\b/i,
  /\breferences?\b/i,
  /\bincludes?\b/i,
  /\baddresses?\b/i,
  /\bconsiders?\b/i,
  /\bensure\b/i,
  /\bassess\b/i,
  /\bverify\b/i,
  /\bbias\b/i,
  /\bfairness\b/i,
  /\bexplainab(?:le|ility)\b/i,
  /\btransparent|transparency\b/i,
  /\bprivacy\b/i,
  /\bsecurity\b/i,
  /\baccountab(?:le|ility)\b/i,
  /\boversight\b/i,
  /\bincident\b/i,
  /\baudit(?:able|ability)?\b/i,
]

const strongCoveragePatterns = [
  /\bstrong\b/i,
  /\bcovered\b/i,
  /\badequately covers?\b/i,
  /\bcomprehensive\b/i,
  /\bclearly (?:covers?|addresses?|defines?|states?)\b/i,
  /\b(?:includes?|addresses?|defines?|states?) (?:clear|specific|detailed|explicit|robust)\b/i,
]

function classifyGapStatus({
  coverage,
  evidence,
  gap,
  recommendation,
}: {
  coverage: string
  evidence: string[]
  gap: string
  recommendation: string
}): GapStatus {
  const coverageText = coverage.trim()
  const evidenceText = evidence.join(" ")
  const coverageAndEvidenceText = [coverage, evidenceText].join(" ")
  const allText = [coverage, evidenceText, gap, recommendation].join(" ")
  const hasRelevantCoverageOrEvidence = hasAnyPattern(coverageAndEvidenceText, relevantEvidencePatterns)

  if (hasAnyPattern(coverageText, missingCoveragePatterns)) {
    return "missing"
  }

  if (hasRelevantCoverageOrEvidence && hasAnyPattern(allText, partialButIncompletePatterns)) {
    return "partial"
  }

  if (hasAnyPattern(coverageText, weakCoveragePatterns)) {
    return "weak"
  }

  if (hasAnyPattern(coverageText, partialCoveragePatterns)) {
    return "partial"
  }

  if (hasAnyPattern(coverageText, strongCoveragePatterns)) {
    return "strong"
  }

  if (!hasRelevantCoverageOrEvidence && hasAnyPattern(allText, missingCoveragePatterns)) {
    return "missing"
  }

  if (hasAnyPattern(allText, weakCoveragePatterns)) {
    return "weak"
  }

  if (hasAnyPattern(allText, partialCoveragePatterns)) {
    return "partial"
  }

  if (hasAnyPattern(allText, strongCoveragePatterns)) {
    return "strong"
  }

  return gap || recommendation ? "weak" : "partial"
}

function isGapCategory(title: string) {
  return !/(gap analysis|overall assessment|top\s*3|summary|recommendations?)/i.test(title)
}

function extractField(block: string, labels: string[]) {
  const allLabels = [
    "Coverage",
    "Evidence",
    "Gap Identified",
    "Gap",
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

function splitEvidence(value: string) {
  return value
    .split("\n")
    .map(cleanMarkdown)
    .filter(Boolean)
}

function cleanEvidenceSnippet(value: string) {
  return cleanMarkdown(value)
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "")
    .replace(/\s+•\s+/g, " ")
    .trim()
}

function EvidenceList({
  evidence,
  compact,
  itemId,
}: {
  evidence: string[]
  compact: boolean
  itemId: string
}) {
  const visibleEvidence = evidence.slice(0, compact ? 1 : 3).map(cleanEvidenceSnippet)

  if (visibleEvidence.length === 0) {
    return <p className="text-sm text-muted-foreground">No direct evidence returned.</p>
  }

  return (
    <div className="space-y-2">
      {visibleEvidence.map((snippet, index) => (
        <blockquote
          key={`${itemId}-evidence-${index}`}
          className="rounded-lg border border-border bg-card px-3.5 py-3 shadow-sm shadow-foreground/[0.02]"
        >
          <div className="flex gap-2.5">
            <Quote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-foreground">{snippet}</p>
          </div>
        </blockquote>
      ))}
    </div>
  )
}

function parseGapAnalysis(answer: string): ParsedGapItem[] {
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
    .filter((match) => isGapCategory(match.title))
    .sort((a, b) => a.index - b.index)

  if (matches.length === 0) {
    return []
  }

  return matches.flatMap((match, index) => {
    const start = match.index + match.fullHeading.length
    const end = matches[index + 1]?.index ?? normalized.length
    const block = normalized.slice(start, end)
    const coverage = extractField(block, ["Coverage"])
    const evidence = splitEvidence(extractField(block, ["Evidence"]))
    const gap = extractField(block, ["Gap Identified", "Gap"])
    const recommendation = extractField(block, ["Recommendation", "Recommendations"])

    if (!coverage && evidence.length === 0 && !gap && !recommendation) {
      return []
    }

    return [
      {
        id: `${index}-${match.title}`,
        title: match.title,
        status: classifyGapStatus({ coverage, evidence, gap, recommendation }),
        coverage,
        evidence,
        gap,
        recommendation,
      },
    ]
  })
}

function uniqueSources(sources: GapSource[]) {
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

function GapStatusBadge({ status }: { status: GapStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", config.className)}>
      <Icon className="size-3.5" />
      {config.label}
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
  status: GapStatus
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

function RiskPanel({
  items,
  loading,
  disabled,
  onGenerate,
}: {
  items: ParsedGapItem[]
  loading: boolean
  disabled: boolean
  onGenerate: () => void
}) {
  const missingCount = items.filter((item) => item.status === "missing").length
  const weakCount = items.filter((item) => item.status === "weak").length
  const partialCount = items.filter((item) => item.status === "partial").length
  const priorityItem =
    items.find((item) => item.status === "missing") ??
    items.find((item) => item.status === "weak") ??
    items.find((item) => item.status === "partial") ??
    items[0]
  const riskLevel =
    missingCount >= 3 || missingCount + weakCount >= 5
      ? "High"
      : missingCount + weakCount >= 2 || partialCount >= 4
        ? "Medium"
        : items.length > 0
          ? "Low"
          : "Not assessed"
  const riskClassName =
    riskLevel === "High"
      ? "bg-destructive/10 text-destructive"
      : riskLevel === "Medium"
        ? "bg-warning/15 text-warning-foreground"
        : riskLevel === "Low"
          ? "bg-success/10 text-success"
          : "bg-muted text-muted-foreground"

  return (
    <Card className="flex flex-col gap-5 p-6 lg:sticky lg:top-20 lg:col-span-1 lg:self-start">
      <div>
        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">Gap Analysis</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Identify missing or weak Responsible AI controls from the indexed document.
        </p>
      </div>

      {items.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">Overall risk</span>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", riskClassName)}>
              {riskLevel}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xl font-semibold text-foreground">{missingCount + weakCount}</p>
              <p className="text-xs text-muted-foreground">Missing or weak</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">{items.length}</p>
              <p className="text-xs text-muted-foreground">Areas assessed</p>
            </div>
          </div>
          {priorityItem && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">Top priority</p>
              <p className="mt-1 text-sm font-medium leading-snug text-foreground">{priorityItem.title}</p>
            </div>
          )}
        </div>
      )}

      <Button onClick={onGenerate} disabled={disabled || loading}>
        <ChartColumnIncreasing className="size-4" />
        {loading ? "Generating..." : "Generate Gap Analysis"}
      </Button>
    </Card>
  )
}

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
  const gapItems = result ? parseGapAnalysis(result.answer) : []
  const visibleItems = compact ? gapItems.slice(0, 3) : gapItems
  const strongCount = gapItems.filter((item) => item.status === "strong").length
  const partialCount = gapItems.filter((item) => item.status === "partial").length
  const weakCount = gapItems.filter((item) => item.status === "weak").length
  const missingCount = gapItems.filter((item) => item.status === "missing").length

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <RiskPanel items={gapItems} loading={loading} disabled={disabled} onGenerate={onGenerate} />

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
            {gapItems.length > 0 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard label="Strong" value={strongCount} status="strong" />
                  <SummaryCard label="Partial" value={partialCount} status="partial" />
                  <SummaryCard label="Weak" value={weakCount} status="weak" />
                  <SummaryCard label="Missing" value={missingCount} status="missing" />
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
                            <p className="mt-1 text-xs text-muted-foreground">Responsible AI risk area</p>
                          </div>
                          <GapStatusBadge status={item.status} />
                        </div>

                        <div className="grid gap-3">
                          {item.coverage && (
                            <div className="rounded-lg bg-muted/30 p-3">
                              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Coverage
                              </p>
                              <p className="text-sm leading-relaxed text-foreground">{item.coverage}</p>
                            </div>
                          )}

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg bg-muted/30 p-3">
                              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Evidence
                              </p>
                              <EvidenceList evidence={item.evidence} compact={compact} itemId={item.id} />
                            </div>

                            {item.gap && (
                              <div className="rounded-lg bg-muted/30 p-3">
                                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                  Gap Identified
                                </p>
                                <p className="text-sm leading-relaxed text-foreground">{item.gap}</p>
                              </div>
                            )}
                          </div>

                          {item.recommendation && (
                            <div className="rounded-lg bg-muted/30 p-3">
                              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Recommendation
                              </p>
                              <p className="text-sm leading-relaxed text-foreground">{item.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )
                  })}
                </div>

                {compact && gapItems.length > visibleItems.length && (
                  <p className="text-center text-xs text-muted-foreground">
                    Showing {visibleItems.length} of {gapItems.length} risk areas.
                  </p>
                )}
              </>
            )}

            {gapItems.length === 0 && <MarkdownFallback answer={result.answer} compact={compact} />}

            <SourceList result={result} compact={compact} />
          </div>
        )}
      </Card>
    </div>
  )
}
