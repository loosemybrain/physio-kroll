"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

type OutlineKind = "hero" | "static"

type StaticLegalOutlineItemProps = {
  id: string
  /** Kurzer Typ-Name (Badge). */
  label: string
  preview?: string
  /** Eine kompakte Zeile für collapsed (gekürzter Klartext). */
  collapsedPrimary: string
  outlineKind: OutlineKind
  isSelected: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  onSelect: (id: string) => void
}

const kindBadge: Record<OutlineKind, { text: string; className: string }> = {
  hero: {
    text: "Header",
    className:
      "border border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100 h-4 px-1 text-[9px] font-medium leading-none",
  },
  static: {
    text: "Block",
    className:
      "border border-border bg-muted/80 text-muted-foreground h-4 px-1 text-[9px] font-medium leading-none",
  },
}

export function StaticLegalOutlineItem({
  id,
  label,
  preview,
  collapsedPrimary,
  outlineKind,
  isSelected,
  isExpanded,
  onToggleExpanded,
  onSelect,
}: StaticLegalOutlineItemProps) {
  const kb = kindBadge[outlineKind]

  return (
    <div
      data-outline-block-id={id}
      className={cn(
        "group/item rounded-md border text-left transition-[box-shadow,background-color,border-color]",
        outlineKind === "hero"
          ? "border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10"
          : "border-border bg-muted/15",
        !isSelected && "hover:border-muted-foreground/20 hover:bg-muted/35",
        isSelected &&
          "border-primary ring-2 ring-primary/35 bg-primary/[0.07] shadow-sm dark:bg-primary/20"
      )}
    >
      <div className={cn("flex items-stretch gap-0.5", isExpanded ? "p-1.5" : "px-1 py-0.5")}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 text-muted-foreground hover:text-foreground",
            isExpanded ? "h-7 w-7" : "h-6 w-6"
          )}
          aria-label={isExpanded ? "Einklappen" : "Aufklappen"}
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleExpanded()
          }}
        >
          <ChevronRight
            className={cn(
              "transition-transform duration-200",
              isExpanded ? "h-3.5 w-3.5" : "h-3 w-3",
              isExpanded && "rotate-90"
            )}
          />
        </Button>

        <button
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            "min-w-0 flex-1 rounded-sm px-0.5 py-0 text-left outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          )}
        >
          {isExpanded ? (
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-snug text-foreground">{label}</p>
                {preview ? (
                  <p className="mt-0.5 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">{preview}</p>
                ) : null}
              </div>
              <Badge variant="outline" className={cn("shrink-0 font-normal", kb.className)}>
                {kb.text}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{collapsedPrimary}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground/85">{label}</p>
              </div>
              <Badge variant="outline" className={cn("shrink-0 self-center font-normal", kb.className)}>
                {kb.text}
              </Badge>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
