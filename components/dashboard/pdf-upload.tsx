"use client"

import { useRef, useState } from "react"
import { UploadCloud, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UploadResponse } from "@/lib/api"
import { cn } from "@/lib/utils"

type PdfUploadProps = {
  document: UploadResponse | null
  uploading: boolean
  error: string | null
  onUpload: (file: File) => void
  onClear: () => void
}

export function PdfUpload({ document, uploading, error, onUpload, onClear }: PdfUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [pendingFile, setPendingFile] = useState<{ name: string; size: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null) {
    if (!list) return
    const file = Array.from(list).find((item) => item.type === "application/pdf" || item.name.endsWith(".pdf"))
    if (!file) return

    setPendingFile({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    })
    onUpload(file)
  }

  const visibleFile = document
    ? {
        name: document.document,
        detail: `${document.pages_processed} pages · ${document.chunks_indexed} chunks indexed`,
        status: "Analyzed",
      }
    : pendingFile
      ? {
          name: pendingFile.name,
          detail: pendingFile.size,
          status: uploading ? "Indexing..." : "Ready",
        }
      : null

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          uploading && "pointer-events-none opacity-70",
          dragging
            ? "border-primary bg-accent"
            : "border-border bg-muted/40 hover:border-primary/50 hover:bg-accent/50",
        )}
      >
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <UploadCloud className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Drop policy PDFs here, or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF up to 25 MB — documents are analyzed against your RAI framework
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/[0.04] px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {visibleFile && (
        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">{visibleFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {visibleFile.detail} · {visibleFile.status}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${visibleFile.name}`}
              onClick={() => {
                setPendingFile(null)
                onClear()
              }}
            >
              <X className="size-4" />
            </Button>
          </li>
        </ul>
      )}
    </div>
  )
}
