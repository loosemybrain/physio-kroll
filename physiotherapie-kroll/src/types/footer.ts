import type { MediaValue } from "./cms"
import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Footer spacing options
 */
export type FooterSpacing = "compact" | "normal" | "spacious"

/**
 * Section alignment options
 */
export type SectionAlign = "left" | "center" | "right"

/**
 * Typography options
 */
export type TypographySize = "sm" | "base" | "lg"
export type TypographyWeight = "normal" | "semibold" | "bold"
export type FontFamily = "sans" | "serif" | "mono" | "geist-sans" | "geist-mono"

/**
 * Footer design configuration
 */
export type FooterDesign = {
  bgClass?: string
  textClass?: string
  headingClass?: string
  borderClass?: string
  linkClass?: string
  linkHoverClass?: string
  focus?: string
  mutedText?: string
  spacing?: {
    py?: FooterSpacing
  }
  section?: {
    align?: SectionAlign
  }
  typography?: {
    bodySize?: TypographySize
    bodyWeight?: TypographyWeight
    bodyFont?: FontFamily
    headingSize?: TypographySize
    headingWeight?: TypographyWeight
    headingFont?: FontFamily
  }
  colors?: {
    bgCustom?: string
    textCustom?: string
    headingCustom?: string
    accentCustom?: string
  }
  bottomBar?: {
    dividerEnabled?: boolean
    dividerClass?: string
    align?: SectionAlign
  }
}

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
 * Footer background configuration (outer section)
 */
export type FooterBackground = {
  mode?: "transparent" | "color" | "gradient" | "image" | "video"
  color?: string
  gradientPreset?: "soft" | "aurora" | "ocean" | "sunset" | "hero" | "none"
  gradient?: {
    from?: string
    via?: string
    to?: string
    angle?: number
  }
  mediaId?: string
  mediaUrl?: string
  overlay?: {
    enabled?: boolean
    color?: string
    opacity?: number
  }
  parallax?: {
    enabled?: boolean
    strength?: number
  }
}

/**
 * Footer glassmorphism panel configuration (inner container)
 */
export type FooterGlassmorphism = {
  enabled?: boolean
  intensity?: "subtle" | "medium" | "strong"
  blurPx?: number
  panelOpacity?: number
  borderOpacity?: number
  highlightLine?: boolean
  shadowPreset?: string
  tintColor?: string
}

/**
 * Footer configuration for a brand
 */
export type FooterConfig = {
  variant?: "default"
  sections: FooterSection[] // min 2, max 5
  bottomBar?: FooterBottomBar
  design?: FooterDesign
  layoutWidth?: "full" | "contained" // controls footer content width
  background?: FooterBackground // outer section background
  glassmorphism?: FooterGlassmorphism // inner panel glass effect
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
