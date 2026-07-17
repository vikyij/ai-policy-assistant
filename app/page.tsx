"use client"

import { useRef, useState } from "react"
import { Sidebar, type ViewId } from "@/components/dashboard/sidebar"
import { Topbar, type NotificationItem } from "@/components/dashboard/topbar"
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const documentVersionRef = useRef(0)
  const documentLocked = uploading || checklistLoading || gapLoading

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

  function addNotification(
    notification: Pick<NotificationItem, "title" | "description" | "type">,
  ) {
    setNotifications((current) => [
      {
        ...notification,
        id: `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: Date.now(),
        read: false,
      },
      ...current,
    ].slice(0, 20))
  }

  function markNotificationsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    )
  }

  function clearNotifications() {
    setNotifications([])
  }

  async function handleUpload(file: File) {
    if (documentLocked) return

    documentVersionRef.current += 1
    const requestVersion = documentVersionRef.current

    setUploading(true)
    setUploadError(null)
    setDocument(null)
    setChecklist(null)
    setGapAnalysis(null)
    setMessages(initialMessages)

    try {
      const result = await uploadDocument(file)
      if (documentVersionRef.current === requestVersion) {
        setDocument(result)
        addNotification({
          title: "Document indexed",
          description: `${result.document} is ready for questions, checklist generation, and gap analysis.`,
          type: "success",
        })
      }
    } catch (error) {
      if (documentVersionRef.current === requestVersion) {
        const message = error instanceof Error ? error.message : "Upload failed."
        setUploadError(message)
        addNotification({
          title: "Upload failed",
          description: message,
          type: "error",
        })
      }
    } finally {
      if (documentVersionRef.current === requestVersion) {
        setUploading(false)
      }
    }
  }

  function clearDocument() {
    if (documentLocked) return

    const removedDocument = document?.document

    documentVersionRef.current += 1
    setDocument(null)
    setUploadError(null)
    setChecklist(null)
    setGapAnalysis(null)
    setMessages(initialMessages)

    if (removedDocument) {
      addNotification({
        title: "Document removed",
        description: `${removedDocument} was cleared from the current workspace.`,
        type: "neutral",
      })
    }
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
      const message = error instanceof Error ? error.message : "I could not generate an answer."
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: message,
      }
      setMessages((current) => [...current, assistantMessage])
      addNotification({
        title: "Question failed",
        description: message,
        type: "error",
      })
    } finally {
      setThinking(false)
    }
  }

  async function handleChecklist() {
    if (!document) return

    const requestVersion = documentVersionRef.current
    setChecklistLoading(true)

    try {
      const result = await generateChecklist()
      if (documentVersionRef.current === requestVersion) {
        setChecklist(result)
        addNotification({
          title: "Checklist generated",
          description: `${document.document} was assessed against the Responsible AI checklist.`,
          type: "success",
        })
      }
    } catch (error) {
      if (documentVersionRef.current === requestVersion) {
        const message = error instanceof Error ? error.message : "Checklist generation failed."
        setChecklist({
          answer: message,
          sources: [],
        })
        addNotification({
          title: "Checklist failed",
          description: message,
          type: "error",
        })
      }
    } finally {
      setChecklistLoading(false)
    }
  }

  async function handleGapAnalysis() {
    if (!document) return

    const requestVersion = documentVersionRef.current
    setGapLoading(true)

    try {
      const result = await generateGapAnalysis()
      if (documentVersionRef.current === requestVersion) {
        setGapAnalysis(result)
        addNotification({
          title: "Gap analysis completed",
          description: `${document.document} was reviewed for weak or missing Responsible AI controls.`,
          type: "warning",
        })
      }
    } catch (error) {
      if (documentVersionRef.current === requestVersion) {
        const message = error instanceof Error ? error.message : "Gap analysis generation failed."
        setGapAnalysis({
          answer: message,
          sources: [],
        })
        addNotification({
          title: "Gap analysis failed",
          description: message,
          type: "error",
        })
      }
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
        <Topbar
          title={meta[view].title}
          subtitle={meta[view].subtitle}
          notifications={notifications}
          onMenu={() => setNavOpen(true)}
          onMarkNotificationsRead={markNotificationsRead}
          onClearNotifications={clearNotifications}
        />

        <main className="min-h-0 flex-1 overflow-y-auto">
          {view === "assistant" ? (
            <div className="grid min-h-full gap-4 p-3 md:gap-5 md:p-6 lg:h-full lg:min-h-0 lg:grid-cols-[1fr_340px]">
              <Card className="h-[calc(100dvh-6.5rem)] min-h-[540px] overflow-hidden lg:h-full lg:min-h-0">
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
                    locked={documentLocked}
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
                  documentLocked={documentLocked}
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
                      locked={documentLocked}
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
