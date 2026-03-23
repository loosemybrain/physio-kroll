import { NextResponse } from "next/server"
import { getFooterServer, saveFooterServer } from "@/lib/supabase/footer.server"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig } from "@/types/footer"

/**
 * GET /api/footer?brand=physiotherapy
 * Returns footer config for a brand with pages data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = (searchParams.get("brand") || "physiotherapy") as BrandKey

    const footerConfig = await getFooterServer(brand)

    if (!footerConfig) {
      return NextResponse.json({
        config: {
          sections: [],
          bottomBar: { enabled: false },
        },
        pages: [],
        legalPages: [],
      })
    }

    const supabase = await getSupabasePublic()
    const { data: pages } = await supabase
      .from("pages")
      .select("id, slug, title, status, page_type, page_subtype")
      .eq("brand", brand)
      .eq("status", "published")
      .order("title", { ascending: true })

    const pagesMap = pages?.map((p) => ({ slug: p.slug, title: p.title })) || []
    const legalSubtypes = new Set(["privacy", "cookies", "imprint"])
    const ownBrandLegalPages =
      pages?.filter(
        (p) => p.page_type === "legal" && p.page_subtype && legalSubtypes.has(p.page_subtype)
      ).map((p) => ({ slug: p.slug, title: p.title, page_subtype: p.page_subtype!, brand })) ?? []

    // Legal-Seiten sollen für beide Brands verfügbar sein: fehlende Subtypes aus anderer Brand ergänzen.
    const { data: sharedLegalRows } = await supabase
      .from("pages")
      .select("slug, title, page_subtype, brand")
      .in("brand", ["physiotherapy", "physio-konzept"])
      .eq("status", "published")
      .eq("page_type", "legal")

    const bySubtype = new Map<string, { slug: string; title: string; page_subtype: string }>()
    for (const p of ownBrandLegalPages) bySubtype.set(p.page_subtype, p)
    for (const row of sharedLegalRows ?? []) {
      if (!row.page_subtype || !legalSubtypes.has(row.page_subtype)) continue
      if (!bySubtype.has(row.page_subtype)) {
        bySubtype.set(row.page_subtype, {
          slug: row.slug,
          title: row.title,
          page_subtype: row.page_subtype,
        })
      }
    }
    const legalPages = Array.from(bySubtype.values())

    return NextResponse.json({
      config: footerConfig,
      pages: pagesMap,
      legalPages,
    })
  } catch (error) {
    console.error("Error in footer API:", error)
    return NextResponse.json(
      {
        config: {
          sections: [],
          bottomBar: { enabled: false },
        },
        pages: [],
        legalPages: [],
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/footer
 * Saves footer config for a brand
 * Requires authentication
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brand, config } = body

    if (!brand || (brand !== "physiotherapy" && brand !== "physio-konzept")) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const result = await saveFooterServer(brand as BrandKey, config as FooterConfig)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to save footer" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in footer POST API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
