import type { NavTheme } from "@/lib/theme/navTheme"
import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Navigation style preset identifiers
 */
export type NavStylePresetId = "minimal" | "elevated" | "glass" | "accent-underline"

/**
 * Navigation style preset configuration
 */
export interface NavStylePreset {
  id: NavStylePresetId
  label: string
  description: string
  overrides: Partial<NavTheme>
  // Brand-specific overrides for glass/accent-underline presets
  brandOverrides?: {
    physiotherapy?: Partial<NavTheme>
    "physio-konzept"?: Partial<NavTheme>
  }
}

/**
 * Built-in navigation style presets
 * These override base theme properties for different visual styles
 * IMPORTANT: Glass and accent-underline presets are brand-aware
 */
export const NAV_STYLE_PRESETS: NavStylePreset[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Klare, minimalistische Linie ohne zusätzliche Effekte",
    overrides: {
      shadow: "shadow-none",
      shadowScrolled: "shadow-none",
      // Indicator uses brand default color
    },
  },
  {
    id: "elevated",
    label: "Elevated",
    description: "Mit starkem Schatten für Tiefenwirkung",
    overrides: {
      shadow: "shadow-lg",
      shadowScrolled: "shadow-2xl",
    },
  },
  {
    id: "glass",
    label: "Glass",
    description: "Glasmorphismus mit Blur-Effekt",
    overrides: {
      // Default overrides - will be merged with brand-specific
      shadow: "shadow-lg",
      shadowScrolled: "shadow-2xl",
    },
    brandOverrides: {
      physiotherapy: {
        wrapper: "bg-white/50 backdrop-blur-xl border-b border-white/20",
        wrapperScrolled: "bg-white/70 backdrop-blur-xl border-b border-white/30",
      },
      "physio-konzept": {
        wrapper: "bg-[#0f0f10]/50 backdrop-blur-xl border-b border-white/15",
        wrapperScrolled: "bg-[#0f0f10]/70 backdrop-blur-xl border-b border-white/25",
      },
    },
  },
  {
    id: "accent-underline",
    label: "Accent Underline",
    description: "Breite Linie mit Markenfarbe",
    overrides: {
      shadow: "shadow-sm",
      shadowScrolled: "shadow-md",
      // Indicator shows prominently
    },
  },
]

/**
 * Get a preset by ID
 */
export function getPresetById(id: NavStylePresetId): NavStylePreset | undefined {
  return NAV_STYLE_PRESETS.find((p) => p.id === id)
}

/**
 * Apply preset overrides to a base theme (brand-aware)
 */
export function applyPresetToTheme(
  baseTheme: NavTheme,
  presetId?: NavStylePresetId,
  brand?: BrandKey
): NavTheme {
  if (!presetId) {
    return baseTheme
  }

  const preset = getPresetById(presetId)
  if (!preset) {
    return baseTheme
  }

  // Start with base overrides
  let finalOverrides = { ...preset.overrides }

  // If brand-specific overrides exist for this preset, merge them
  if (brand && preset.brandOverrides && preset.brandOverrides[brand]) {
    finalOverrides = {
      ...finalOverrides,
      ...preset.brandOverrides[brand],
    }
  }

  return {
    ...baseTheme,
    ...finalOverrides,
  }
}
