"use client"

import type { NavConfig, NavLink } from "@/types/navigation"
import type { BrandKey } from "@/components/brand/brandAssets"
import { buildAnchorHref, resolvePagePathForBrand } from "@/lib/navigation/scrollToAnchor"
import type { SearchItem } from "./types"

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function linkToItem(link: NavLink, brand: BrandKey): SearchItem | null {
  const title = link.label?.trim()
  if (!title) return null

  if (link.type === "anchor" && link.anchorBlockId) {
    return {
      id: `nav:${brand}:anchor:${link.id}`,
      title,
      description: "Springe zu Abschnitt",
      category: "Anker",
      href: buildAnchorHref(link.anchorBlockId, link.anchorPageSlug, brand),
      brand,
      keywords: [normalizeText(title)],
      priority: 80,
    }
  }

  if (link.type === "page") {
    const href = resolvePagePathForBrand(link.pageSlug, brand)
    return {
      id: `nav:${brand}:page:${link.id}`,
      title,
      description: "Seite öffnen",
      category: "Seiten",
      href,
      brand,
      keywords: [normalizeText(title), normalizeText(link.pageSlug ?? "")].filter(Boolean),
      priority: 60,
    }
  }

  if (link.type === "url" && link.href) {
    return {
      id: `nav:${brand}:url:${link.id}`,
      title,
      description: link.href,
      category: "Navigation",
      href: link.href,
      brand,
      keywords: [normalizeText(title), normalizeText(link.href)],
      priority: 40,
    }
  }

  return null
}

export function buildSearchItemsFromNav(navConfig: NavConfig, brand: BrandKey): SearchItem[] {
  const links = (navConfig.links ?? []).filter((l) => l.visibility === "both" || l.visibility === brand)
  const secondary = (navConfig.secondaryLinks ?? []).filter((l) => l.visibility === "both" || l.visibility === brand)

  const items = [...links, ...secondary]
    .map((l) => linkToItem(l, brand))
    .filter(Boolean) as SearchItem[]

  // De-dupe by href+title
  const seen = new Set<string>()
  const deduped: SearchItem[] = []
  for (const it of items) {
    const key = `${it.href}::${it.title}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(it)
  }
  return deduped
}

