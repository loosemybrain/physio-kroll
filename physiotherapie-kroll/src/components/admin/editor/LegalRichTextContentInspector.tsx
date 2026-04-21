"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { InspectorCardItem } from "../inspector/InspectorCardItem"
import { arrayMove } from "@/lib/cms/arrayOps"
import { cn } from "@/lib/utils"
import type { CMSBlock, LegalRichContentBlock, LegalRichTextRun } from "@/types/cms"
import { uuid } from "@/lib/cms/arrayOps"
import {
  createLegalRichBulletListBlock,
  createLegalRichHeadingBlock,
  createLegalRichListItem,
  createLegalRichOrderedListBlock,
  createLegalRichParagraphBlock,
  createLegalRichRun,
  getLegalRichListItemDomId,
  getLegalRichRunDomId,
  legalContentBlocksToPlainText,
  legalPlainTextToContentBlocks,
  legalRichTextUsesStructuredContent,
} from "@/lib/legal/legalRichContentFactories"

function coerceBlockToType(block: LegalRichContentBlock, nextType: LegalRichContentBlock["type"]): LegalRichContentBlock {
  const id = block.id
  const extractRuns = (): LegalRichTextRun[] => {
    if (block.type === "paragraph" || block.type === "heading") {
      return block.runs.length
        ? block.runs.map((r) => ({ ...r, link: r.link ? { ...r.link } : undefined }))
        : [createLegalRichRun()]
    }
    if (block.type === "bulletList" || block.type === "orderedList") {
      const first = block.items[0]
      return first?.runs?.length
        ? first.runs.map((r) => ({ ...r, link: r.link ? { ...r.link } : undefined }))
        : [createLegalRichRun()]
    }
    return [createLegalRichRun()]
  }
  const runs = extractRuns()
  if (nextType === "paragraph") return { id, type: "paragraph", runs }
  if (nextType === "heading") {
    const level = block.type === "heading" ? block.level : 3
    return { id, type: "heading", level, runs }
  }
  if (nextType === "bulletList") return { id, type: "bulletList", items: [{ id: uuid(), runs }] }
  return { id, type: "orderedList", items: [{ id: uuid(), runs }] }
}

