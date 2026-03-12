import "server-only"
import type { BrandKey } from "@/components/brand/brandAssets"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface PageForNavigation {
  id: string
  slug: string
  title: string
  brand: BrandKey | null
  status: "draft" | "published"
  updated_at: string
  /** Für Legal-Seiten: "legal" */
  pageType?: string
  /** Bei pageType "legal": "privacy" | "cookies" | "imprint" */
  pageSubtype?: string | null
}

/**
 * Lists all pages for admin navigation dropdown
 * Server-only function - no status filter, includes all pages (draft + published)
 * Uses service role to bypass RLS policies
 * 
 * @param brand - Optional brand filter. If provided, only pages for this brand are returned
 * @returns Array of pages with id, slug, title, brand, status
 */
export async function listPagesServer(brand?: BrandKey): Promise<PageForNavigation[]> {
  try {
    const supabase = await createSupabaseServerClient()

    // Build query - no status filter, all pages (include page_type/page_subtype for legal resolution)
    let query = supabase
      .from("pages")
      .select("id, slug, title, brand, status, updated_at, page_type, page_subtype")
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
      id: String(page.id),
      slug: String(page.slug || ""),
      title: String(page.title || "Untitled"),
      brand: normalizeBrand(page.brand),
      status: (page.status as "draft" | "published") || "draft",
      updated_at: String(page.updated_at || new Date().toISOString()),
      pageType: page.page_type ?? undefined,
      pageSubtype: page.page_subtype ?? undefined,
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

/** Ein Anker-Ziel: Block mit section.anchor === true. */
export interface AnchorTargetBlock {
  id: string
  type: string
}

/** Seite mit Liste von Anker-Zielblöcken (für Nav-Editor). */
export interface AnchorTargetPage {
  slug: string
  title: string
  blocks: AnchorTargetBlock[]
}

/**
 * Liefert alle Seiten einer Marke mit allen ihren Blöcken als Anker-Ziele.
 * Alle Blöcke können als Anker-Ziel verwendet werden (nicht nur markierte).
 * Nur für Admin (z. B. Navigation-Editor). Nutzt Service Role.
 */
export async function getAnchorTargets(brand: BrandKey): Promise<AnchorTargetPage[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: pages, error: pagesErr } = await supabase
      .from("pages")
      .select("id, slug, title")
      .eq("brand", brand)
      .order("updated_at", { ascending: false })

    if (pagesErr || !pages?.length) return []

    const out: AnchorTargetPage[] = []
    for (const page of pages) {
      const { data: blocks, error: blocksErr } = await supabase
        .from("blocks")
        .select("id, type")
        .eq("page_id", page.id)
        .order("sort", { ascending: true })

      if (blocksErr) continue

      const anchorBlocks: AnchorTargetBlock[] = (blocks ?? []).map((b) => ({
        id: b.id,
        type: b.type,
      }))

      // Nur Seiten mit Blöcken hinzufügen
      if (anchorBlocks.length > 0) {
        out.push({
          slug: String(page.slug ?? ""),
          title: String(page.title ?? "Untitled"),
          blocks: anchorBlocks,
        })
      }
    }

    return out
  } catch (e) {
    console.error("getAnchorTargets:", e)
    return []
  }
}
