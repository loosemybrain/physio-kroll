"use client"

import * as React from "react"
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CMSBlock } from "@/types/cms"
import { SortableLegalOutlineItem } from "./SortableLegalOutlineItem"

type LegalOutlinePanelProps = {
  blocks: CMSBlock[]
  selectedBlockId: string | null
  onSelectBlock: (blockId: string) => void
  onReorder: (activeId: string, overId: string) => void
}

const staticTypeLabels: Partial<Record<CMSBlock["type"], string>> = {
  legalHero: "Header/Hero (fixiert)",
  legalRichText: "Fließtext",
  legalTable: "Tabelle",
  legalInfoBox: "Infobox",
  legalCookieCategories: "Cookie-Kategorien",
  legalContactCard: "Kontakt-Karte",
}

function extractTextPreview(htmlOrText: unknown): string {
  if (typeof htmlOrText !== "string") return ""
  const plain = htmlOrText
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!plain) return ""
  const sentence = plain.split(/[.!?]/)[0]?.trim() || plain
  return sentence.slice(0, 120)
}

function getSectionTitle(block: Extract<CMSBlock, { type: "legalSection" }>): string {
  const props = (block.props ?? {}) as Record<string, unknown>
  const title = typeof props.title === "string" ? props.title.trim() : ""
  if (title) return title
  const preview = extractTextPreview(props.content)
  return preview || "Unbenannter Abschnitt"
}

function getSectionPreview(block: Extract<CMSBlock, { type: "legalSection" }>): string {
  const props = (block.props ?? {}) as Record<string, unknown>
  return extractTextPreview(props.content) || "Kein Inhalt"
}

export function LegalOutlinePanel({ blocks, selectedBlockId, onSelectBlock, onReorder }: LegalOutlinePanelProps) {
  const fixedBlocks = React.useMemo(
    () => blocks.filter((b) => b.type === "legalHero"),
    [blocks]
  )
  const legalSections = React.useMemo(
    () => blocks.filter((b): b is Extract<CMSBlock, { type: "legalSection" }> => b.type === "legalSection"),
    [blocks]
  )
  const staticBlocks = React.useMemo(
    () => blocks.filter((b) => b.type !== "legalHero" && b.type !== "legalSection"),
    [blocks]
  )
  const sectionIds = legalSections.map((b) => b.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = React.useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over) return
      const activeId = String(active.id)
      const overId = String(over.id)
      if (activeId === overId) return
      onReorder(activeId, overId)
    },
    [onReorder]
  )

  const moveSection = (id: string, direction: -1 | 1) => {
    const index = sectionIds.indexOf(id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= sectionIds.length) return
    onReorder(id, sectionIds[nextIndex])
  }

  return (
    <div className="min-w-0 border-t border-border p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold text-foreground">Struktur</h3>
        <Badge variant="secondary" className="shrink-0">
          {legalSections.length} Sections
        </Badge>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {fixedBlocks.length > 0 && (
              <p className="pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Fixiert
              </p>
            )}
            {fixedBlocks.map((block) => {
              const label = staticTypeLabels[block.type] ?? block.type
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => onSelectBlock(block.id)}
                  className={cn(
                    "w-full rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-left",
                    "text-xs text-muted-foreground hover:bg-muted/40",
                    selectedBlockId === block.id && "border-primary text-foreground"
                  )}
                >
                  {label}
                </button>
              )
            })}

            {legalSections.length > 0 && (
              <p className="pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Sortierbar
              </p>
            )}
            {legalSections.map((block) => {
              const sectionIndex = sectionIds.indexOf(block.id)
              return (
                <SortableLegalOutlineItem
                  key={block.id}
                  id={block.id}
                  title={getSectionTitle(block)}
                  preview={getSectionPreview(block)}
                  isSelected={selectedBlockId === block.id}
                  onSelect={onSelectBlock}
                  onMoveUp={() => moveSection(block.id, -1)}
                  onMoveDown={() => moveSection(block.id, 1)}
                  canMoveUp={sectionIndex > 0}
                  canMoveDown={sectionIndex < sectionIds.length - 1}
                />
              )
            })}

            {staticBlocks.length > 0 && (
              <p className="pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Statisch
              </p>
            )}
            {staticBlocks.map((block) => {
              const label = staticTypeLabels[block.type] ?? block.type
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => onSelectBlock(block.id)}
                  className={cn(
                    "w-full rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-left",
                    "text-xs text-muted-foreground hover:bg-muted/50",
                    selectedBlockId === block.id && "border-primary text-foreground"
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

