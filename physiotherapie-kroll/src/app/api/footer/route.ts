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
      })
    }

    // Load pages for pages blocks (only published)
    const supabase = await getSupabasePublic()
    const { data: pages } = await supabase
      .from("pages")
      .select("id, slug, title, status")
      .eq("status", "published")
      .order("title", { ascending: true })

    const pagesMap = pages?.map((p) => ({ slug: p.slug, title: p.title })) || []

    return NextResponse.json({
      config: footerConfig,
      pages: pagesMap,
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
