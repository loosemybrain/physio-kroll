import type { FooterConfig, FooterSection } from "@/types/footer"
import { DEFAULT_FOOTER_CONFIG } from "@/types/footer"

/* ------------------------------------------------------------------ */
/*  Lightweight validation (no zod dependency)                         */
/* ------------------------------------------------------------------ */

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val)
}

function isArrayOf(val: unknown, check: (item: unknown) => boolean): boolean {
  return Array.isArray(val) && val.every(check)
}

function isFooterBlock(val: unknown): boolean {
  if (!isObject(val)) return false
  return typeof val.id === "string" && typeof val.type === "string"
}

function isFooterSection(val: unknown): boolean {
  if (!isObject(val)) return false
  return typeof val.id === "string" && isArrayOf(val.blocks, isFooterBlock)
}

/** Validates the shape of a FooterConfig object */
export function validateFooterConfig(raw: unknown): { success: boolean; data?: FooterConfig; error?: string } {
  if (!isObject(raw)) {
    return { success: false, error: "Config must be an object" }
  }

  if (!isArrayOf(raw.sections, isFooterSection)) {
    return { success: false, error: "sections must be an array of valid sections" }
  }

  // Passes structural check — cast (deep validation could be added later)
  return { success: true, data: raw as FooterConfig }
}

/** Convenience alias matching the previous zod-based API */
export const footerConfigSchema = {
  safeParse(raw: unknown) {
    return validateFooterConfig(raw)
  },
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

/** Ensure sections span totals to 4 (for 4-col CSS grid).
 *  If no span set, distribute evenly; if total != 4, normalize. */
export function ensureSectionSpans(sections: FooterSection[]): FooterSection[] {
  if (sections.length === 0) return sections

  const totalExplicit = sections.reduce((sum, s) => sum + (s.span ?? 0), 0)
  const unset = sections.filter((s) => !s.span).length

  if (totalExplicit === 0) {
    const base = Math.floor(4 / sections.length)
    const remainder = 4 % sections.length
    return sections.map((s, i) => ({
      ...s,
      span: base + (i < remainder ? 1 : 0),
    }))
  }

  if (unset > 0) {
    const remaining = Math.max(0, 4 - totalExplicit)
    const perUnset = Math.max(1, Math.floor(remaining / unset))
    return sections.map((s) => ({
      ...s,
      span: s.span ?? perUnset,
    }))
  }

  return sections
}

/** Parse + validate, return default on failure */
export function parseFooterConfig(raw: unknown): FooterConfig {
  const result = validateFooterConfig(raw)
  if (result.success && result.data) {
    return {
      ...result.data,
      sections: ensureSectionSpans(result.data.sections),
    }
  }
  return DEFAULT_FOOTER_CONFIG
}
