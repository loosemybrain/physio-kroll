/**
 * Central gradient preset definitions for admin selects and theme resolvers.
 * Single source of truth to avoid copy-paste across PageEditor, FooterEditor, etc.
 */

export const GRADIENT_PRESETS = [
  { value: "soft", label: "Soft" },
  { value: "aurora", label: "Aurora" },
  { value: "ocean", label: "Ocean" },
  { value: "sunset", label: "Sunset" },
  { value: "hero", label: "Hero" },
  { value: "none", label: "Keine" },
] as const

export type GradientPresetValue = (typeof GRADIENT_PRESETS)[number]["value"]
