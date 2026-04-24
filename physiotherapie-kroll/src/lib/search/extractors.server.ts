import type { BrandKey } from "@/components/brand/brandAssets"
import type { BlockType } from "@/types/cms"
import { buildAnchorHref } from "@/lib/navigation/scrollToAnchor"
import type { SearchItem } from "./types"

type DbBlockRow = {
  id: string
  type: BlockType | string
  props: unknown
}

function s(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  return t ? t : null
}

function arr<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function hrefForBlock(blockId: string, pageSlug: string, brand: BrandKey): string {
  return buildAnchorHref(blockId, pageSlug, brand)
}

export function extractSearchItemsFromBlock(opts: {
  block: DbBlockRow
  pageSlug: string
  brand: BrandKey
}): SearchItem[] {
  const { block, pageSlug, brand } = opts
  const p = (block.props ?? {}) as Record<string, unknown>
  const href = hrefForBlock(block.id, pageSlug, brand)
  const out: SearchItem[] = []

  // Common headings
  const headline = s(p.headline)
  const subheadline = s(p.subheadline)
  const eyebrow = s(p.eyebrow)

  if (headline) {
    out.push({
      id: `block:${block.id}:headline`,
      title: headline,
      description: subheadline ?? undefined,
      category: "Bereiche",
      href,
      brand,
      keywords: [subheadline, eyebrow].filter(Boolean) as string[],
      priority: 45,
    })
  }

  switch (block.type) {
    case "team": {
      const members = arr<Record<string, unknown>>(p.members)
      for (const m of members) {
        const name = s(m.name)
        if (!name) continue
        const role = s(m.role)
        const bio = s(m.bio)
        const tags = arr<string>(m.tags).filter((t) => typeof t === "string" && t.trim()).slice(0, 8)
        out.push({
          id: `team:${block.id}:${String(m.id ?? name)}`,
          title: name,
          description: [role, bio ? bio : null].filter(Boolean).join(" · ") || undefined,
          category: "Team",
          href,
          brand,
          keywords: [role, ...tags].filter(Boolean) as string[],
          priority: 90,
        })
      }
      return out
    }

    case "servicesGrid": {
      const cards = arr<Record<string, unknown>>(p.cards)
      for (const c of cards) {
        const title = s(c.title)
        if (!title) continue
        const text = s(c.text)
        out.push({
          id: `service:${block.id}:${String(c.id ?? title)}`,
          title,
          description: text ?? undefined,
          category: "Leistungen",
          href,
          brand,
          keywords: [text].filter(Boolean) as string[],
          priority: 85,
        })
      }
      return out
    }

    case "courseSchedule": {
      const slots = arr<Record<string, unknown>>(p.slots)
      for (const slot of slots) {
        const title = s(slot.title)
        if (!title) continue
        const instructor = s(slot.instructor)
        const location = s(slot.location)
        const weekday = s(slot.weekday)
        const start = s(slot.startTime)
        const end = s(slot.endTime)
        const desc = [weekday, start && end ? `${start}–${end}` : null, instructor, location].filter(Boolean).join(" · ")
        out.push({
          id: `course:${block.id}:${String(slot.id ?? title)}`,
          title,
          description: desc || undefined,
          category: "Kurse",
          href,
          brand,
          keywords: [weekday, instructor, location].filter(Boolean) as string[],
          priority: 80,
        })
      }
      return out
    }

    case "faq": {
      const items = arr<Record<string, unknown>>(p.items)
      for (const it of items) {
        const q = s(it.question)
        if (!q) continue
        const a = s(it.answer)
        out.push({
          id: `faq:${block.id}:${String(it.id ?? q)}`,
          title: q,
          description: a ? a.slice(0, 160) : undefined,
          category: "Bereiche",
          href,
          brand,
          keywords: [a].filter(Boolean) as string[],
          priority: 35,
        })
      }
      return out
    }

    case "featureGrid": {
      const features = arr<Record<string, unknown>>(p.features)
      for (const f of features) {
        const title = s(f.title)
        if (!title) continue
        const description = s(f.description)
        out.push({
          id: `feature:${block.id}:${String(f.id ?? title)}`,
          title,
          description: description ?? undefined,
          category: "Leistungen",
          href,
          brand,
          keywords: [description].filter(Boolean) as string[],
          priority: 70,
        })
      }
      return out
    }

    case "card": {
      const title = s(p.title)
      if (title) {
        const description = s(p.description)
        const content = s(p.content)
        out.push({
          id: `card:${block.id}`,
          title,
          description: description ?? (content ? stripHtml(content).slice(0, 180) : undefined),
          category: "Bereiche",
          href,
          brand,
          keywords: [description, content ? stripHtml(content) : null].filter(Boolean) as string[],
          priority: 55,
        })
      }
      return out
    }

    case "text": {
      const title = s(p.headline) ?? s(p.title)
      const content = s(p.content)
      if (title || content) {
        out.push({
          id: `text:${block.id}`,
          title: title ?? "Text",
          description: content ? stripHtml(content).slice(0, 180) : undefined,
          category: "Bereiche",
          href,
          brand,
          keywords: [content ? stripHtml(content) : null].filter(Boolean) as string[],
          priority: 40,
        })
      }
      return out
    }

    case "imageText": {
      const title = s(p.headline) ?? s(p.eyebrow)
      const content = s(p.content)
      if (title || content) {
        out.push({
          id: `imageText:${block.id}`,
          title: title ?? "Inhalt",
          description: content ? stripHtml(content).slice(0, 180) : undefined,
          category: "Bereiche",
          href,
          brand,
          keywords: [content ? stripHtml(content) : null, s(p.ctaText)].filter(Boolean) as string[],
          priority: 45,
        })
      }
      return out
    }

    case "section": {
      const title = s(p.headline)
      const content = s(p.content)
      if (title || content) {
        out.push({
          id: `section:${block.id}`,
          title: title ?? "Abschnitt",
          description: content ? stripHtml(content).slice(0, 180) : undefined,
          category: "Bereiche",
          href,
          brand,
          keywords: [content ? stripHtml(content) : null, s(p.subheadline)].filter(Boolean) as string[],
          priority: 45,
        })
      }
      return out
    }
  }

  return out
}

