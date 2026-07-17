"use client"

import {
  ArrowRight,
  ChartColumnIncreasing,
  CheckCircle2,
  CircleDashed,
  FileText,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Upload,
} from "lucide-react"
import type { AnswerResponse, UploadResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ViewId } from "./sidebar"
import { DocumentStatusCard } from "./document-status-card"
import { PdfUpload } from "./pdf-upload"
import { Card } from "./ui"

type OverviewStatus = "strong" | "partial" | "weak" | "missing" | "pending"

type PriorityFinding = {
  title: string
  status: Exclude<OverviewStatus, "pending">
  description: string
  source: "Checklist" | "Gap Analysis"
}

const statusConfig = {
  strong: {
    label: "Strong",
    icon: CheckCircle2,
    className: "bg-success/10 text-success",
  },
  partial: {
    label: "Partial",
    icon: CircleDashed,
    className: "bg-warning/15 text-warning-foreground",
  },
  weak: {
    label: "Weak",
    icon: TriangleAlert,
    className: "bg-orange-50 text-orange-700",
  },
  missing: {
    label: "Missing",
    icon: TriangleAlert,
    className: "bg-destructive/10 text-destructive",
  },
  pending: {
    label: "Pending",
    icon: CircleDashed,
    className: "bg-muted text-muted-foreground",
  },
}

function cleanMarkdown(value: string) {
  return value
    .replace(/^[-*\s]+/, "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "")
    .trim()
}

function getSectionMatches(answer: string, skipPattern: RegExp) {
  const normalized = answer.replace(/\r\n/g, "\n")
  const markdownHeadingPattern = /(?:^|\n)\s*#{2,6}\s*(?:\d+\.?\s*)?(.+?)(?=\n)/g
  const numberedHeadingPattern = /(?:^|\n)\s*(?:\d+[\.)]\s+)([^:\n]+?)(?=\n)/g

  return [
    ...Array.from(normalized.matchAll(markdownHeadingPattern)),
    ...Array.from(normalized.matchAll(numberedHeadingPattern)),
  ]
    .map((match) => ({
      title: cleanMarkdown(match[1]),
      index: match.index ?? 0,
      fullHeading: match[0],
    }))
    .filter((match) => !skipPattern.test(match.title))
    .sort((a, b) => a.index - b.index)
    .map((match, index, matches) => {
      const start = match.index + match.fullHeading.length
      const end = matches[index + 1]?.index ?? normalized.length

      return {
        title: match.title,
        block: normalized.slice(start, end),
      }
    })
}

function extractField(block: string, labels: string[]) {
  const allLabels = [
    "Status",
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

function hasAnyPattern(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value))
}

const missingPatterns = [
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

const weakPatterns = [
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

const partialPatterns = [
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

function classifyStatus(value: string): Exclude<OverviewStatus, "pending"> {
  if (hasAnyPattern(value, missingPatterns)) return "missing"
  if (hasAnyPattern(value, weakPatterns)) return "weak"
  if (hasAnyPattern(value, partialPatterns)) return "partial"
  return "strong"
}

function parseInlineChecklistSummary(answer: string) {
  return answer
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => cleanMarkdown(line))
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(
        /^(\d+)[\.)]\s*([^:]+):\s*(covered|partially covered|partial|missing|not covered)\s*(?:[-–—]\s*)?(.+)?$/i,
      )

      if (!match) return []

      const title = cleanMarkdown(match[2])
      const status = cleanMarkdown(match[3])
      const evidence = cleanMarkdown(match[4] ?? "")

      if (!title || /checklist|summary|recommendations?|overall assessment|top\s*3|introduction|conclusion/i.test(title)) {
        return []
      }

      return [{
        title,
        status: classifyStatus(status),
        recommendation: evidence,
      }]
    })
}

function classifyGapStatus({
  coverage,
  evidence,
  gap,
  recommendation,
}: {
  coverage: string
  evidence: string
  gap: string
  recommendation: string
}): Exclude<OverviewStatus, "pending"> {
  const coverageText = coverage.trim()
  const coverageAndEvidenceText = [coverage, evidence].join(" ")
  const allText = [coverage, evidence, gap, recommendation].join(" ")
  const hasRelevantCoverageOrEvidence = hasAnyPattern(coverageAndEvidenceText, relevantEvidencePatterns)

  if (hasAnyPattern(coverageText, missingPatterns)) return "missing"
  if (hasRelevantCoverageOrEvidence && hasAnyPattern(allText, partialButIncompletePatterns)) return "partial"
  if (hasAnyPattern(coverageText, weakPatterns)) return "weak"
  if (hasAnyPattern(coverageText, partialPatterns)) return "partial"
  if (hasAnyPattern(coverageText, [/\bstrong\b/i, /\bcovered\b/i, /\badequately covers?\b/i])) return "strong"
  if (!hasRelevantCoverageOrEvidence && hasAnyPattern(allText, missingPatterns)) return "missing"
  if (hasAnyPattern(allText, weakPatterns)) return "weak"
  if (hasAnyPattern(allText, partialPatterns)) return "partial"

  return gap || recommendation ? "weak" : "partial"
}

