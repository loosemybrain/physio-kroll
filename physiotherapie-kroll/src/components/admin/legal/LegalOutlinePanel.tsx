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
import { Button } from "@/components/ui/button"
import type { CMSBlock } from "@/types/cms"
import { LegalOutlineInsertPoint } from "./LegalOutlineInsertPoint"
import { SortableLegalOutlineItem } from "./SortableLegalOutlineItem"
import { StaticLegalOutlineItem } from "./StaticLegalOutlineItem"

type LegalOutlinePanelProps = {
  blocks: CMSBlock[]
  selectedBlockId: string | null
  onSelectBlock: (blockId: string) => void
  onInsertLegalSectionAt?: (index: number) => void
  /** Nur bei direktem Klick auf einen Outline-Eintrag (nicht bei jeder Selection-Änderung). */
  onRequestPreviewScroll?: (blockId: string) => void
  /** Quelle der letzten Selection-Änderung (UI-Metadaten, nicht persistiert). */
  selectionSource?: "outline" | "preview" | null
  onSelectionSourceChange?: (source: "outline" | "preview" | null) => void
  onConsumePreviewSelectionSource?: () => void
  onReorder: (activeId: string, overId: string) => void
  onDeleteBlock?: (blockId: string) => void
  onDuplicateBlock?: (blockId: string) => void
}

const staticTypeLabels: Partial<Record<CMSBlock["type"], string>> = {
  legalHero: "Header / Hero",
  legalRichText: "Fließtext",
  legalTable: "Tabelle",
  legalInfoBox: "Infobox",
  legalCookieCategories: "Cookie-Kategorien",
  legalContactCard: "Kontakt-Karte",
}

