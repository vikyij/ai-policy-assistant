import { TriangleAlert, TrendingUp } from "lucide-react"
import { gapCategories, checklistItems } from "@/lib/data"
import { Card } from "./ui"

function ScoreRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative flex size-32 items-center justify-center">
      <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">of 100</span>
      </div>
    </div>
  )
}

export function GapAnalysis({ compact = false }: { compact?: boolean }) {
  const overall = Math.round(
    gapCategories.reduce((sum, c) => sum + c.score, 0) / gapCategories.length,
  )
  const totalGaps = checklistItems.filter((i) => i.status === "gap").length
  const totalPartial = checklistItems.filter((i) => i.status === "partial").length

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-semibold text-foreground">Readiness Score</p>
        <ScoreRing score={overall} />
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <TrendingUp className="size-3.5" />
          +6 pts this quarter
        </span>
      </Card>

      <Card className="p-6 lg:col-span-2">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Compliance by Category</p>
            <p className="text-xs text-muted-foreground">Coverage across RAI principles</p>
          </div>
          <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
            <Legend color="bg-success" label="Compliant" />
            <Legend color="bg-warning" label="Partial" />
            <Legend color="bg-destructive" label="Gap" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {gapCategories.map((c) => {
            const total = c.pass + c.partial + c.gap
            return (
              <div key={c.category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{c.category}</span>
                  <span className="text-muted-foreground">{c.score}%</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="bg-success" style={{ width: `${(c.pass / total) * 100}%` }} />
                  <div className="bg-warning" style={{ width: `${(c.partial / total) * 100}%` }} />
                  <div className="bg-destructive" style={{ width: `${(c.gap / total) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {!compact && (
        <Card className="p-6 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <TriangleAlert className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Priority Gaps</p>
              <p className="text-xs text-muted-foreground">
                {totalGaps} open gaps · {totalPartial} partial controls need attention
              </p>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {checklistItems
              .filter((i) => i.status === "gap")
              .map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.04] p-3.5"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                    <TriangleAlert className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.category} · {item.reference}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </span>
  )
}
