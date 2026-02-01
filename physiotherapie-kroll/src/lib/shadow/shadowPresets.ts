/**
 * Global shadow presets for the CMS element styling system
 * Pure box-shadow CSS values, no Tailwind
 */

export const SHADOW_PRESETS = {
  none: "none",
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  glow: "0 0 20px rgba(59, 130, 246, 0.5)",
} as const

export type ShadowPresetKey = keyof typeof SHADOW_PRESETS

export function isShadowPresetKey(value: unknown): value is ShadowPresetKey {
  return typeof value === "string" && value in SHADOW_PRESETS
}

/**
 * Get a shadow preset by key
 */
export function getShadowPreset(preset: ShadowPresetKey): string {
  return SHADOW_PRESETS[preset]
}