function getChecklistSummary(checklist: AnswerResponse | null) {
  const items = checklist
    ? (parseInlineChecklistSummary(checklist.answer).length > 0
        ? parseInlineChecklistSummary(checklist.answer)
        : getSectionMatches(checklist.answer, /checklist|summary|recommendations?|overall assessment|top\s*3|introduction|conclusion/i)
        .map(({ title, block }) => {
          const status = extractField(block, ["Status"]) || block
          const recommendation = extractField(block, ["Recommendation", "Recommendations"])

          return {
            title,
            status: classifyStatus(status),
            recommendation,
          }
        })
        .filter((item) => item.title))
    : []

  return {
    covered: items.filter((item) => item.status === "strong").length,
    partial: items.filter((item) => item.status === "partial" || item.status === "weak").length,
    missing: items.filter((item) => item.status === "missing").length,
    priorityFindings: items
      .filter((item) => item.status === "missing" || item.status === "weak")
      .slice(0, 3)
      .map((item) => ({
        title: item.title,
        status: (item.status === "weak" ? "weak" : "missing") as "weak" | "missing",
        description: item.recommendation || "Review this checklist area in the full report.",
        source: "Checklist" as const,
      })),
  }
}

function getGapSummary(gapAnalysis: AnswerResponse | null) {
  const items = gapAnalysis
    ? getSectionMatches(gapAnalysis.answer, /gap analysis|summary|recommendations?|overall assessment|top\s*3/i)
        .map(({ title, block }) => {
          const coverage = extractField(block, ["Coverage"])
          const evidence = extractField(block, ["Evidence"])
          const gap = extractField(block, ["Gap Identified", "Gap"])
          const recommendation = extractField(block, ["Recommendation", "Recommendations"])
          const status = classifyGapStatus({ coverage, evidence, gap, recommendation })

          return {
            title,
            status,
            gap,
            recommendation,
          }
        })
        .filter((item) => item.title)
    : []

  const missing = items.filter((item) => item.status === "missing").length
  const weak = items.filter((item) => item.status === "weak").length
  const partial = items.filter((item) => item.status === "partial").length
  const strong = items.filter((item) => item.status === "strong").length
  const risk =
    missing >= 3 || missing + weak >= 5
      ? "High"
      : missing + weak >= 2 || partial >= 4
        ? "Medium"
        : items.length > 0
          ? "Low"
          : "Pending"

  return {
    strong,
    partial,
    weak,
    missing,
    risk,
    priorityFindings: items
      .filter((item) => item.status === "missing" || item.status === "weak")
      .slice(0, 3)
      .map((item) => ({
        title: item.title,
        status: (item.status === "weak" ? "weak" : "missing") as "weak" | "missing",
        description: item.gap || item.recommendation || "Review this risk area in the full report.",
        source: "Gap Analysis" as const,
      })),
  }
}

