import type { BrandKey } from "@/components/brand/brandAssets"

export type SearchCategory =
  | "Navigation"
  | "Bereiche"
  | "Seiten"
  | "Anker"
  | "Team"
  | "Leistungen"
  | "Kurse"

export type SearchItem = {
  id: string
  title: string
  description?: string
  category: SearchCategory
  href: string
  brand?: BrandKey
  keywords?: string[]
  priority?: number
}

export type SearchResult = SearchItem & {
  score: number
}

