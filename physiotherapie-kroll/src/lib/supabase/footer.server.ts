import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig } from "@/types/footer"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { DEFAULT_FOOTER_CONFIG, ensureSectionSpans, footerConfigSchema } from "./footer.shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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
 * Get footer configuration for a specific brand
 * Public access - used for rendering the footer
 */
export async function getFooterServer(brand: BrandKey): Promise<FooterConfig> {
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

    const normalizedBrand = normalizeBrandKey(brand)

    const { data, error } = await supabase
      .from("footer")
      .select("config, brand")
      .eq("brand", normalizedBrand)
      .maybeSingle()

    if (error) {
      console.error("Error fetching footer:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
        requestedBrand: brand,
        normalizedBrand,
      })
      return DEFAULT_FOOTER_CONFIG
    }

    const config = (data?.config as FooterConfig) || DEFAULT_FOOTER_CONFIG
    // Ensure backward compatibility: add spans if missing
    return ensureSectionSpans(config)
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
    const nextConfig = ensureSectionSpans(config)

    const { error } = await supabase
      .from("footer")
      .upsert(
        {
          brand: normalizedBrand,
          config: nextConfig as any,
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

