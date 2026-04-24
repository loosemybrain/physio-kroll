"use client"

import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig } from "@/types/footer"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { footerConfigSchema } from "./footer.shared"

/**
 * Save footer configuration for a specific brand
 * Requires authentication - used in admin
 */
export async function saveFooterClient(
  brand: BrandKey,
  config: FooterConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate config
    const validationResult = footerConfigSchema.safeParse(config)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      return { success: false, error: `Validierungsfehler: ${errors}` }
    }

    const supabase = createSupabaseBrowserClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Unauthorized" }
    }

    // Upsert footer config
    const { error } = await supabase
      .from("footer")
      .upsert(
        {
          brand,
          config: config as unknown,
        },
        {
          onConflict: "brand",
        }
      )

    if (error) {
      console.error("Error saving footer:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveFooterClient:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
