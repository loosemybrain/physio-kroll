import type { MediaValue, SectionBackgroundPreset } from "./cms"
import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Navigation link configuration
 */
export type NavLink = {
  id: string
  label: string
  type: "page" | "url"
  pageSlug?: string
  href?: string
  newTab?: boolean
  visibility: "physiotherapy" | "physio-konzept" | "both"
  sort: number
}

/**
 * CTA button configuration
 */
export type NavCta = {
  enabled: boolean
  label: string
  type: "page" | "url"
  pageSlug?: string
  href?: string
  variant?: "default" | "secondary" | "outline"
}

/**
 * Navigation configuration for a brand
 */
export type NavConfig = {
  logo: MediaValue | null
  logoSize?: "sm" | "md" | "lg"
  logoFit?: "contain" | "cover"
  links: NavLink[]
  cta?: NavCta | null
  searchEnabled: boolean
  presets?: {
    sectionBackground?: SectionBackgroundPreset[]
  }
}

/**
 * Navigation row from database
 */
export type NavigationRow = {
  id: string
  brand: BrandKey
  config: NavConfig
  created_at: string
  updated_at: string
}
