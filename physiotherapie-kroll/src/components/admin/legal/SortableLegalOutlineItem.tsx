"use client"

import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Copy, ChevronDown, ChevronRight, ChevronUp, GripVertical, Trash2 } from "lucide-react"

type SortableLegalOutlineItemProps = {
  id: string
  title: string
  preview: string
  /** Eine Zeile Titel, optional zweite gekürzte Zeile (collapsed). */
  collapsedPrimary: string
  collapsedSecondary?: string
  isSelected: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  onSelect: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  canMoveUp: boolean
  canMoveDown: boolean
}

const sectionBadgeClass =
  "border border-primary/25 bg-primary/[0.09] text-primary dark:bg-primary/15 h-4 px-1 text-[9px] font-medium leading-none"

export function SortableLegalOutlineItem({
  id,
  title,
  preview,
  collapsedPrimary,
  collapsedSecondary,
  isSelected,
  isExpanded,
  onToggleExpanded,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canMoveUp,
  canMoveDown,
}: SortableLegalOutlineItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const actionBtn = (expanded: boolean) =>
    cn(
      "shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground",
      expanded ? "h-7 w-7" : "h-6 w-6"
    )

  const quickActions = (expanded: boolean) => (
    <div
      className={cn(
        "flex shrink-0 items-center gap-0 transition-opacity duration-150",
        expanded ? "opacity-100" : "opacity-[0.35] group-hover/item:opacity-100 group-focus-within/item:opacity-100",
        isSelected && !expanded && "opacity-100"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={actionBtn(expanded)}
        aria-label="Abschnitt nach oben"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMoveUp(id)
        }}
        disabled={!canMoveUp}
      >
        <ChevronUp className={expanded ? "h-3.5 w-3.5" : "h-3 w-3"} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={actionBtn(expanded)}
        aria-label="Abschnitt duplizieren"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDuplicate(id)
        }}
      >
        <Copy className={expanded ? "h-3.5 w-3.5" : "h-3 w-3"} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(actionBtn(expanded), "text-destructive hover:text-destructive")}
        aria-label="Abschnitt löschen"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete(id)
        }}
      >
        <Trash2 className={expanded ? "h-3.5 w-3.5" : "h-3 w-3"} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={actionBtn(expanded)}
        aria-label="Abschnitt nach unten"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMoveDown(id)
        }}
        disabled={!canMoveDown}
      >
        <ChevronDown className={expanded ? "h-3.5 w-3.5" : "h-3 w-3"} />
      </Button>
    </div>
  )

  return (
    <div
      ref={setNodeRef}
      data-outline-block-id={id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/item rounded-md border bg-background transition-[box-shadow,background-color,border-color]",
        isExpanded ? "p-2" : "px-1 py-0.5",
        isSelected
          ? "border-primary ring-2 ring-primary/35 bg-primary/[0.07] shadow-sm dark:bg-primary/20"
          : "border-border hover:border-muted-foreground/25 hover:bg-muted/30",
        isDragging && "opacity-70 shadow-sm"
      )}
    >
      <div className={cn("flex gap-0.5", isExpanded ? "items-start" : "items-center")}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 text-muted-foreground hover:text-foreground",
            isExpanded ? "mt-0.5 h-7 w-7" : "h-6 w-6"
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
          className={cn(
            "shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground",
            !isDragging && "cursor-grab active:cursor-grabbing",
            isExpanded ? "mt-0.5" : ""
          )}
          aria-label="Abschnitt ziehen"
          {...attributes}
          {...listeners}
        >
          <GripVertical className={isExpanded ? "h-4 w-4" : "h-3.5 w-3.5"} />
        </button>

        {isExpanded ? (
          <>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className="min-w-0 flex-1 rounded-sm px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="truncate text-sm font-semibold leading-snug text-foreground">{title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{preview}</p>
            </button>
            <Badge variant="secondary" className={cn("mt-0.5 shrink-0", sectionBadgeClass)}>
              Abschnitt
            </Badge>
            {quickActions(true)}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className="min-w-0 flex-1 rounded-sm px-0.5 py-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{collapsedPrimary}</p>
              {collapsedSecondary ? (
                <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-muted-foreground/90">
                  {collapsedSecondary}
                </p>
              ) : null}
            </button>
            <Badge variant="secondary" className={cn("shrink-0 self-center", sectionBadgeClass)}>
              Abschnitt
            </Badge>
            {quickActions(false)}
          </>
        )}
      </div>
    </div>
  )
}