function LegalTextRunsEditor({
  runs,
  onChange,
  contentBlockId,
  context = "list",
}: {
  runs: LegalRichTextRun[]
  onChange: (next: LegalRichTextRun[]) => void
  /** Strukturierter Inhaltsblock (`contentBlocks[].id`) — für Preview↔Inspector DOM-IDs. */
  contentBlockId: string
  /** `block` = Absatz/Zwischenüberschrift (ausführliche Hinweise). */
  context?: "block" | "list"
}) {
  const [cursorPosByRunId, setCursorPosByRunId] = React.useState<Record<string, number>>({})
  const [selectionByRunId, setSelectionByRunId] = React.useState<Record<string, { start: number; end: number }>>({})

  const patchRun = (index: number, patch: Partial<LegalRichTextRun>) => {
    onChange(runs.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const setLinkFields = (index: number, partial: { href?: string; label?: string }) => {
    const r = runs[index]
    const href = partial.href !== undefined ? partial.href : (r.link?.href ?? "")
    const label = partial.label !== undefined ? partial.label : (r.link?.label ?? "")
    const h = href.trim()
    const lab = label.trim()
    patchRun(index, {
      link: h ? { href: h, ...(lab ? { label: lab } : {}) } : undefined,
    })
  }

  const splitRunAtCursor = (index: number, runSelectionId: string) => {
    const run = runs[index]
    const cursor = cursorPosByRunId[runSelectionId] ?? run.text.length
    if (cursor <= 0 || cursor >= run.text.length) return
    const left = run.text.slice(0, cursor)
    const right = run.text.slice(cursor)
    const nextRun: LegalRichTextRun = createLegalRichRun({
      text: right,
      bold: run.bold,
      italic: run.italic,
      underline: run.underline,
      color: run.color,
      link: run.link ? { ...run.link } : undefined,
    })
    onChange(runs.flatMap((r, i) => (i === index ? [{ ...r, text: left }, nextRun] : [r])))
  }

  const applySelectionFormat = (
    index: number,
    runSelectionId: string,
    patch: Partial<Pick<LegalRichTextRun, "bold" | "italic" | "underline" | "color">>,
  ) => {
    const run = runs[index]
    const sel = selectionByRunId[runSelectionId]
    if (!sel || sel.end <= sel.start) return
    const start = Math.max(0, Math.min(sel.start, run.text.length))
    const end = Math.max(0, Math.min(sel.end, run.text.length))
    if (end <= start) return

    const before = run.text.slice(0, start)
    const selected = run.text.slice(start, end)
    const after = run.text.slice(end)

    const nextRuns: LegalRichTextRun[] = []
    for (let i = 0; i < runs.length; i++) {
      const current = runs[i]
      if (i !== index) {
        nextRuns.push(current)
        continue
      }
      if (before.length > 0) {
        nextRuns.push({ ...current, text: before })
      }
      nextRuns.push(
        createLegalRichRun({
          text: selected,
          bold: patch.bold ?? current.bold,
          italic: patch.italic ?? current.italic,
          underline: patch.underline ?? current.underline,
          color: patch.color !== undefined ? patch.color : current.color,
          link: current.link ? { ...current.link } : undefined,
        }),
      )
      if (after.length > 0) {
        nextRuns.push(
          createLegalRichRun({
            text: after,
            bold: current.bold,
            italic: current.italic,
            underline: current.underline,
            color: current.color,
            link: current.link ? { ...current.link } : undefined,
          }),
        )
      }
    }
    onChange(nextRuns)
  }

  const captureSelectionState = (runId: string, el: HTMLTextAreaElement) => {
    const apply = () => {
      const start = el.selectionStart ?? 0
      const end = el.selectionEnd ?? start
      setCursorPosByRunId((prev) => (prev[runId] === end ? prev : { ...prev, [runId]: end }))
      setSelectionByRunId((prev) => {
        const current = prev[runId]
        if (current?.start === start && current?.end === end) return prev
        return { ...prev, [runId]: { start, end } }
      })
    }
    // Nach MouseUp/Touch ist die Selektion manchmal erst im naechsten Frame gesetzt.
    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      window.requestAnimationFrame(apply)
      return
    }
    apply()
  }

  return (
    <div className="space-y-2">
      {context === "block" ? (
        <p className="text-[11px] text-muted-foreground leading-snug">
          Mehrere <strong className="font-medium text-foreground">Textteile</strong> nacheinander ergeben gemischte Formatierung
          (Fett/Kursiv/Link). Es wird nur das Datenmodell gespeichert — kein HTML, kein Markdown.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">Pro Punkt: ein oder mehrere Textteile mit optional Fett, Kursiv, Link.</p>
      )}
      {runs.map((run, i) => {
        const runSelectionId = getLegalRichRunDomId(contentBlockId, run, i)
        return (
        <div
          key={runSelectionId}
          data-inspector-legal-rich-run={runSelectionId}
          className="rounded-md border border-border bg-muted/20 p-2 space-y-2"
        >
          <Textarea
            value={run.text}
            onChange={(e) => patchRun(i, { text: e.target.value })}
            onMouseUp={(e) => captureSelectionState(runSelectionId, e.currentTarget)}
            onKeyUp={(e) => captureSelectionState(runSelectionId, e.currentTarget)}
            placeholder="Text"
            rows={2}
            className="text-sm min-h-[52px]"
          />
          {(selectionByRunId[runSelectionId]?.end ?? 0) > (selectionByRunId[runSelectionId]?.start ?? 0) ? (
            <div className="rounded-md border border-border bg-background p-2 space-y-2">
              <p className="text-[11px] text-muted-foreground">Auswahl-Formatierung</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applySelectionFormat(i, runSelectionId, { bold: !Boolean(run.bold) })}
                >
                  Fett
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applySelectionFormat(i, runSelectionId, { italic: !Boolean(run.italic) })}
                >
                  Kursiv
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applySelectionFormat(i, runSelectionId, { underline: !Boolean(run.underline) })}
                >
                  Unterstrichen
                </Button>
                <Input
                  type="color"
                  value={run.color?.trim() ? run.color : "#1f2937"}
                  onChange={(e) => applySelectionFormat(i, runSelectionId, { color: e.target.value })}
                  className="h-7 w-10 p-1"
                  title="Textfarbe"
                />
                <Input
                  value={run.color?.trim() ? run.color : ""}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (!raw.trim()) {
                      applySelectionFormat(i, runSelectionId, { color: "" })
                      return
                    }
                    const parsed = normalizeHexColorInput(raw)
                    if (parsed) applySelectionFormat(i, runSelectionId, { color: parsed })
                  }}
                  placeholder="#1f2937"
                  className="h-7 w-24 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applySelectionFormat(i, { color: "" })}
                >
                  Farbe reset
                </Button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={Boolean(run.bold)} onCheckedChange={(v) => patchRun(i, { bold: Boolean(v) })} />
              Fett
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={Boolean(run.italic)} onCheckedChange={(v) => patchRun(i, { italic: Boolean(v) })} />
              Kursiv
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={Boolean(run.underline)} onCheckedChange={(v) => patchRun(i, { underline: Boolean(v) })} />
              Unterstrichen
            </label>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Textfarbe (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={run.color?.trim() ? run.color : "#1f2937"}
                onChange={(e) => patchRun(i, { color: e.target.value })}
                className="h-8 w-11 p-1"
              />
              <Input
                value={run.color?.trim() ? run.color : ""}
                onChange={(e) => {
                  const raw = e.target.value
                  if (!raw.trim()) {
                    patchRun(i, { color: undefined })
                    return
                  }
                  const parsed = normalizeHexColorInput(raw)
                  if (parsed) patchRun(i, { color: parsed })
                }}
                placeholder="#1f2937"
                className="h-8 w-24 text-xs"
              />
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => patchRun(i, { color: undefined })}>
                Zuruecksetzen
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Link-URL (optional)</Label>
            <Input
              value={run.link?.href ?? ""}
              onChange={(e) => setLinkFields(i, { href: e.target.value })}
              placeholder="https://… oder /pfad"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Link-Text (optional)</Label>
            <Input
              value={run.link?.label ?? ""}
              onChange={(e) => setLinkFields(i, { label: e.target.value })}
              placeholder="Anzeigetext statt Fließtext"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={run.text.length < 2}
              onClick={() => splitRunAtCursor(i, runSelectionId)}
            >
              An Cursor teilen
            </Button>
            {runs.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={() => onChange(runs.filter((_, j) => j !== i))}
              >
                Textteil entfernen
              </Button>
            ) : null}
          </div>
        </div>
      )})}
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => onChange([...runs, createLegalRichRun()])}>
        Textteil hinzufügen
      </Button>
    </div>
  )
}

