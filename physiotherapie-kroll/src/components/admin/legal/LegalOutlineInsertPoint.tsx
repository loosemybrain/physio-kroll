"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

export function LegalOutlineInsertPoint({
  index,
  onInsert,
  compact,
}: {
  index: number
  onInsert: (index: number) => void
  compact?: boolean
}) {
  return (
    <div className={cn("group/insert relative", compact ? "py-0.5" : "py-1")}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "relative h-7 w-full justify-center rounded-md px-0",
          "hover:bg-transparent"
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onInsert(index)
        }}
        title="Neuen Abschnitt hier einfügen"
        aria-label="Abschnitt hier einfügen"
      >
        {/* Idle sichtbar: Linie + kleine Pill; Hover/Focus verstärkt */}
        <span
          className={cn(
            "absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/70",
            "group-hover/insert:bg-primary/40 group-focus-visible/insert:bg-primary/40"
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "relative inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-[10px] leading-none",
            "border-border/80 text-muted-foreground shadow-sm",
            "opacity-80",
            "group-hover/insert:opacity-100 group-hover/insert:text-foreground group-hover/insert:border-border",
            "group-focus-visible/insert:opacity-100 group-focus-visible/insert:text-foreground group-focus-visible/insert:border-border"
          )}
        >
          <Plus className="h-3 w-3" />
          <span className={cn("hidden sm:inline", "text-[10px]")}>
            {compact ? "Einfügen" : "Abschnitt einfügen"}
          </span>
        </span>
      </Button>
    </div>
  )
}

