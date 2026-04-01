import type { CMSBlock } from "@/types/cms"
import { sanitizeCmsHtml } from "./sanitizeCmsHtml"

function cloneBlock<T extends CMSBlock>(block: T): T {
  if (typeof structuredClone !== "undefined") {
    return structuredClone(block)
  }
  return JSON.parse(JSON.stringify(block)) as T
}

/**
 * Bereinigt bekannte CMS-HTML-/Richtext-Felder vor der Persistenz.
 * Nutzt dieselbe Policy wie das Rendering (`sanitizeCmsHtml` → `cmsHtmlPolicy`).
 * Keine pauschale Änderung aller Strings; unbekannte Block-Typen und andere Felder bleiben unverändert.
 */
export function sanitizeCmsBlocksForPersistence(blocks: CMSBlock[]): CMSBlock[] {
  let anyChanged = false

  const result = blocks.map((block) => {
    const next = cloneBlock(block)
    switch (next.type) {
      case "text": {
        const p = next.props as { content?: unknown }
        if (typeof p.content === "string") {
          const raw = p.content
          const s = sanitizeCmsHtml(raw, "richText")
          if (s !== raw) anyChanged = true
          ;(next.props as { content: string }).content = s
        }
        break
      }
      case "faq": {
        const p = next.props as { items?: unknown }
        if (!Array.isArray(p.items)) break
        ;(next.props as { items: unknown[] }).items = p.items.map((item) => {
          if (!item || typeof item !== "object") return item
          const rec = item as Record<string, unknown>
          if (typeof rec.answer !== "string") return item
          const raw = rec.answer
          const s = sanitizeCmsHtml(raw, "richText")
          if (s !== raw) anyChanged = true
          return { ...rec, answer: s }
        })
        break
      }
      case "legalSection": {
        const p = next.props as { content?: unknown }
        if (typeof p.content === "string") {
          const raw = p.content
          const s = sanitizeCmsHtml(raw, "richText")
          if (s !== raw) anyChanged = true
          ;(next.props as { content: string }).content = s
        }
        break
      }
      case "featureGrid": {
        const p = next.props as { features?: unknown }
        if (!Array.isArray(p.features)) break
        ;(next.props as { features: unknown[] }).features = p.features.map((f) => {
          if (!f || typeof f !== "object") return f
          const rec = f as Record<string, unknown>
          if (typeof rec.icon !== "string") return f
          const raw = rec.icon
          const s = sanitizeCmsHtml(raw, "inlineIcon")
          if (s !== raw) anyChanged = true
          return { ...rec, icon: s }
        })
        break
      }
      default:
        break
    }
    return next
  })

  if (process.env.NODE_ENV === "development" && anyChanged) {
    console.debug("[cms] sanitizeCmsHtmlOnWrite: HTML-Felder vor Persistenz bereinigt")
  }

  return result
}

/**
 * Seite für Persistenz: nur `blocks` werden angetastet (Titel, Slug, Meta bleiben unverändert).
 */
export function sanitizeAdminPageForPersistence<T extends { blocks: CMSBlock[] }>(page: T): T {
  return { ...page, blocks: sanitizeCmsBlocksForPersistence(page.blocks) }
}