function blockTypeLabel(t: LegalRichContentBlock["type"]): string {
  switch (t) {
    case "paragraph":
      return "Absatz"
    case "heading":
      return "Zwischenüberschrift"
    case "bulletList":
      return "Aufzählung"
    case "orderedList":
      return "Nummerierte Liste"
    default:
      return t
  }
}

function normalizeHexColorInput(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  const withHash = v.startsWith("#") ? v : `#${v}`
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toLowerCase() : null
}

function getBlockPreviewText(block: LegalRichContentBlock): string {
  if (block.type === "paragraph" || block.type === "heading") {
    const text = block.runs.map((r) => r.text).join("").trim()
    if (!text) return ""
    return text.length > 42 ? `${text.slice(0, 42)}…` : text
  }
  return ""
}

function SortableContentBlockCard({
  item,
  isExpanded,
  onToggle,
  summary,
  headerActions,
  children,
}: {
  item: LegalRichContentBlock
  isExpanded: boolean
  onToggle: () => void
  summary: React.ReactNode
  headerActions: React.ReactNode
  children: React.ReactNode
}) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-70")}
    >
      <InspectorCardItem
        itemId={item.id}
        isExpanded={isExpanded}
        onToggle={onToggle}
        summary={summary}
        headerActions={
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Inhaltsblock ziehen"
              title="Ziehen"
              onClick={(e) => e.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            {headerActions}
          </div>
        }
      >
        {children}
      </InspectorCardItem>
    </div>
  )
}

