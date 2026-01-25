import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Whitelist of allowed theme token keys.
 * Only these CSS custom properties are allowed to be injected from DB.
 *
 * Notes:
 * - Keep in sync with variables used in `src/styles/globals.css`
 * - Keys may be stored as "--primary" (recommended) or "primary" (legacy-ish).
 */
export const ALLOWED_THEME_TOKENS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--radius",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--hero-bg",
  "--hero-accent",
  "--hero-highlight",
] as const

export type AllowedThemeTokenKey = (typeof ALLOWED_THEME_TOKENS)[number]

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function normalizeKey(key: string): AllowedThemeTokenKey | null {
  const k = key.startsWith("--") ? key : `--${key}`
  return (ALLOWED_THEME_TOKENS as readonly string[]).includes(k) ? (k as AllowedThemeTokenKey) : null
}

/**
 * Prevent simple CSS injection via value (`;`, `}` etc).
 * Tokens are admin-controlled, but we still harden a bit.
 */
function sanitizeCssValue(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (v.includes(";") || v.includes("}") || v.includes("{") || v.includes("\n")) return null
  return v
}

export function filterThemeTokens(tokens: unknown): Partial<Record<AllowedThemeTokenKey, string>> {
  if (!isRecord(tokens)) return {}
  const out: Partial<Record<AllowedThemeTokenKey, string>> = {}
  for (const [rawKey, rawVal] of Object.entries(tokens)) {
    const key = normalizeKey(rawKey)
    if (!key) continue
    if (typeof rawVal !== "string") continue
    const safeVal = sanitizeCssValue(rawVal)
    if (!safeVal) continue
    out[key] = safeVal
  }
  return out
}

export function tokensToCss(selector: string, tokens: Partial<Record<AllowedThemeTokenKey, string>>): string {
  const entries = Object.entries(tokens).filter(([, v]) => typeof v === "string" && v.length > 0)
  if (entries.length === 0) return ""

  // Use !important so presets override defaults even if CSS order differs.
  const body = entries.map(([k, v]) => `${k}: ${v} !important;`).join("")
  return `${selector}{${body}}`
}

export function themePresetCssForBrand(brand: BrandKey, tokens: unknown): string {
  const filtered = filterThemeTokens(tokens)
  if (brand === "physio-konzept") return tokensToCss(".physio-konzept", filtered)
  return tokensToCss(":root", filtered)
}

