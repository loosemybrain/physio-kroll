import "server-only"

import type { BrandKey } from "@/components/brand/brandAssets"
import type { NavConfig } from "@/types/navigation"
import { DEFAULT_NAV_CONFIG } from "@/lib/consent/navigation-defaults"
import { ensureDefaultPresets } from "@/lib/cms/sectionPresets"
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
 * Maps legacy values to current BrandKey format
 */
function normalizeBrandKey(brand: string | BrandKey): BrandKey {
  if (brand === "physio" || brand === "physiotherapy") {
    return "physiotherapy"
  }
  if (brand === "konzept" || brand === "physio-konzept") {
    return "physio-konzept"
  }
  // Return as-is if already valid
  if (brand === "physiotherapy" || brand === "physio-konzept") {
    return brand
  }
  // Default fallback
  console.warn(`[normalizeBrandKey] Unknown brand value: ${brand}, defaulting to physiotherapy`)
  return "physiotherapy"
}

/**
 * Get navigation configuration for a specific brand.
 * Nutzt den SSR-Session-Client (Anon-Key + Cookies) und unterliegt RLS.
 */
export async function getNavigation(brand: BrandKey): Promise<NavConfig> {
  try {
    const supabase = await createSupabaseServerClient()
    const normalizedBrand = normalizeBrandKey(brand)
    
    if (process.env.NODE_ENV === "development") {
      console.log("[getNavigation] Requested brand:", brand, "Normalized:", normalizedBrand)
    }

    const { data, error } = await supabase
      .from("navigation")
      .select("config, brand")
      .eq("brand", normalizedBrand)
      .maybeSingle()

    if (error) {
      const err = asErrorLike(error)
      console.error("Error fetching navigation:", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        requestedBrand: brand,
        normalizedBrand,
      })
      return DEFAULT_NAV_CONFIG
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[getNavigation] Found config for brand:", data?.brand, "Has logo:", !!data?.config?.logo)
    }

    const cfg = (data?.config as NavConfig) || DEFAULT_NAV_CONFIG
    // Seed defaults in-memory (no DB write on public GET)
    return ensureDefaultPresets(cfg, normalizedBrand)
  } catch (error) {
    console.error("Error in getNavigation:", error)
    return ensureDefaultPresets(DEFAULT_NAV_CONFIG, normalizeBrandKey(brand))
  }
}

/**
 * Save navigation configuration for a specific brand
 * Requires authentication - used in admin
 */
export async function saveNavigation(
  brand: BrandKey,
  config: NavConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Ensure presets exist (idempotent) on save
    const nextConfig = ensureDefaultPresets(config, normalizeBrandKey(brand))

    // Upsert navigation config
    const { error } = await supabase
      .from("navigation")
      .upsert(
        {
          brand,
          config: nextConfig as unknown,
        },
        {
          onConflict: "brand",
        }
      )

    if (error) {
      console.error("Error saving navigation:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveNavigation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get all pages for navigation link dropdown (admin)
 */
export async function getPagesForNavigation(): Promise<
  Array<{ id: string; title: string; slug: string }>
> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from("pages")
      .select("id, title, slug")
      .order("title", { ascending: true })

    if (error) {
      console.error("Error fetching pages:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPagesForNavigation:", error)
    return []
  }
}
