"use client"

import * as React from "react"
import { InspectorCardItem } from "./InspectorCardItem"
import type { InspectorCardListMode } from "@/hooks/useInspectorCardState"
import { cn } from "@/lib/utils"

export interface InspectorCardListProps<T> {
  items: T[]
  getItemId: (item: T) => string
  renderSummary: (item: T) => React.ReactNode
  renderContent: (item: T) => React.ReactNode
  /** Kontrollierter Modus: welche ID(s) sind offen. Bei single: eine ID oder null. */
  expandedId?: string | null
  expandedIds?: Set<string> | null
  mode?: InspectorCardListMode
  onToggle: (itemId: string) => void
  /** Optional: wenn gesetzt, wird "Alle einklappen" angezeigt und aufgerufen. */
  onCollapseAll?: () => void
  /** Optional: Zähler-Text (z. B. "6 Kurse"). */
  countLabel?: string
  /** Optional: Button "Item hinzufügen". */
  addAction?: React.ReactNode
  /** Optional: Leerzustand. */
  emptyState?: React.ReactNode
  /** Optional: pro Item Actions im Header (z. B. Delete-Button). */
  renderHeaderActions?: (item: T) => React.ReactNode
  className?: string
  listClassName?: string
}

/**
 * Wiederverwendbare Liste einklappbarer Inspector-Cards.
 * Keys immer getItemId(item), nie Index.
 */
export function InspectorCardList<T>({
  items,
  getItemId,
  renderSummary,
  renderContent,
  expandedId = null,
  expandedIds = null,
  mode = "single",
  onToggle,
  onCollapseAll,
  countLabel,
  addAction,
  emptyState,
  renderHeaderActions,
  className,
  listClassName,
}: InspectorCardListProps<T>) {
  const isExpanded = (id: string) =>
    mode === "single" ? expandedId === id : (expandedIds?.has(id) ?? false)

  return (
    <div className={cn("space-y-2", className)}>
      {(countLabel != null || onCollapseAll != null) && (
        <div className="flex items-center justify-between gap-2">
          {countLabel != null && (
            <span className="text-xs text-muted-foreground truncate">{countLabel}</span>
          )}
          {onCollapseAll != null && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={onCollapseAll}
            >
              Alle einklappen
            </button>
          )}
        </div>
      )}
      <div className={cn("flex flex-col gap-1.5", listClassName)}>
        {items.length === 0 && emptyState != null ? (
          emptyState
        ) : (
          items.map((item) => {
            const id = getItemId(item)
            return (
              <InspectorCardItem
                key={id}
                itemId={id}
                isExpanded={isExpanded(id)}
                onToggle={() => onToggle(id)}
                summary={renderSummary(item)}
                headerActions={renderHeaderActions?.(item)}
              >
                {renderContent(item)}
              </InspectorCardItem>
            )
          })
        )}
      </div>
      {addAction != null && addAction}
    </div>
  )
}
