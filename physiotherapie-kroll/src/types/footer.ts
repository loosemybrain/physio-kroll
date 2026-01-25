import type { MediaValue } from "./cms"
import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Footer block types
 */
export type FooterBlock =
  | { type: "text"; id: string; text: string }
  | {
      type: "links"
      id: string
      title?: string
      links: Array<{ id: string; label: string; href: string; newTab?: boolean }>
    }
  | {
      type: "pages"
      id: string
      title?: string
      pageSlugs: string[]
      showUnpublished?: boolean
    }
  | {
      type: "logo"
      id: string
      mediaId?: string
      url?: string
      alt?: string
      size?: "sm" | "md" | "lg"
      fit?: "contain" | "cover"
      href?: string
    }
  | { type: "copyright"; id: string; text: string }

/**
 * Footer section (column)
 */
export type FooterSection = {
  id: string
  title?: string
  span: 2 | 3 | 4 | 6 // Grid span (out of 12 columns)
  blocks: FooterBlock[]
}

/**
 * Footer bottom bar configuration
 */
export type FooterBottomBar = {
  enabled: boolean
  left?: FooterBlock
  right?: FooterBlock
}

/**
 * Footer configuration for a brand
 */
export type FooterConfig = {
  variant?: "default"
  sections: FooterSection[] // min 2, max 5
  bottomBar?: FooterBottomBar
}

/**
 * Footer row from database
 */
export type FooterRow = {
  id: string
  brand: BrandKey
  config: FooterConfig
  created_at: string
  updated_at: string
}
