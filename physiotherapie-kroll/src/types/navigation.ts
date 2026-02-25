import type { MediaValue, SectionBackgroundPreset } from "./cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { NavStylePresetId } from "@/lib/navigation/nav-style-presets"
import type { NavHoverPresetId } from "@/lib/navigation/nav-hover-presets"

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
  // Header layout customization (optional for backward compatibility)
  headerLayoutColumns?: 3 | 4 | 5
  headerFontPreset?: "brand" | "sans" | "serif" | "mono"
  headerMotionPreset?: "none" | "subtle" | "glassy" | "snappy"
  secondaryLinks?: NavLink[]
  infoBadge?: string
  // Navigation style preset (determines theme overrides)
  navStylePresetId?: NavStylePresetId
  // Navigation link hover preset (determines hover effect)
  navHoverPresetId?: NavHoverPresetId
  // Navigation link colors (optional CSS overrides)
  navLinkColor?: string | null
  navLinkHoverColor?: string | null
  navLinkActiveColor?: string | null
  navIndicatorColor?: string | null
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
