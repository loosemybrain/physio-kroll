"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { InspectorCardList } from "../inspector/InspectorCardList"
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
      return block.runs.length ? block.runs.map((r) => ({ ...r, link: r.link ? { ...r.link } : undefined })) : [createLegalRichRun()]
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
      {runs.map((run, i) => (
        <div
          key={getLegalRichRunDomId(contentBlockId, run, i)}
          data-inspector-legal-rich-run={getLegalRichRunDomId(contentBlockId, run, i)}
          className="rounded-md border border-border bg-muted/20 p-2 space-y-2"
        >
          <Textarea
            value={run.text}
            onChange={(e) => patchRun(i, { text: e.target.value })}
            placeholder="Text"
            rows={2}
            className="text-sm min-h-[52px]"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={Boolean(run.bold)} onCheckedChange={(v) => patchRun(i, { bold: Boolean(v) })} />
              Fett
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={Boolean(run.italic)} onCheckedChange={(v) => patchRun(i, { italic: Boolean(v) })} />
              Kursiv
            </label>
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
          {runs.length > 1 ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => onChange(runs.filter((_, j) => j !== i))}>
              Textteil entfernen
            </Button>
          ) : null}
        </div>
      ))}
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
            onValueChange={(v) => onChange({ ...block, level: v === "4" ? 4 : 3 })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Überschrift H3</SelectItem>
              <SelectItem value="4">Überschrift H4</SelectItem>
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
          <p className="text-[11px] text-muted-foreground">Wird als Klartext mit Absätzen angezeigt, solange kein strukturierter Inhalt aktiv ist.</p>
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

          <InspectorCardList<LegalRichContentBlock>
            items={blocks}
            getItemId={(b) => b.id}
            mode="single"
            expandedId={expandedId}
            onToggle={(id: string) =>
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))
            }
            onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
            countLabel={`${blocks.length} Inhaltsblöcke`}
            renderSummary={(b) => (
              <span className="truncate text-xs">
                {blockTypeLabel(b.type)}
                {b.type === "paragraph" || b.type === "heading"
                  ? `: ${b.runs.map((r) => r.text).join("").slice(0, 42)}${b.runs.map((r) => r.text).join("").length > 42 ? "…" : ""}`
                  : ""}
              </span>
            )}
            renderHeaderActions={(item) => {
              const i = blocks.findIndex((x) => x.id === item.id)
              return (
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
            }}
            renderContent={(b) => (
              <BlockContentEditor
                block={b}
                onChange={(updated) => {
                  const i = blocks.findIndex((x) => x.id === updated.id)
                  if (i < 0) return
                  setBlocks(blocks.map((x, j) => (j === i ? updated : x)))
                }}
              />
            )}
          />

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
            Struktur wird in Klartext umgewandelt (Überschriften/Listen nur grob als Textzeilen). Fett/Kursiv/Links gehen dabei verloren.
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
