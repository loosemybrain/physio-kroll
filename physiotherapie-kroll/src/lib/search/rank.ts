"use client"

import type { SearchItem, SearchResult } from "./types"

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function scoreText(haystack: string, needle: string): number {
  const h = norm(haystack)
  const n = norm(needle)
  if (!n) return 0
  if (h === n) return 200
  if (h.startsWith(n)) return 120
  if (h.includes(n)) return 60
  return 0
}

export function rankItems(items: SearchItem[], query: string, limit = 30): SearchResult[] {
  const q = query.trim()
  if (!q) return []

  const parts = q.split(/\s+/).filter(Boolean)

  const scored = items
    .map((it) => {
      let score = 0
      for (const p of parts) {
        score += scoreText(it.title, p) * 4
        if (it.description) score += scoreText(it.description, p) * 1
        if (it.keywords?.length) {
          for (const k of it.keywords) score += scoreText(k, p) * 2
        }
      }

      // Legal/Meta-Inhalte bewusst niedriger werten (aber nicht rausfiltern).
      if (
        it.category === "Seiten" &&
        (it.href.includes("datenschutz") || it.href.includes("impressum") || it.href.includes("cookies"))
      ) {
        score -= 30
      }

      score += (it.priority ?? 0)
      return { ...it, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit)
}

