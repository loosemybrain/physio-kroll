"use client"

import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react"

type SortableLegalOutlineItemProps = {
  id: string
  title: string
  preview: string
  isSelected: boolean
  onSelect: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export function SortableLegalOutlineItem({
  id,
  title,
  preview,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SortableLegalOutlineItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-md border bg-background p-2",
        isSelected && "border-primary ring-1 ring-primary/40",
        isDragging && "opacity-70 shadow-sm"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className={cn(
            "mt-0.5 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
            !isDragging && "cursor-grab active:cursor-grabbing"
          )}
          aria-label="Abschnitt ziehen"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelect(id)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{preview}</p>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Abschnitt nach oben"
            onClick={() => onMoveUp(id)}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Abschnitt nach unten"
            onClick={() => onMoveDown(id)}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

