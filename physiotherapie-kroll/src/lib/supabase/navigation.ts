import type { BrandKey } from "@/components/brand/brandAssets"
import type { NavConfig } from "@/types/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { DEFAULT_NAV_CONFIG } from "@/lib/consent/navigation-defaults"
import { ensureDefaultPresets } from "@/lib/cms/sectionPresets"

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
 * Get navigation configuration for a specific brand
 * Public access - used for rendering the header
 */
export async function getNavigation(brand: BrandKey): Promise<NavConfig> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Ignore in server component
          },
        },
      }
    )

    // Normalize brand key to ensure consistency
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
      console.error("Error fetching navigation:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
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
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Ignore in server component
          },
        },
      }
    )

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
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
          config: nextConfig as any,
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
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Ignore in server component
          },
        },
      }
    )

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
