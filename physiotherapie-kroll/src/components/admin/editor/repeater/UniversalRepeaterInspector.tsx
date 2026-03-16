"use client"

import * as React from "react"
import { Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InspectorCardList } from "@/components/admin/inspector/InspectorCardList"

export interface UniversalRepeaterInspectorProps<T> {
  /** Items to display (array from block props) */
  items: T[]
  /** Stable id per item (e.g. item.id) */
  getItemId: (item: T) => string
  /** Summary line in card header. Optional if getItemLabel is provided. */
  renderSummary?: (item: T) => React.ReactNode
  /** Short label per item (optional). Used for summary when renderSummary not provided. */
  getItemLabel?: (item: T, index: number) => React.ReactNode
  /** Field list / content when expanded. Index is derived from items. */
  renderContent: (item: T, index: number) => React.ReactNode
  /** Expanded item id (single-open). From expandedRepeaterCards[repeaterKey]. */
  expandedId: string | null
  /** Toggle expanded state. */
  onToggle: (itemId: string) => void
  /** Collapse all. */
  onCollapseAll: () => void
  /** Label for count (e.g. "6 Cards") */
  countLabel: string
  /** Label for add button (e.g. "Card hinzufügen") */
  addLabel: string
  /** Called when add is clicked. */
  onAdd: () => void
  /** Remove item by id. Parent resolves index if needed. */
  onRemove: (itemId: string) => void
  /** Move item up by id. Optional; use onMove for index-based. */
  onMoveUp?: (itemId: string) => void
  /** Move item down by id. Optional; use onMove for index-based. */
  onMoveDown?: (itemId: string) => void
  /** Move item by index (alternative to onMoveUp/onMoveDown). */
  onMove?: (fromIndex: number, toIndex: number) => void
  /** Optional empty state node */
  emptyState?: React.ReactNode
  /** Optional empty label text */
  emptyLabel?: string
  /** Min items (disable remove when items.length <= minItems) */
  minItems?: number
  /** Max items (disable add when items.length >= maxItems) */
  maxItems?: number
  /** Show move up/down buttons in header (default true). */
  showMoveButtons?: boolean
  className?: string
}

/**
 * Universal repeater for Inspector: card list with add, move up/down, delete, expand/collapse.
 * Uses existing InspectorCardList. API: id-based onRemove(itemId), optional onMoveUp(itemId)/onMoveDown(itemId) or onMove(from, to).
 */
export function UniversalRepeaterInspector<T>({
  items,
  getItemId,
  renderSummary,
  getItemLabel,
  renderContent,
  expandedId,
  onToggle,
  onCollapseAll,
  countLabel,
  addLabel,
  onAdd,
  onMove,
  onMoveUp,
  onMoveDown,
  onRemove,
  emptyState,
  emptyLabel,
  minItems = 0,
  maxItems,
  showMoveButtons = true,
  className,
}: UniversalRepeaterInspectorProps<T>) {
  const getIndex = React.useCallback(
    (item: T) => items.findIndex((i) => getItemId(i) === getItemId(item)),
    [items, getItemId]
  )

  const canAdd = maxItems == null || items.length < maxItems
  const canRemove = items.length > minItems

  const summaryNode = React.useMemo(() => {
    if (renderSummary) return renderSummary
    if (getItemLabel) return (item: T) => getItemLabel(item, getIndex(item))
    return (item: T) => <span className="truncate">{String(getItemId(item))}</span>
  }, [renderSummary, getItemLabel, getIndex])

  const handleRemoveByIndex = React.useCallback(
    (index: number) => {
      const item = items[index]
      if (item != null) onRemove(getItemId(item))
    },
    [items, getItemId, onRemove]
  )

  const handleMove = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      if (onMove) {
        onMove(fromIndex, toIndex)
        return
      }
      const item = items[fromIndex]
      if (item == null) return
      const id = getItemId(item)
      if (toIndex < fromIndex && onMoveUp) onMoveUp(id)
      else if (toIndex > fromIndex && onMoveDown) onMoveDown(id)
    },
    [items, getItemId, onMove, onMoveUp, onMoveDown]
  )

  return (
    <UniversalRepeaterInspectorInner
      items={items}
      getItemId={getItemId}
      renderSummary={summaryNode}
      renderContent={renderContent}
      getIndex={getIndex}
      expandedId={expandedId}
      onToggle={onToggle}
      onCollapseAll={onCollapseAll}
      countLabel={countLabel}
      addLabel={addLabel}
      onAdd={onAdd}
      onMove={handleMove}
      onRemove={handleRemoveByIndex}
      canAdd={canAdd}
      canRemove={canRemove}
      showMoveButtons={showMoveButtons}
      emptyState={emptyState ?? (emptyLabel ? <p className="text-xs text-muted-foreground py-2">{emptyLabel}</p> : undefined)}
      className={className}
    />
  )
}

interface UniversalRepeaterInspectorInnerProps<T> {
  items: T[]
  getItemId: (item: T) => string
  renderSummary: (item: T) => React.ReactNode
  renderContent: (item: T, index: number) => React.ReactNode
  getIndex: (item: T) => number
  expandedId: string | null
  onToggle: (itemId: string) => void
  onCollapseAll: () => void
  countLabel: string
  addLabel: string
  onAdd: () => void
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
  canAdd: boolean
  canRemove: boolean
  showMoveButtons: boolean
  emptyState?: React.ReactNode
  className?: string
}

function UniversalRepeaterInspectorInner<T>({
  items,
  getItemId,
  renderSummary,
  renderContent,
  getIndex,
  expandedId,
  onToggle,
  onCollapseAll,
  countLabel,
  addLabel,
  onAdd,
  onMove,
  onRemove,
  canAdd,
  canRemove,
  showMoveButtons,
  emptyState,
  className,
}: UniversalRepeaterInspectorInnerProps<T>) {
  const renderHeaderActions = React.useCallback(
    (item: T) => {
      const index = getIndex(item)
      return (
        <div className="flex items-center gap-0.5">
          {showMoveButtons && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  if (index > 0) onMove(index, index - 1)
                }}
                disabled={index === 0}
                title="Nach oben"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  if (index < items.length - 1) onMove(index, index + 1)
                }}
                disabled={index === items.length - 1}
                title="Nach unten"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(index)
            }}
            disabled={!canRemove}
            title="Löschen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    },
    [getIndex, items.length, onMove, onRemove, canRemove, showMoveButtons]
  )

  return (
    <InspectorCardList<T>
      className={className}
      items={items}
      getItemId={getItemId}
      mode="single"
      expandedId={expandedId}
      onToggle={onToggle}
      onCollapseAll={onCollapseAll}
      countLabel={countLabel}
      addAction={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-8 text-sm"
          onClick={onAdd}
          disabled={!canAdd}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {addLabel}
        </Button>
      }
      emptyState={emptyState}
      renderSummary={renderSummary}
      renderHeaderActions={renderHeaderActions}
      renderContent={(item) => renderContent(item, getIndex(item))}
    />
  )
}
