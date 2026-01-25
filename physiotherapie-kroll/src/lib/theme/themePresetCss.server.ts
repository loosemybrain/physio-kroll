import "server-only"

import type { BrandKey } from "@/components/brand/brandAssets"
import { getActiveThemePresetForBrand, getActiveThemePresetsForBrands } from "@/lib/supabase/themePresets"
import { filterThemeTokens, themePresetCssForBrand } from "@/lib/theme/themePresetTokens"
import { unstable_noStore as noStore } from "next/cache"

/**
 * Loads active theme preset tokens for both brands and returns CSS overrides.
 * Injected into <head> in `src/app/layout.tsx`.
 *
 * If no preset is active (or tokens empty), returns an empty string so defaults from globals.css apply.
 */
export async function getThemePresetCss(): Promise<string> {
  noStore()
  const brands: BrandKey[] = ["physiotherapy", "physio-konzept"]
  const data = await getActiveThemePresetsForBrands(brands)

  if (process.env.NODE_ENV === "development") {
    console.log("[theme-presets] physiotherapy", {
      presetId: data.physiotherapy.presetId,
      presetName: data.physiotherapy.presetName,
    })
    console.log("[theme-presets] physio-konzept", {
      presetId: data["physio-konzept"].presetId,
      presetName: data["physio-konzept"].presetName,
    })
  }

  const cssPhysio = themePresetCssForBrand("physiotherapy", data.physiotherapy.tokens)
  const cssKonzept = themePresetCssForBrand("physio-konzept", data["physio-konzept"].tokens)
  const css = `${cssPhysio}\n${cssKonzept}`.trim()
  return css
}

/**
 * Loads active preset tokens for ONE brand and returns inline CSS variables for <html style={...}>.
 * This avoids selector/order issues (inline style wins over globals.css).
 */
export async function getThemePresetInlineVars(brand: BrandKey): Promise<{
  brand: BrandKey
  presetId: string | null
  presetName: string | null
  vars: Record<string, string>
}> {
  noStore()
  const active = await getActiveThemePresetForBrand(brand)
  const filtered = filterThemeTokens(active?.tokens ?? {})
  const vars = Object.fromEntries(Object.entries(filtered)) as Record<string, string>

  if (process.env.NODE_ENV === "development") {
    console.log("[theme-presets:inline]", {
      brand,
      presetId: active?.presetId ?? null,
      presetName: active?.presetName ?? null,
      tokensSet: Object.keys(vars).length,
    })
  }

  return {
    brand,
    presetId: active?.presetId ?? null,
    presetName: active?.presetName ?? null,
    vars,
  }
}

