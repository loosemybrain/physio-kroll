/**
 * Font Presets System
 * Manages local fonts (GDPR-compliant) + curated Google Fonts (via next/font/google, self-hosted)
 *
 * LOCAL FONTS:
 * - "Inter" (sans-serif, variable, GDPR-safe)
 * - "Playfair Display" (serif, variable, GDPR-safe)
 *
 * GOOGLE FONTS (build-time import, no runtime external requests):
 * - Imported via next/font/google with display: "swap"
 * - CSS variables injected: --font-lora, --font-merriweather, etc.
 * - No external API calls at runtime (CSP-safe)
 */

import {
  Lora,
  Merriweather,
  Crimson_Text,
  EB_Garamond,
  Playfair_Display,
  Roboto,
  Open_Sans,
  Quicksand,
} from "next/font/google"

/**
 * Font Preset Schema
 */
export type FontPreset = {
  id: string
  label: string
  source: "local" | "google"
  description?: string
  /** CSS class that applies the font (sets --font-sans) */
  applyClass: string
}

/**
 * GOOGLE FONTS - Imported at build-time (no external runtime requests)
 * Each import creates a CSS variable like --font-<id>
 */

// Google Font: Lora (Serif, elegant)
export const fontLora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
})

// Google Font: Merriweather (Serif, traditional)
export const fontMerriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
})

// Google Font: Crimson Text (Serif, classic)
export const fontCrimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
})

// Google Font: EB Garamond (Serif, sophisticated)
export const fontEBGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
})

// Google Font: Playfair Display (Display, elegant heading)
export const fontPlayfairGoogle = Playfair_Display({
  variable: "--font-playfair-google",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
})

// Google Font: Roboto (Sans-serif, modern)
export const fontRoboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
})

// Google Font: Open Sans (Sans-serif, friendly)
export const fontOpenSans = Open_Sans({
  variable: "--font-open-sans",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
})

// Google Font: Quicksand (Sans-serif, soft)
export const fontQuicksand = Quicksand({
  variable: "--font-quicksand",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
})

/**
 * CSS variable classnames for all Google Fonts
 * These are always safe to include (no external requests made)
 */
export const GOOGLE_FONTS_VARIABLES_CLASSNAMES = [
  fontLora.variable,
  fontMerriweather.variable,
  fontCrimsonText.variable,
  fontEBGaramond.variable,
  fontPlayfairGoogle.variable,
  fontRoboto.variable,
  fontOpenSans.variable,
  fontQuicksand.variable,
]
  .filter(Boolean)
  .join(" ")

/**
 * LOCAL FONT PRESETS (GDPR-compliant, no external requests)
 */
const LOCAL_PRESETS: FontPreset[] = [
  {
    id: "inter-local",
    label: "Inter (Local)",
    source: "local",
    description: "Modern, clean sans-serif. Locally hosted, GDPR-safe.",
    applyClass: "font-inter-local",
  },
  {
    id: "playfair-local",
    label: "Playfair Display (Local)",
    source: "local",
    description: "Elegant serif for headings. Locally hosted, GDPR-safe.",
    applyClass: "font-playfair-local",
  },
]

/**
 * GOOGLE FONT PRESETS (build-time, self-hosted, no external API calls)
 */
const GOOGLE_PRESETS: FontPreset[] = [
  {
    id: "lora",
    label: "Lora (Google)",
    source: "google",
    description: "Elegant serif, humanist style.",
    applyClass: "font-lora",
  },
  {
    id: "merriweather",
    label: "Merriweather (Google)",
    source: "google",
    description: "Traditional serif, high legibility.",
    applyClass: "font-merriweather",
  },
  {
    id: "crimson-text",
    label: "Crimson Text (Google)",
    source: "google",
    description: "Classic serif, book-like feel.",
    applyClass: "font-crimson-text",
  },
  {
    id: "eb-garamond",
    label: "EB Garamond (Google)",
    source: "google",
    description: "Sophisticated serif, traditional typography.",
    applyClass: "font-eb-garamond",
  },
  {
    id: "playfair-google",
    label: "Playfair Display (Google)",
    source: "google",
    description: "Display serif, elegant and bold.",
    applyClass: "font-playfair-google",
  },
  {
    id: "roboto",
    label: "Roboto (Google)",
    source: "google",
    description: "Modern sans-serif, versatile.",
    applyClass: "font-roboto",
  },
  {
    id: "open-sans",
    label: "Open Sans (Google)",
    source: "google",
    description: "Friendly sans-serif, highly readable.",
    applyClass: "font-open-sans",
  },
  {
    id: "quicksand",
    label: "Quicksand (Google)",
    source: "google",
    description: "Soft sans-serif, modern and playful.",
    applyClass: "font-quicksand",
  },
]

/**
 * All available font presets (local + google)
 */
export const ALL_FONT_PRESETS: FontPreset[] = [
  ...LOCAL_PRESETS,
  ...GOOGLE_PRESETS,
]

/**
 * Default preset (falls back to local Inter for GDPR safety)
 */
export const DEFAULT_FONT_PRESET = "inter-local"

/**
 * Get preset by ID
 */
export function getFontPresetById(id: string): FontPreset | undefined {
  return ALL_FONT_PRESETS.find((preset) => preset.id === id)
}

/**
 * Get all available preset IDs
 */
export function getAllFontPresetIds(): string[] {
  return ALL_FONT_PRESETS.map((p) => p.id)
}

/**
 * Type guard for valid preset IDs
 */
export function isValidFontPresetId(value: unknown): value is string {
  if (typeof value !== "string") return false
  return ALL_FONT_PRESETS.some((p) => p.id === value)
}
