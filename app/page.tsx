"use client"

import { useState } from "react"
import { Sidebar, type ViewId } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { StatCards } from "@/components/dashboard/stat-cards"
import { PdfUpload } from "@/components/dashboard/pdf-upload"
import { DocumentStatusCard } from "@/components/dashboard/document-status-card"
import { ChatInterface } from "@/components/dashboard/chat-interface"
import { ChecklistReport } from "@/components/dashboard/checklist-report"
import { GapAnalysis } from "@/components/dashboard/gap-analysis"
import { Card } from "@/components/dashboard/ui"

const meta: Record<ViewId, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Responsible AI compliance at a glance" },
  assistant: { title: "Policy Assistant", subtitle: "Ask questions with cited sources" },
  checklist: { title: "Responsible AI Checklist", subtitle: "Control-by-control compliance report" },
  gaps: { title: "Gap Analysis", subtitle: "Where your program needs attention" },
  documents: { title: "Documents", subtitle: "Upload and manage policy sources" },
}

export default function Page() {
  const [view, setView] = useState<ViewId>("overview")
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        active={view}
        onNavigate={(id) => {
          setView(id)
          setNavOpen(false)
        }}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={meta[view].title} subtitle={meta[view].subtitle} onMenu={() => setNavOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          {view === "assistant" ? (
            <div className="grid h-full min-h-0 gap-5 p-4 md:p-6 lg:grid-cols-[1fr_340px]">
              <Card className="min-h-0 overflow-hidden lg:h-full">
                <ChatInterface />
              </Card>
              <div className="flex flex-col gap-5">
                <Card className="p-5">
                  <p className="mb-3 text-sm font-semibold text-foreground">Upload Documents</p>
                  <PdfUpload />
                </Card>
                <DocumentStatusCard />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl p-4 md:p-6">
              {view === "overview" && (
                <div className="flex flex-col gap-5">
                  <StatCards />
                  <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                    <Card className="p-5">
                      <p className="mb-3 text-sm font-semibold text-foreground">Upload Documents</p>
                      <PdfUpload />
                    </Card>
                    <DocumentStatusCard />
                  </div>
                  <GapAnalysis compact />
                  <ChecklistReport compact />
                </div>
              )}

              {view === "checklist" && <ChecklistReport />}
              {view === "gaps" && <GapAnalysis />}

              {view === "documents" && (
                <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                  <Card className="p-5">
                    <p className="mb-3 text-sm font-semibold text-foreground">Upload Documents</p>
                    <PdfUpload />
                  </Card>
                  <DocumentStatusCard />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
