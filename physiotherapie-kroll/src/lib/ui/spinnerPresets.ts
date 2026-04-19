export const SPINNER_PRESET_STORAGE_KEY = "pk:spinner-preset:v1"

export const SPINNER_PRESET_KEYS = ["modern", "minimal", "duotone"] as const
export type SpinnerPresetKey = (typeof SPINNER_PRESET_KEYS)[number]

export type SpinnerPresetMeta = {
  key: SpinnerPresetKey
  label: string
  description: string
}

export const SPINNER_PRESETS: SpinnerPresetMeta[] = [
  {
    key: "modern",
    label: "Modern",
    description: "Dezent mit Primary-Akzent (Standard).",
  },
  {
    key: "minimal",
    label: "Minimal",
    description: "Ruhig und reduziert, geringer visueller Kontrast.",
  },
  {
    key: "duotone",
    label: "Duotone",
    description: "Zweifarbiger Spinner mit mehr Dynamik.",
  },
]

export function isSpinnerPresetKey(v: unknown): v is SpinnerPresetKey {
  return typeof v === "string" && (SPINNER_PRESET_KEYS as readonly string[]).includes(v)
}

export function readSpinnerPreset(): SpinnerPresetKey {
  if (typeof window === "undefined") return "modern"
  const raw = window.localStorage.getItem(SPINNER_PRESET_STORAGE_KEY)
  if (!isSpinnerPresetKey(raw)) return "modern"
  return raw
}

export function writeSpinnerPreset(preset: SpinnerPresetKey): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SPINNER_PRESET_STORAGE_KEY, preset)
  document.documentElement.setAttribute("data-spinner-preset", preset)
}

