export const SPINNER_PRESET_STORAGE_KEY = "pk:spinner-preset:v1"
export const SPINNER_SPEED_STORAGE_KEY = "pk:spinner-speed:v1"
export const SPINNER_CONFIGS_STORAGE_KEY = "pk:spinner-configs:v1"

export const SPINNER_PRESET_KEYS = ["modern", "minimal", "duotone", "dots", "glass", "wave", "yin-yang", "progress", "orbital"] as const
export type SpinnerPresetKey = (typeof SPINNER_PRESET_KEYS)[number]
export const SPINNER_SPEED_KEYS = ["slow", "normal", "fast"] as const
export type SpinnerSpeedKey = (typeof SPINNER_SPEED_KEYS)[number]
export const SPINNER_OVERLAY_KEYS = ["light", "medium", "strong"] as const
export type SpinnerOverlayStrength = (typeof SPINNER_OVERLAY_KEYS)[number]
export type SpinnerBrandKey = "physiotherapy" | "physio-konzept"
export type SpinnerConfig = {
  preset: SpinnerPresetKey
  speed: SpinnerSpeedKey
  overlayStrength: SpinnerOverlayStrength
}

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
  {
    key: "dots",
    label: "Dots",
    description: "Pulsierende Punkte, freundlich und modern.",
  },
  {
    key: "glass",
    label: "Glass Ring",
    description: "Leicht glasiger Ring mit sanfter Anmutung.",
  },
  {
    key: "wave",
    label: "Wave Bubble",
    description: "Fluide Wellen-Animation (Liquid-Style).",
  },
  {
    key: "yin-yang",
    label: "Yin Yang",
    description: "Klassische rotierende Yin-Yang-Animation.",
  },
  {
    key: "progress",
    label: "Progress Bar",
    description: "Ladebalken mit animierter Füllung.",
  },
  {
    key: "orbital",
    label: "Orbital Rings",
    description: "3D-Ring-Spinner mit gegenläufiger Orbit-Anmutung.",
  },
]

export const SPINNER_SPEEDS: Array<{ key: SpinnerSpeedKey; label: string; description: string }> = [
  { key: "slow", label: "Langsam", description: "Ruhig und elegant." },
  { key: "normal", label: "Normal", description: "Ausgewogen (Standard)." },
  { key: "fast", label: "Schnell", description: "Dynamisch, kurze Ladephasen." },
]

export const SPINNER_OVERLAYS: Array<{ key: SpinnerOverlayStrength; label: string; description: string }> = [
  { key: "light", label: "Leicht", description: "Sehr dezente Abdunkelung." },
  { key: "medium", label: "Mittel", description: "Ausgewogen (Standard)." },
  { key: "strong", label: "Stark", description: "Deutlicher Fokus auf den Loader." },
]

export function isSpinnerPresetKey(v: unknown): v is SpinnerPresetKey {
  return typeof v === "string" && (SPINNER_PRESET_KEYS as readonly string[]).includes(v)
}

export function isSpinnerSpeedKey(v: unknown): v is SpinnerSpeedKey {
  return typeof v === "string" && (SPINNER_SPEED_KEYS as readonly string[]).includes(v)
}

export function isSpinnerOverlayStrength(v: unknown): v is SpinnerOverlayStrength {
  return typeof v === "string" && (SPINNER_OVERLAY_KEYS as readonly string[]).includes(v)
}

function isSpinnerBrandKey(v: unknown): v is SpinnerBrandKey {
  return v === "physiotherapy" || v === "physio-konzept"
}

function safeConfig(v: unknown): SpinnerConfig {
  const rec = (typeof v === "object" && v !== null ? v : {}) as Record<string, unknown>
  const preset = isSpinnerPresetKey(rec.preset) ? rec.preset : "modern"
  const speed = isSpinnerSpeedKey(rec.speed) ? rec.speed : "normal"
  const overlayStrength = isSpinnerOverlayStrength(rec.overlayStrength) ? rec.overlayStrength : "medium"
  return { preset, speed, overlayStrength }
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

export function readSpinnerSpeed(): SpinnerSpeedKey {
  if (typeof window === "undefined") return "normal"
  const raw = window.localStorage.getItem(SPINNER_SPEED_STORAGE_KEY)
  if (!isSpinnerSpeedKey(raw)) return "normal"
  return raw
}

export function writeSpinnerSpeed(speed: SpinnerSpeedKey): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SPINNER_SPEED_STORAGE_KEY, speed)
  document.documentElement.setAttribute("data-spinner-speed", speed)
}

export function spinnerBrandFromPath(pathname: string): SpinnerBrandKey {
  return pathname === "/konzept" || pathname.startsWith("/konzept/") ? "physio-konzept" : "physiotherapy"
}

export function readSpinnerConfigForBrand(brand: SpinnerBrandKey): SpinnerConfig {
  if (typeof window === "undefined") return { preset: "modern", speed: "normal", overlayStrength: "medium" }

  // New per-brand storage
  const raw = window.localStorage.getItem(SPINNER_CONFIGS_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const item = parsed[brand]
      if (item) return safeConfig(item)
    } catch {
      // ignore malformed JSON; fallback below
    }
  }

  // Backward compatibility: old global values
  return { preset: readSpinnerPreset(), speed: readSpinnerSpeed(), overlayStrength: "medium" }
}

export function writeSpinnerConfigForBrand(brand: SpinnerBrandKey, config: SpinnerConfig): void {
  if (typeof window === "undefined") return
  const next = safeConfig(config)

  let parsed: Record<string, unknown> = {}
  const raw = window.localStorage.getItem(SPINNER_CONFIGS_STORAGE_KEY)
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      parsed = {}
    }
  }
  parsed[brand] = next
  window.localStorage.setItem(SPINNER_CONFIGS_STORAGE_KEY, JSON.stringify(parsed))

  // Keep legacy keys in sync for current brand and CSS/debug attributes.
  writeSpinnerPreset(next.preset)
  writeSpinnerSpeed(next.speed)
}

export function readSpinnerConfigsAllBrands(): Record<SpinnerBrandKey, SpinnerConfig> {
  return {
    physiotherapy: readSpinnerConfigForBrand("physiotherapy"),
    "physio-konzept": readSpinnerConfigForBrand("physio-konzept"),
  }
}

export function writeSpinnerConfigsAllBrands(configs: Record<SpinnerBrandKey, SpinnerConfig>): void {
  writeSpinnerConfigForBrand("physiotherapy", configs.physiotherapy)
  writeSpinnerConfigForBrand("physio-konzept", configs["physio-konzept"])
}

export function spinnerOverlayClass(strength: SpinnerOverlayStrength): string {
  if (strength === "light") return "bg-background/55"
  if (strength === "strong") return "bg-background/88"
  return "bg-background/78"
}

