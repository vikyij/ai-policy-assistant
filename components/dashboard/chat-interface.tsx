"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, Sparkles, Quote, FileText, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "@/lib/data"
import { cn } from "@/lib/utils"

type ChatInterfaceProps = {
  messages: ChatMessage[]
  suggestedQuestions: string[]
  thinking: boolean
  disabled: boolean
  onSend: (question: string) => void
}

export function ChatInterface({
  messages,
  suggestedQuestions,
  thinking,
  disabled,
  onSend,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, thinking])

  function send(text: string) {
    const value = text.trim()
    if (!value || thinking || disabled) return

    setInput("")
    onSend(value)
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">Policy Assistant</p>
          <p className="text-xs text-muted-foreground">Grounded in your uploaded documents</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <ShieldCheck className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground">
                  {msg.content}
                </div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Quote className="size-3.5" />
                      {msg.citations.length} citations
                    </p>
                    {msg.citations.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-border bg-muted/40 p-3"
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                            {c.id}
                          </span>
                          <FileText className="size-3.5 text-muted-foreground" />
                          <span className="truncate text-xs font-medium text-foreground">
                            {c.document}
                          </span>
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                            {c.section} · p.{c.page}
                          </span>
                        </div>
                        <p className="border-l-2 border-primary/40 pl-3 text-xs italic leading-relaxed text-muted-foreground">
                          {`"${c.quote}"`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}

        {thinking && (
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-4">
        {disabled && (
          <p className="mb-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Upload and index a PDF before asking questions.
          </p>
        )}

        {messages.length <= 1 && (
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={disabled || thinking}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 focus-within:border-primary/50 focus-within:ring-3 focus-within:ring-ring/20"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault()
                send(input)
              }
            }}
            rows={1}
            placeholder="Ask about your Responsible AI policy…"
            disabled={disabled}
            className={cn(
              "max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground",
              disabled && "cursor-not-allowed opacity-60",
            )}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || thinking || disabled} aria-label="Send">
            <ArrowUp className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
