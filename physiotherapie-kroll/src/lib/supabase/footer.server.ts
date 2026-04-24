import "server-only"

import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig } from "@/types/footer"
import {
  DEFAULT_FOOTER_CONFIG,
  ensureSectionSpans,
  ensureLegalLinks,
  ensureSocialLinks,
  footerConfigSchema,
} from "./footer.shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"
function asErrorLike(error: unknown): {
  message?: string
  details?: string
  hint?: string
  code?: string
} {
  if (typeof error !== "object" || error === null) return {}
  const e = error as Record<string, unknown>
  return {
    message: typeof e.message === "string" ? e.message : undefined,
    details: typeof e.details === "string" ? e.details : undefined,
    hint: typeof e.hint === "string" ? e.hint : undefined,
    code: typeof e.code === "string" ? e.code : undefined,
  }
}


/**
 * Normalizes brand key to ensure consistency with database values
 */
function normalizeBrandKey(brand: string | BrandKey): BrandKey {
  if (brand === "physio" || brand === "physiotherapy") {
    return "physiotherapy"
  }
  if (brand === "konzept" || brand === "physio-konzept") {
    return "physio-konzept"
  }
  if (brand === "physiotherapy" || brand === "physio-konzept") {
    return brand
  }
  console.warn(`[normalizeBrandKey] Unknown brand value: ${brand}, defaulting to physiotherapy`)
  return "physiotherapy"
}

/**
 * Get footer configuration for a specific brand.
 * Nutzt den SSR-Session-Client (Anon-Key + Cookies) und unterliegt RLS.
 */
export async function getFooterServer(brand: BrandKey): Promise<FooterConfig> {
  try {
    const supabase = await createSupabaseServerClient()
    const normalizedBrand = normalizeBrandKey(brand)

    const { data, error } = await supabase
      .from("footer")
      .select("config, brand")
      .eq("brand", normalizedBrand)
      .maybeSingle()

    if (error) {
      const err = asErrorLike(error)
      console.error("Error fetching footer:", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        requestedBrand: brand,
        normalizedBrand,
      })
      return DEFAULT_FOOTER_CONFIG
    }

    const config = (data?.config as FooterConfig) || DEFAULT_FOOTER_CONFIG
    // Ensure backward compatibility: add spans and optional configs if missing
    return ensureSocialLinks(ensureLegalLinks(ensureSectionSpans(config)))
  } catch (error) {
    console.error("Error in getFooterServer:", error)
    return DEFAULT_FOOTER_CONFIG
  }
}

/**
 * Save footer configuration for a specific brand
 * Requires authentication - used in admin via server routes
 */
export async function saveFooterServer(
  brand: BrandKey,
  config: FooterConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate config
    const validationResult = footerConfigSchema.safeParse(config)
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ")
      return { success: false, error: `Validierungsfehler: ${errors}` }
    }

    const supabase = await createSupabaseServerClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return { success: false, error: "Unauthorized" }
    }

    const normalizedBrand = normalizeBrandKey(brand)
    const nextConfig = ensureSocialLinks(ensureLegalLinks(ensureSectionSpans(config)))

    const { error } = await supabase
      .from("footer")
      .upsert(
        {
          brand: normalizedBrand,
          config: nextConfig as unknown,
        },
        { onConflict: "brand" }
      )

    if (error) {
      console.error("Error saving footer:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveFooterServer:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