function BlockContentEditor({
  block,
  onChange,
}: {
  block: LegalRichContentBlock
  onChange: (b: LegalRichContentBlock) => void
}) {
  const setType = (v: string) => {
    if (v === block.type) return
    onChange(coerceBlockToType(block, v as LegalRichContentBlock["type"]))
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <div className="space-y-1.5">
        <Label className="text-xs">Block-Typ</Label>
        <Select value={block.type} onValueChange={setType}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Absatz</SelectItem>
            <SelectItem value="heading">Zwischenüberschrift</SelectItem>
            <SelectItem value="bulletList">Aufzählung</SelectItem>
            <SelectItem value="orderedList">Nummerierte Liste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {block.type === "heading" ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Ebene</Label>
          <Select
            value={String(block.level)}
            onValueChange={(v) => {
              const parsed = Number(v)
              const level = parsed >= 2 && parsed <= 6 ? (parsed as 2 | 3 | 4 | 5 | 6) : 3
              onChange({ ...block, level })
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Überschrift H2</SelectItem>
              <SelectItem value="3">Überschrift H3</SelectItem>
              <SelectItem value="4">Überschrift H4</SelectItem>
              <SelectItem value="5">Überschrift H5</SelectItem>
              <SelectItem value="6">Überschrift H6</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {block.type === "paragraph" || block.type === "heading" ? (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Inline-Formatierung</Label>
          <LegalTextRunsEditor
            contentBlockId={block.id}
            context="block"
            runs={block.runs}
            onChange={(runs) => onChange({ ...block, runs })}
          />
        </div>
      ) : null}

      {(block.type === "bulletList" || block.type === "orderedList") && (
        <div className="space-y-2">
          <Label className="text-xs">Listenpunkte</Label>
          {block.items.map((item, itemIndex) => (
            <div
              key={getLegalRichListItemDomId(block.id, item, itemIndex)}
              data-inspector-legal-rich-list-item={getLegalRichListItemDomId(block.id, item, itemIndex)}
              className="rounded-md border border-border p-2 space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium text-muted-foreground">Punkt {itemIndex + 1}</span>
                {block.items.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-destructive text-xs px-2"
                    onClick={() =>
                      onChange({
                        ...block,
                        items: block.items.filter((_, j) => j !== itemIndex),
                      })
                    }
                  >
                    Entfernen
                  </Button>
                ) : null}
              </div>
              <LegalTextRunsEditor
                contentBlockId={block.id}
                context="list"
                runs={item.runs}
                onChange={(runs) =>
                  onChange({
                    ...block,
                    items: block.items.map((it, j) => (j === itemIndex ? { ...it, runs } : it)),
                  })
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => onChange({ ...block, items: [...block.items, createLegalRichListItem()] })}
          >
            Listenpunkt hinzufügen
          </Button>
        </div>
      )}
    </div>
  )
}

export type LegalRichTextContentInspectorProps = {
  block: CMSBlock & { type: "legalRichText" }
  updateSelectedProps: (props: CMSBlock["props"]) => void
  expandedRepeaterCards: Record<string, string | null>
  setExpandedRepeaterCards: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
}

export function LegalRichTextContentInspector({
  block,
  updateSelectedProps,
  expandedRepeaterCards,
  setExpandedRepeaterCards,
}: LegalRichTextContentInspectorProps) {
  const props = block.props as CMSBlock["props"] & LegalRichTextBlockPropsShape
  const structured = legalRichTextUsesStructuredContent(props)
  const repeaterKey = `${block.id}:contentBlocks`
  const expandedId = expandedRepeaterCards[repeaterKey] ?? null

  const patchProps = (patch: Partial<LegalRichTextBlockPropsShape>) => {
    updateSelectedProps({ ...props, ...patch } as CMSBlock["props"])
  }

  const blocks = props.contentBlocks ?? []
  const blockIds = React.useMemo(() => blocks.map((b) => b.id), [blocks])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const setBlocks = (next: LegalRichContentBlock[]) => {
    patchProps({ contentBlocks: next.length > 0 ? next : undefined })
  }

  const addPresetBlock = (kind: "paragraph" | "heading" | "bullet" | "ordered") => {
    const next: LegalRichContentBlock =
      kind === "paragraph"
        ? createLegalRichParagraphBlock()
        : kind === "heading"
          ? createLegalRichHeadingBlock(3)
          : kind === "bullet"
            ? createLegalRichBulletListBlock()
            : createLegalRichOrderedListBlock()
    setBlocks([...blocks, next])
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return
    const from = blocks.findIndex((b) => b.id === activeId)
    const to = blocks.findIndex((b) => b.id === overId)
    if (from < 0 || to < 0) return
    setBlocks(arrayMove(blocks, from, to))
  }

  return (
    <div className="space-y-4 px-1">
      <div>
        <Label className="text-sm font-medium">Fließtext</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Strukturierter Modus: Absätze, Überschriften, Listen und formatierte Textteile. Ohne freies HTML.
        </p>
      </div>

      <Separator className="my-3" />

      {!structured ? (
        <div className="space-y-2">
          <Label className="text-xs">Einfacher Text (Legacy)</Label>
          <Textarea
            value={props.content ?? ""}
            onChange={(e) => patchProps({ content: e.target.value })}
            placeholder="Drücke Enter für neuen Absatz"
            rows={8}
            className="text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Struktur-Marker bleiben erhalten: <code>###</code>/<code>####</code> fuer Ueberschriften, <code>-</code> fuer Listen
            und <code>1.</code> fuer nummerierte Listen.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full h-8 text-sm"
            onClick={() => patchProps({ contentBlocks: legalPlainTextToContentBlocks(props.content ?? "") })}
          >
            Strukturierten Editor aktivieren
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => addPresetBlock("paragraph")}>
              <Plus className="h-3 w-3 mr-1" />
              Absatz
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => addPresetBlock("heading")}>
              <Plus className="h-3 w-3 mr-1" />
              Überschrift
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => addPresetBlock("bullet")}>
              <Plus className="h-3 w-3 mr-1" />
              Liste
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => addPresetBlock("ordered")}>
              <Plus className="h-3 w-3 mr-1" />
              Nummeriert
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">{`${blocks.length} Inhaltsblöcke`}</span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground underline"
                onClick={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
              >
                Alle einklappen
              </button>
            </div>
            <div className="min-w-0 space-y-1 text-[11px] leading-snug text-muted-foreground">
              <p className="font-medium text-foreground/80">Tastatur (Reihenfolge)</p>
              <ul className="list-inside list-disc space-y-1.5 wrap-break-word pl-0.5">
                <li>
                  <kbd className="whitespace-nowrap rounded border bg-muted/40 px-1 py-0.5 font-mono text-[10px]">Tab</kbd>{" "}
                  zum Drag-Handle
                </li>
                <li>
                  <kbd className="whitespace-nowrap rounded border bg-muted/40 px-1 py-0.5 font-mono text-[10px]">Leertaste</kbd>{" "}
                  aufnehmen
                </li>
                <li>
                  <kbd className="whitespace-nowrap rounded border bg-muted/40 px-1 py-0.5 font-mono text-[10px]">↑</kbd>{" "}
                  <kbd className="whitespace-nowrap rounded border bg-muted/40 px-1 py-0.5 font-mono text-[10px]">↓</kbd>{" "}
                  bewegen
                </li>
                <li>
                  <kbd className="whitespace-nowrap rounded border bg-muted/40 px-1 py-0.5 font-mono text-[10px]">Leertaste</kbd>{" "}
                  ablegen ·{" "}
                  <kbd className="whitespace-nowrap rounded border bg-muted/40 px-1 py-0.5 font-mono text-[10px]">Esc</kbd>{" "}
                  abbrechen
                </li>
              </ul>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1.5">
                  {blocks.map((b) => {
                    const isExpanded = expandedId === b.id
                    const summary = (
                      <span className="truncate text-xs">
                        {blockTypeLabel(b.type)}
                        {getBlockPreviewText(b) ? `: ${getBlockPreviewText(b)}` : ""}
                      </span>
                    )
                    const item = b
                    const i = blocks.findIndex((x) => x.id === item.id)
                    const headerActions = (
                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={i === 0}
                          title="Nach oben"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (i <= 0) return
                            const next = [...blocks]
                            ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                            setBlocks(next)
                          }}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={i >= blocks.length - 1}
                          title="Nach unten"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (i < 0 || i >= blocks.length - 1) return
                            const next = [...blocks]
                            ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
                            setBlocks(next)
                          }}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          title="Löschen"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBlocks(blocks.filter((_, j) => j !== i))
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                    return (
                      <SortableContentBlockCard
                        key={item.id}
                        item={item}
                        isExpanded={isExpanded}
                        onToggle={() =>
                          setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === item.id ? null : item.id }))
                        }
                        summary={summary}
                        headerActions={headerActions}
                      >
                        <BlockContentEditor
                          block={item}
                          onChange={(updated) => {
                            const idx = blocks.findIndex((x) => x.id === updated.id)
                            if (idx < 0) return
                            setBlocks(blocks.map((x, j) => (j === idx ? updated : x)))
                          }}
                        />
                      </SortableContentBlockCard>
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <Separator />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-8 text-sm"
            onClick={() => {
              const plain = legalContentBlocksToPlainText(blocks)
              patchProps({
                content: plain || props.content || "",
                contentBlocks: undefined,
              })
            }}
          >
            Zurück zu einfachem Text
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Struktur wird als Klartext-Marker gespeichert (<code>###</code>, <code>-</code>, <code>1.</code>). Beim Zurueckwechseln
            wird daraus wieder ein strukturierter Inhalt aufgebaut. Fett/Kursiv/Links gehen weiterhin verloren.
          </p>
        </div>
      )}
    </div>
  )
}

type LegalRichTextBlockPropsShape = {
  headline: string
  content: string
  contentBlocks?: LegalRichContentBlock[]
}
