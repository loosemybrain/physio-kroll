import type { LegalRichContentBlock, LegalRichListItem, LegalRichTextRun } from "@/types/cms"
import { uuid } from "@/lib/cms/arrayOps"
import { legalPlainTextToParagraphs } from "@/lib/legal/legalPlainTextParagraphs"

export function legalRichTextUsesStructuredContent(props: {
  contentBlocks?: LegalRichContentBlock[] | null
}): boolean {
  return Array.isArray(props.contentBlocks) && props.contentBlocks.length > 0
}

export function createLegalRichRun(overrides: Partial<LegalRichTextRun> = {}): LegalRichTextRun {
  const { id: overrideId, ...rest } = overrides
  const id = overrideId?.trim() ? overrideId : uuid()
  return { id, text: "", ...rest }
}

/**
 * DOM-/Preview-ID für einen Run: gespeicherte `run.id` oder deterministischer Fallback
 * (gleiche Logik wie im Inspector, kein Zufall → SSR/Client konsistent).
 */
export function getLegalRichRunDomId(contentBlockId: string, run: LegalRichTextRun, runIndex: number): string {
  const rid = run.id?.trim()
  if (rid) return rid
  return `${contentBlockId}:run:${runIndex}`
}

/** Deterministisch für Legacy-Daten ohne `item.id` (SSR/Preview ohne UUID-Fluktuation). */
export function getLegalRichListItemDomId(
  contentBlockId: string,
  item: LegalRichListItem,
  itemIndex: number,
): string {
  const iid = item.id?.trim()
  if (iid) return iid
  return `${contentBlockId}:li:${itemIndex}`
}

function ensureRunIds(runs: LegalRichTextRun[]): { runs: LegalRichTextRun[]; changed: boolean } {
  let changed = false
  const next = runs.map((r) => {
    if (r.id?.trim()) return r
    changed = true
    return { ...r, id: uuid() }
  })
  return { runs: changed ? next : runs, changed }
}

function ensureListItemIds(items: LegalRichListItem[]): { items: LegalRichListItem[]; changed: boolean } {
  let changed = false
  const next = items.map((item) => {
    let itemChanged = false
    let id = item.id?.trim()
    if (!id) {
      id = uuid()
      itemChanged = true
    }
    const { runs: rs, changed: rc } = ensureRunIds(item.runs)
    if (itemChanged || rc) changed = true
    return itemChanged || rc ? { ...item, id, runs: rc ? rs : item.runs } : item
  })
  return { items: changed ? next : items, changed }
}

/**
 * Persistente UUIDs für Runs und fehlende Listen-IDs (ohne Referenz zu ändern, wenn schon konsistent).
 */
export function normalizeLegalRichContentBlocksForStorage(blocks: LegalRichContentBlock[]): LegalRichContentBlock[] {
  let anyChanged = false
  const out = blocks.map((b) => {
    switch (b.type) {
      case "paragraph":
      case "heading": {
        const { runs, changed } = ensureRunIds(b.runs)
        if (!changed) return b
        anyChanged = true
        return { ...b, runs }
      }
      case "bulletList":
      case "orderedList": {
        const { items, changed: itemsChanged } = ensureListItemIds(b.items)
        if (!itemsChanged) return b
        anyChanged = true
        return { ...b, items }
      }
      default:
        return b
    }
  })
  return anyChanged ? out : blocks
}

export function createLegalRichListItem(): LegalRichListItem {
  return { id: uuid(), runs: [createLegalRichRun()] }
}

export function createLegalRichParagraphBlock(): LegalRichContentBlock {
  return { id: uuid(), type: "paragraph", runs: [createLegalRichRun()] }
}

export function createLegalRichHeadingBlock(level: 2 | 3 | 4 | 5 | 6 = 3): LegalRichContentBlock {
  return { id: uuid(), type: "heading", level, runs: [createLegalRichRun()] }
}

export function createLegalRichBulletListBlock(): LegalRichContentBlock {
  return { id: uuid(), type: "bulletList", items: [createLegalRichListItem()] }
}

export function createLegalRichOrderedListBlock(): LegalRichContentBlock {
  return { id: uuid(), type: "orderedList", items: [createLegalRichListItem()] }
}

