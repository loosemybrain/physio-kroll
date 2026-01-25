import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { BrandKey } from "@/components/brand/brandAssets"

export interface PageForNavigation {
  id: string
  slug: string
  title: string
  brand: BrandKey | null
  status: "draft" | "published"
  updated_at: string
}

/**
 * Lists all pages for admin navigation dropdown
 * Server-only function - no status filter, includes all pages (draft + published)
 * 
 * @param brand - Optional brand filter. If provided, only pages for this brand are returned
 * @returns Array of pages with id, slug, title, brand, status
 */
export async function listPagesServer(brand?: BrandKey): Promise<PageForNavigation[]> {
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

    // Check authentication (admin function)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn("listPagesServer: No session found, returning empty array")
      return []
    }

    // Build query - no status filter, all pages
    let query = supabase
      .from("pages")
      .select("id, slug, title, brand, status, updated_at")
      .order("updated_at", { ascending: false })

    // Optional brand filter
    if (brand) {
      query = query.eq("brand", brand)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching pages for navigation:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return []
    }

    // Map and normalize brand values (handle legacy values)
    const normalizedPages: PageForNavigation[] = (data || []).map((page) => ({
      id: page.id,
      slug: page.slug || "",
      title: page.title || "Untitled",
      brand: normalizeBrand(page.brand),
      status: (page.status as "draft" | "published") || "draft",
      updated_at: page.updated_at || new Date().toISOString(),
    }))

    return normalizedPages
  } catch (error) {
    console.error("Error in listPagesServer:", error)
    return []
  }
}

/**
 * Normalizes brand values to ensure consistency
 * Maps legacy values to current BrandKey format
 */
function normalizeBrand(brand: string | null | undefined): BrandKey | null {
  if (!brand) return null

  // Normalize legacy values
  if (brand === "physio" || brand === "physiotherapy") {
    return "physiotherapy"
  }
  if (brand === "konzept" || brand === "physio-konzept") {
    return "physio-konzept"
  }

  // Return as-is if already valid
  if (brand === "physiotherapy" || brand === "physio-konzept") {
    return brand as BrandKey
  }

  // Unknown brand value, return null
  console.warn(`Unknown brand value: ${brand}, returning null`)
  return null
}