/** HTML/Entities grob zu Klartext (Outline-Preview). */
function stripHtmlToPlainText(htmlOrText: unknown): string {
  if (typeof htmlOrText !== "string") return ""
  return htmlOrText
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function truncatePreview(s: string, maxLen: number): string {
  const t = s.trim()
  if (!t) return ""
  if (t.length <= maxLen) return t
  return `${t.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`
}

function extractTextPreview(htmlOrText: unknown): string {
  const plain = stripHtmlToPlainText(htmlOrText)
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

/** Kompakte 1–2 Zeilen für collapsed legalSection. */
function getSectionCollapsedLines(block: Extract<CMSBlock, { type: "legalSection" }>): {
  primary: string
  secondary?: string
} {
  const props = (block.props ?? {}) as Record<string, unknown>
  const title = typeof props.title === "string" ? props.title.trim() : ""
  const plain = stripHtmlToPlainText(props.content)

  if (title) {
    const sec = truncatePreview(plain, 72)
    if (sec && sec !== title) {
      return { primary: title, secondary: sec }
    }
    return { primary: title }
  }

  const primary = truncatePreview(plain, 88)
  if (primary) return { primary }
  return { primary: "Unbenannter Abschnitt" }
}

function getStaticPreview(block: CMSBlock): string {
  const props = (block.props ?? {}) as Record<string, unknown>
  if (block.type === "legalHero") {
    return extractTextPreview(props.title) || extractTextPreview(props.subtitle)
  }
  if (block.type === "legalRichText") {
    return extractTextPreview(props.headline) || extractTextPreview(props.content)
  }
  if (block.type === "legalTable") {
    return extractTextPreview(props.caption)
  }
  if (block.type === "legalInfoBox") {
    return extractTextPreview(props.headline) || extractTextPreview(props.content)
  }
  if (block.type === "legalContactCard") {
    return extractTextPreview(props.headline)
  }
  return ""
}

/** Rohdaten für kurze collapsed-Zeile (ohne Satz-Split). */
function getStaticPlainForCollapsed(block: CMSBlock): string {
  const props = (block.props ?? {}) as Record<string, unknown>
  if (block.type === "legalHero") {
    return stripHtmlToPlainText(props.title) || stripHtmlToPlainText(props.subtitle)
  }
  if (block.type === "legalRichText") {
    return stripHtmlToPlainText(props.headline) || stripHtmlToPlainText(props.content)
  }
  if (block.type === "legalTable") {
    return stripHtmlToPlainText(props.caption)
  }
  if (block.type === "legalInfoBox") {
    return stripHtmlToPlainText(props.headline) || stripHtmlToPlainText(props.content)
  }
  if (block.type === "legalContactCard") {
    return stripHtmlToPlainText(props.headline)
  }
  return ""
}

function getStaticCollapsedPrimary(block: CMSBlock, label: string): string {
  const plain = getStaticPlainForCollapsed(block)
  const short = truncatePreview(plain, 76)
  if (short) return short
  return label
}

export function LegalOutlinePanel({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onInsertLegalSectionAt,
  onRequestPreviewScroll,
  selectionSource,
  onSelectionSourceChange,
  onConsumePreviewSelectionSource,
  onReorder,
  onDeleteBlock,
  onDuplicateBlock,
}: LegalOutlinePanelProps) {
  /** Lokaler UI-State: ID in Set = eingeklappt. Kein CMS-/DB-Bezug. */
  const [collapsedBlockIds, setCollapsedBlockIds] = React.useState<Set<string>>(() => new Set())

  const legalSections = React.useMemo(
    () => blocks.filter((b): b is Extract<CMSBlock, { type: "legalSection" }> => b.type === "legalSection"),
    [blocks]
  )
  const sectionIds = legalSections.map((b) => b.id)

  const blockIdSet = React.useMemo(() => new Set(blocks.map((b) => b.id)), [blocks])

  /** Entfernt IDs, die nicht mehr zu `blocks` gehören (z. B. nach Löschen). */
  React.useEffect(() => {
    setCollapsedBlockIds((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (blockIdSet.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [blockIdSet])

  /** Optional: bei sehr langen Seiten initial statische Blöcke einklappen (Hero + Sections bleiben aufgeklappt). */
  const largePageCollapseInitRef = React.useRef(false)
  React.useEffect(() => {
    if (largePageCollapseInitRef.current) return
    if (blocks.length === 0) return
    largePageCollapseInitRef.current = true
    if (blocks.length > 10) {
      setCollapsedBlockIds(
        new Set(blocks.filter((b) => b.type !== "legalHero" && b.type !== "legalSection").map((b) => b.id))
      )
    }
  }, [blocks])

  const toggleItemExpanded = React.useCallback((id: string) => {
    setCollapsedBlockIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const collapseAll = React.useCallback(() => {
    setCollapsedBlockIds(new Set(blocks.map((b) => b.id)))
  }, [blocks])

  const expandAll = React.useCallback(() => {
    setCollapsedBlockIds(new Set())
  }, [])

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

  /** Nur für echte Outline-Klicks: Selection + Preview-Scroll (kein Scroll bei programmatischer Selection). */
  const handleOutlineItemActivate = React.useCallback(
    (blockId: string) => {
      onSelectionSourceChange?.("outline")
      onSelectBlock(blockId)
      onRequestPreviewScroll?.(blockId)
    },
    [onSelectBlock, onRequestPreviewScroll, onSelectionSourceChange]
  )

  const handleInsertAt = React.useCallback(
    (index: number) => {
      onSelectionSourceChange?.("outline")
      onInsertLegalSectionAt?.(index)
    },
    [onInsertLegalSectionAt, onSelectionSourceChange]
  )

  /** Auto-Expand nur bei Preview-getriggerter Selection; danach Quelle sofort als verarbeitet markieren. */
  React.useEffect(() => {
    if (!selectedBlockId) return
    if (selectionSource !== "preview") return

    setCollapsedBlockIds((prev) => {
      if (!prev.has(selectedBlockId)) return prev
      const next = new Set(prev)
      next.delete(selectedBlockId)
      return next
    })
    onConsumePreviewSelectionSource?.()
  }, [selectedBlockId, selectionSource, onConsumePreviewSelectionSource])

  React.useEffect(() => {
    if (!selectedBlockId) return
    const el = document.querySelector<HTMLElement>(
      `[data-outline-block-id="${CSS.escape(selectedBlockId)}"]`
    )
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedBlockId])

  return (
    <div className="min-w-0 border-t border-border px-3 py-2.5">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Struktur</h3>
          <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] font-normal">
            {legalSections.length} Abschnitte
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Alle Einträge einklappen"
            aria-label="Alle einklappen"
            className="h-6 px-1.5 text-[10px] text-muted-foreground"
            onClick={collapseAll}
          >
            Alle zu
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Alle Einträge aufklappen"
            aria-label="Alle aufklappen"
            className="h-6 px-1.5 text-[10px] text-muted-foreground"
            onClick={expandAll}
          >
            Alle auf
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {onInsertLegalSectionAt ? <LegalOutlineInsertPoint index={0} onInsert={handleInsertAt} compact /> : null}
            {blocks.map((block, index) => {
              const isCollapsed = collapsedBlockIds.has(block.id)
              const isExpanded = !isCollapsed

              if (block.type === "legalSection") {
                const sectionIndex = sectionIds.indexOf(block.id)
                const collapsedLines = getSectionCollapsedLines(block)
                return (
                  <React.Fragment key={block.id}>
                    <SortableLegalOutlineItem
                      id={block.id}
                      title={getSectionTitle(block)}
                      preview={getSectionPreview(block)}
                      collapsedPrimary={collapsedLines.primary}
                      collapsedSecondary={collapsedLines.secondary}
                      isSelected={selectedBlockId === block.id}
                      isExpanded={isExpanded}
                      onToggleExpanded={() => toggleItemExpanded(block.id)}
                      onSelect={handleOutlineItemActivate}
                      onMoveUp={() => moveSection(block.id, -1)}
                      onMoveDown={() => moveSection(block.id, 1)}
                      onDuplicate={(id) => onDuplicateBlock?.(id)}
                      onDelete={(id) => onDeleteBlock?.(id)}
                      canMoveUp={sectionIndex > 0}
                      canMoveDown={sectionIndex < sectionIds.length - 1}
                    />
                    {onInsertLegalSectionAt ? (
                      <LegalOutlineInsertPoint index={index + 1} onInsert={handleInsertAt} compact />
                    ) : null}
                  </React.Fragment>
                )
              }

              const label = staticTypeLabels[block.type] ?? block.type
              const outlineKind = block.type === "legalHero" ? "hero" : "static"
              return (
                <React.Fragment key={block.id}>
                  <StaticLegalOutlineItem
                    id={block.id}
                    label={label}
                    preview={getStaticPreview(block)}
                    collapsedPrimary={getStaticCollapsedPrimary(block, label)}
                    outlineKind={outlineKind}
                    isSelected={selectedBlockId === block.id}
                    isExpanded={isExpanded}
                    onToggleExpanded={() => toggleItemExpanded(block.id)}
                    onSelect={handleOutlineItemActivate}
                  />
                  {onInsertLegalSectionAt ? (
                    <LegalOutlineInsertPoint index={index + 1} onInsert={handleInsertAt} compact />
                  ) : null}
                </React.Fragment>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