function StatusPill({ status }: { status: OverviewStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", config.className)}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  )
}

function SummaryMetric({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string
  value: string | number
  icon: typeof ShieldCheck
  className: string
}) {
  return (
    <Card className="p-4">
      <div className={cn("mb-3 flex size-9 items-center justify-center rounded-lg", className)}>
        <Icon className="size-4.5" />
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  )
}

function PriorityFindings({
  findings,
  onNavigate,
}: {
  findings: PriorityFinding[]
  onNavigate: (view: ViewId) => void
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Priority Findings</p>
          <p className="text-xs text-muted-foreground">Top areas that need attention</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate("gaps")}>
          View report
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {findings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
          <p className="text-sm font-medium text-foreground">No priority findings yet</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Generate the checklist or gap analysis to surface missing and weak Responsible AI controls.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {findings.map((finding, index) => (
            <div key={`${finding.source}-${finding.title}-${index}`} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{finding.title}</p>
                  <p className="text-xs text-muted-foreground">{finding.source}</p>
                </div>
                <StatusPill status={finding.status} />
              </div>
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{finding.description}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function QuickActions({
  disabled,
  checklistLoading,
  gapLoading,
  onGenerateChecklist,
  onGenerateGapAnalysis,
  onNavigate,
}: {
  disabled: boolean
  checklistLoading: boolean
  gapLoading: boolean
  onGenerateChecklist: () => void
  onGenerateGapAnalysis: () => void
  onNavigate: (view: ViewId) => void
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-foreground">Quick Actions</p>
      <p className="mb-4 text-xs text-muted-foreground">Move into the full workflow when you need detail.</p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={() => onNavigate("assistant")} disabled={disabled}>
          <MessageSquareText className="size-4" />
          Ask policy question
        </Button>
        <Button variant="outline" onClick={onGenerateChecklist} disabled={disabled || checklistLoading}>
          <ListChecks className="size-4" />
          {checklistLoading ? "Generating..." : "Generate checklist"}
        </Button>
        <Button variant="outline" onClick={onGenerateGapAnalysis} disabled={disabled || gapLoading}>
          <ChartColumnIncreasing className="size-4" />
          {gapLoading ? "Generating..." : "Run gap analysis"}
        </Button>
        <Button variant="outline" onClick={() => onNavigate("documents")}>
          <Upload className="size-4" />
          Manage document
        </Button>
      </div>
    </Card>
  )
}

export function OverviewDashboard({
  document,
  uploading,
  uploadError,
  checklist,
  checklistLoading,
  gapAnalysis,
  gapLoading,
  chatCount,
  onUpload,
  onClear,
  documentLocked,
  onGenerateChecklist,
  onGenerateGapAnalysis,
  onNavigate,
}: {
  document: UploadResponse | null
  uploading: boolean
  uploadError: string | null
  checklist: AnswerResponse | null
  checklistLoading: boolean
  gapAnalysis: AnswerResponse | null
  gapLoading: boolean
  chatCount: number
  onUpload: (file: File) => void
  onClear: () => void
  documentLocked: boolean
  onGenerateChecklist: () => void
  onGenerateGapAnalysis: () => void
  onNavigate: (view: ViewId) => void
}) {
  const checklistSummary = getChecklistSummary(checklist)
  const gapSummary = getGapSummary(gapAnalysis)
  const priorityFindings = [
    ...gapSummary.priorityFindings,
    ...checklistSummary.priorityFindings,
  ].slice(0, 3)
  const checklistStatus: OverviewStatus = !checklist
    ? "pending"
    : checklistSummary.missing > checklistSummary.covered &&
        checklistSummary.missing >= checklistSummary.partial
      ? "missing"
      : checklistSummary.partial > 0 || checklistSummary.missing > 0
        ? "partial"
        : "strong"
  const riskStatus =
    gapSummary.risk === "High"
      ? "missing"
      : gapSummary.risk === "Medium"
        ? "weak"
        : gapSummary.risk === "Low"
          ? "strong"
          : "pending"

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryMetric
          label="Document"
          value={document ? "Indexed" : "Waiting"}
          icon={ShieldCheck}
          className={document ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
        />
        <SummaryMetric
          label="Checklist"
          value={checklist ? `${checklistSummary.missing} missing` : "Pending"}
          icon={ListChecks}
          className={checklist ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"}
        />
        <SummaryMetric
          label="Gap Risk"
          value={gapSummary.risk}
          icon={TriangleAlert}
          className={statusConfig[riskStatus].className}
        />
        <SummaryMetric
          label="Chat Questions"
          value={chatCount}
          icon={FileText}
          className="bg-accent text-accent-foreground"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_380px]">
        <div className="flex flex-col gap-5">
          <PriorityFindings findings={priorityFindings} onNavigate={onNavigate} />

          <Card className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Analysis Snapshot</p>
                <p className="text-xs text-muted-foreground">A compact summary of generated reports</p>
              </div>
              <Sparkles className="size-4 text-muted-foreground" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Checklist</p>
                  <StatusPill status={checklistStatus} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{checklistSummary.covered}</p>
                    <p className="text-xs text-muted-foreground">Covered</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{checklistSummary.partial}</p>
                    <p className="text-xs text-muted-foreground">Partial</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{checklistSummary.missing}</p>
                    <p className="text-xs text-muted-foreground">Missing</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Gap Analysis</p>
                  <StatusPill status={riskStatus} />
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{gapSummary.strong}</p>
                    <p className="text-xs text-muted-foreground">Strong</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{gapSummary.partial}</p>
                    <p className="text-xs text-muted-foreground">Partial</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{gapSummary.weak}</p>
                    <p className="text-xs text-muted-foreground">Weak</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{gapSummary.missing}</p>
                    <p className="text-xs text-muted-foreground">Missing</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <QuickActions
            disabled={!document}
            checklistLoading={checklistLoading}
            gapLoading={gapLoading}
            onGenerateChecklist={onGenerateChecklist}
            onGenerateGapAnalysis={onGenerateGapAnalysis}
            onNavigate={onNavigate}
          />
        </div>

        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">Upload Documents</p>
            <PdfUpload
              document={document}
              uploading={uploading}
              error={uploadError}
              locked={documentLocked}
              onUpload={onUpload}
              onClear={onClear}
            />
          </Card>
          <DocumentStatusCard document={document} />
        </div>
      </div>
    </div>
  )
}
