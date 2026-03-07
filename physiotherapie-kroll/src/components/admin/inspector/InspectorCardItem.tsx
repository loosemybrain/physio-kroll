"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export const INSPECTOR_CARD_ID_ATTR = "data-inspector-card-id"

export interface InspectorCardItemProps {
  itemId: string
  isExpanded: boolean
  onToggle: () => void
  summary: React.ReactNode
  children: React.ReactNode
  /** Actions im Header (z. B. Delete, Duplicate, Move). Keine <button> im summary – hier echte Buttons verwenden. */
  headerActions?: React.ReactNode
  className?: string
}

/**
 * Einzelne einklappbare Inspector-Card.
 * Header ist semantisch button (div mit role="button"), damit keine verschachtelten Buttons entstehen.
 * headerActions rendert echte Buttons (z. B. Löschen) außerhalb des klickbaren Headers.
 * Beim Aufklappen wird Fokus auf das erste Eingabefeld gesetzt.
 */
export function InspectorCardItem({
  itemId,
  isExpanded,
  onToggle,
  summary,
  children,
  headerActions,
  className,
}: InspectorCardItemProps) {
  const contentId = `inspector-card-content-${itemId}`
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Beim Aufklappen: Fokus auf erstes Eingabefeld + Card in den sichtbaren Bereich scrollen
  React.useEffect(() => {
    if (!isExpanded) return
    const el = contentRef.current
    if (!el) return
    const scrollTarget = el.closest("[data-inspector-card-id]") as HTMLElement | null
    scrollTarget?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    const timer = setTimeout(() => {
      const first = el.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")
      first?.focus({ preventScroll: true })
    }, 100)
    return () => clearTimeout(timer)
  }, [isExpanded])

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card overflow-hidden transition-colors",
        isExpanded && "ring-1 ring-primary/30",
        className
      )}
      {...{ [INSPECTOR_CARD_ID_ATTR]: itemId }}
    >
      <div className="flex items-stretch min-w-0">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className={cn(
            "flex-1 flex items-center gap-2 p-2.5 text-left min-w-0",
            "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer"
          )}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onToggle()
            }
          }}
        >
          <div className="flex-1 min-w-0 truncate">{summary}</div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </div>
        {headerActions != null && (
          <div className="flex items-center border-l border-border shrink-0" onClick={(e) => e.stopPropagation()}>
            {headerActions}
          </div>
        )}
      </div>
      <div
        id={contentId}
        ref={contentRef}
        role="region"
        aria-labelledby={undefined}
        hidden={!isExpanded}
        className={cn(!isExpanded && "hidden")}
      >
        {isExpanded && <div className="border-t border-border p-3 space-y-3 bg-muted/20">{children}</div>}
      </div>
    </div>
  )
}