function parseHeading(text: string): { level: 2 | 3 | 4 | 5 | 6; text: string } | null {
  const m = text.match(/^(#{1,6})\s*(.+)$/)
  if (!m) return null
  const markerCount = m[1].length
  const level = markerCount <= 2 ? 2 : markerCount >= 6 ? 6 : (markerCount as 2 | 3 | 4 | 5 | 6)
  return { level, text: m[2].trim() }
}

function parseNaturalHeading(lines: string[]): { level: 2 | 3 | 4 | 5 | 6; text: string } | null {
  if (lines.length !== 1) return null
  const text = lines[0].trim()
  if (!text) return null
  // Konservativ: nur eindeutige Marker wie "Titel:" als Headline interpretieren.
  if (text.endsWith(":")) return { level: 3, text: text.slice(0, -1).trim() }
  return null
}

function parseListLines(lines: string[]): {
  type: "bulletList" | "orderedList"
  items: string[]
} | null {
  const bulletItems = lines
    .map((line) => line.match(/^\s*(?:[-*•·]|[–—])\s+(.+)$/)?.[1]?.trim() ?? null)
  if (bulletItems.every((item) => item && item.length > 0)) {
    return {
      type: "bulletList",
      items: bulletItems as string[],
    }
  }

  const orderedItems = lines
    .map((line) => line.match(/^\s*\d+[.)]\s+(.+)$/)?.[1]?.trim() ?? null)
  if (orderedItems.every((item) => item && item.length > 0)) {
    return {
      type: "orderedList",
      items: orderedItems as string[],
    }
  }

  return null
}

/** Legacy `content` → strukturierte Inhaltsblöcke (inkl. #/Liste-Erkennung). */
export function legalPlainTextToContentBlocks(content: string): LegalRichContentBlock[] {
  const paras = legalPlainTextToParagraphs(content)
  if (paras.length === 0) return [createLegalRichParagraphBlock()]
  return paras.flatMap((paragraph) => {
    const lines = paragraph
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
    const heading = parseHeading(paragraph.trim())
    if (heading) {
      return [{
        id: uuid(),
        type: "heading" as const,
        level: heading.level,
        runs: [{ id: uuid(), text: heading.text }],
      }]
    }
    const naturalHeading = parseNaturalHeading(lines)
    if (naturalHeading) {
      return [{
        id: uuid(),
        type: "heading" as const,
        level: naturalHeading.level,
        runs: [{ id: uuid(), text: naturalHeading.text }],
      }]
    }
    if (lines.length > 0) {
      const parsedList = parseListLines(lines)
      if (parsedList) {
        return [{
          id: uuid(),
          type: parsedList.type,
          items: parsedList.items.map((text) => ({
            id: uuid(),
            runs: [{ id: uuid(), text }],
          })),
        }]
      }
    }
    // Falls ein Absatz mit "Titel:" startet und danach Fliesstext folgt:
    // als Heading + Paragraph importieren.
    if (lines.length >= 2 && lines[0].endsWith(":")) {
      const title = lines[0].slice(0, -1).trim()
      const body = lines.slice(1).join("\n").trim()
      if (title && body) {
        return [
          {
            id: uuid(),
            type: "heading" as const,
            level: 3,
            runs: [{ id: uuid(), text: title }],
          },
          {
            id: uuid(),
            type: "paragraph" as const,
            runs: [{ id: uuid(), text: body }],
          },
        ]
      }
    }
    return [{
      id: uuid(),
      type: "paragraph" as const,
      runs: [{ id: uuid(), text: paragraph }],
    }]
  })
}

function runsToPlain(runs: LegalRichTextRun[]): string {
  return runs.map((r) => r.text).join("")
}

/** Rückkonvertierung für „einfachen Text“-Modus mit Struktur-Markern (#, -, 1.). */
export function legalContentBlocksToPlainText(blocks: LegalRichContentBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "paragraph":
          return runsToPlain(b.runs)
        case "heading":
          return `${"#".repeat(b.level)} ${runsToPlain(b.runs)}`
        case "bulletList":
          return b.items.map((i) => `- ${runsToPlain(i.runs)}`).join("\n")
        case "orderedList":
          return b.items.map((i, idx) => `${idx + 1}. ${runsToPlain(i.runs)}`).join("\n")
        default:
          return ""
      }
    })
    .filter((s) => s.trim().length > 0)
    .join("\n\n")
}

/** Neue IDs für Duplikat eines Blocks. */
export function renewLegalRichContentBlockIds(blocks: LegalRichContentBlock[]): LegalRichContentBlock[] {
  const copyRuns = (runs: LegalRichTextRun[]) =>
    runs.map((r) => ({
      ...r,
      id: uuid(),
      link: r.link ? { ...r.link } : undefined,
    }))
  return blocks.map((b) => {
    const id = uuid()
    switch (b.type) {
      case "paragraph":
        return { ...b, id, runs: copyRuns(b.runs) }
      case "heading":
        return { ...b, id, runs: copyRuns(b.runs) }
      case "bulletList":
      case "orderedList":
        return {
          ...b,
          id,
          items: b.items.map((item) => ({
            ...item,
            id: uuid(),
            runs: copyRuns(item.runs),
          })),
        }
    }
  })
}
