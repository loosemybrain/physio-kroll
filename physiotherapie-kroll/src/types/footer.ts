import type { MediaValue } from "./cms"
import type { ElementShadow } from "./cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { GradientPresetValue } from "@/lib/theme/gradientPresets"

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
      alignX?: "left" | "center" | "right"
      alignY?: "top" | "center" | "bottom"
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
  gradientPreset?: GradientPresetValue
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
  borderColor?: string
  highlightLine?: boolean
  highlightColor?: string
  shadowPreset?: string
  /** Panel-Box-Shadow (wie in Blocks: Shadow Inspector) */
  panelShadow?: ElementShadow
  tintColor?: string
}

/**
 * Placement of the Legal links block in the footer
 */
export type LegalLinksPlacement = "section" | "bottom-bar"

/**
 * Layout variant for Legal links
 */
export type LegalLinksLayout = "inline" | "stacked" | "separated" | "chips"

/**
 * Which legal items to show (by subtype). Only privacy, cookies, imprint – no AGB/Widerruf.
 */
export type LegalLinksItems = {
  imprint?: boolean
  privacy?: boolean
  cookies?: boolean
}

/**
 * Dedizierte Konfiguration für den Legal-Bereich im Footer.
 * Steuert nur Sichtbarkeit, Auswahl und Darstellung; Inhalte kommen aus dem CMS.
 */
export type FooterLegalLinksConfig = {
  enabled: boolean
  title?: string
  placement?: LegalLinksPlacement
  layout?: LegalLinksLayout
  align?: "left" | "center" | "right"
  showTitle?: boolean
  gap?: "sm" | "md" | "lg"
  marginTop?: "none" | "sm" | "md" | "lg"
  textColor?: string
  hoverColor?: string
  activeColor?: string
  separatorColor?: string
  fontSize?: "xs" | "sm" | "base"
  fontWeight?: "normal" | "medium" | "semibold"
  uppercase?: boolean
  items: LegalLinksItems
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
  /** Dedizierter Legal-Bereich (Datenschutz, Cookies, Impressum). Optional für Rückwärtskompatibilität. */
  legalLinks?: FooterLegalLinksConfig
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
