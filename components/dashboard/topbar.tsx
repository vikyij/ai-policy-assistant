"use client"

import { Menu, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Topbar({
  title,
  subtitle,
  onMenu,
}: {
  title: string
  subtitle: string
  onMenu: () => void
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <button
        onClick={onMenu}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
      </div>

      <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground lg:flex">
        <Search className="size-4" />
        <input
          placeholder="Search policies…"
          className="w-40 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      <Button variant="outline" size="icon" aria-label="Notifications" className="relative">
        <Bell className="size-4" />
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
      </Button>
    </header>
  )
}
