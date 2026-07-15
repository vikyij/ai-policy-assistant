"use client"

import { useState } from "react"
import { Sidebar, type ViewId } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { PdfUpload } from "@/components/dashboard/pdf-upload"
import { DocumentStatusCard } from "@/components/dashboard/document-status-card"
import { ChatInterface } from "@/components/dashboard/chat-interface"
import { ChecklistReport } from "@/components/dashboard/checklist-report"
import { GapAnalysis } from "@/components/dashboard/gap-analysis"
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard"
import { Card } from "@/components/dashboard/ui"
import {
  askQuestion,
  generateChecklist,
  generateGapAnalysis,
  uploadDocument,
  type AnswerResponse,
  type ApiSource,
  type UploadResponse,
} from "@/lib/api"
import { initialMessages, suggestedQuestions as fallbackSuggestedQuestions, type ChatMessage } from "@/lib/data"

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
  const [document, setDocument] = useState<UploadResponse | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [thinking, setThinking] = useState(false)
  const [checklist, setChecklist] = useState<AnswerResponse | null>(null)
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [gapAnalysis, setGapAnalysis] = useState<AnswerResponse | null>(null)
  const [gapLoading, setGapLoading] = useState(false)

  const activeQuestions = document?.suggested_questions.length
    ? document.suggested_questions
    : fallbackSuggestedQuestions

  function sourcesToCitations(sources: ApiSource[]) {
    return sources.slice(0, 4).map((source, index) => ({
      id: index + 1,
      document: source.document,
      section: `Similarity ${source.score.toFixed(3)}`,
      page: source.page,
      quote: source.text.slice(0, 500),
    }))
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError(null)
    setDocument(null)
    setChecklist(null)
    setGapAnalysis(null)
    setMessages(initialMessages)

    try {
      const result = await uploadDocument(file)
      setDocument(result)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  function clearDocument() {
    setDocument(null)
    setUploadError(null)
    setChecklist(null)
    setGapAnalysis(null)
    setMessages(initialMessages)
  }

  async function handleSend(question: string) {
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
    }

    setMessages((current) => [...current, userMessage])
    setThinking(true)

    try {
      const result = await askQuestion(question)
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        citations: sourcesToCitations(result.sources),
      }
      setMessages((current) => [...current, assistantMessage])
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: error instanceof Error ? error.message : "I could not generate an answer.",
      }
      setMessages((current) => [...current, assistantMessage])
    } finally {
      setThinking(false)
    }
  }

  async function handleChecklist() {
    setChecklistLoading(true)

    try {
      const result = await generateChecklist()
      setChecklist(result)
    } catch (error) {
      setChecklist({
        answer: error instanceof Error ? error.message : "Checklist generation failed.",
        sources: [],
      })
    } finally {
      setChecklistLoading(false)
    }
  }

  async function handleGapAnalysis() {
    setGapLoading(true)

    try {
      const result = await generateGapAnalysis()
      setGapAnalysis(result)
    } catch (error) {
      setGapAnalysis({
        answer: error instanceof Error ? error.message : "Gap analysis generation failed.",
        sources: [],
      })
    } finally {
      setGapLoading(false)
    }
  }

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
                <ChatInterface
                  messages={messages}
                  suggestedQuestions={activeQuestions}
                  thinking={thinking}
                  disabled={!document}
                  onSend={handleSend}
                />
              </Card>
              <div className="flex flex-col gap-5">
                <Card className="p-5">
                  <p className="mb-3 text-sm font-semibold text-foreground">Upload Documents</p>
                  <PdfUpload
                    document={document}
                    uploading={uploading}
                    error={uploadError}
                    onUpload={handleUpload}
                    onClear={clearDocument}
                  />
                </Card>
                <DocumentStatusCard document={document} />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl p-4 md:p-6">
              {view === "overview" && (
                <OverviewDashboard
                  document={document}
                  uploading={uploading}
                  uploadError={uploadError}
                  checklist={checklist}
                  checklistLoading={checklistLoading}
                  gapAnalysis={gapAnalysis}
                  gapLoading={gapLoading}
                  chatCount={messages.filter((message) => message.role === "user").length}
                  onUpload={handleUpload}
                  onClear={clearDocument}
                  onGenerateChecklist={handleChecklist}
                  onGenerateGapAnalysis={handleGapAnalysis}
                  onNavigate={setView}
                />
              )}

              {view === "checklist" && (
                <ChecklistReport
                  result={checklist}
                  loading={checklistLoading}
                  disabled={!document}
                  onGenerate={handleChecklist}
                />
              )}
              {view === "gaps" && (
                <GapAnalysis
                  result={gapAnalysis}
                  loading={gapLoading}
                  disabled={!document}
                  onGenerate={handleGapAnalysis}
                />
              )}

              {view === "documents" && (
                <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                  <Card className="p-5">
                    <p className="mb-3 text-sm font-semibold text-foreground">Upload Documents</p>
                    <PdfUpload
                      document={document}
                      uploading={uploading}
                      error={uploadError}
                      onUpload={handleUpload}
                      onClear={clearDocument}
                    />
                  </Card>
                  <DocumentStatusCard document={document} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
