import { getSupabasePublic } from "@/lib/supabase/serverPublic"
import { NextRequest, NextResponse } from "next/server"

/**
 * API endpoint to check if a given page slug belongs to a legal page
 * Returns { isLegalPage: boolean }
 *
 * Query params:
 *   - slug: the page slug
 *   - brand: the brand (physiotherapy or physio-konzept, optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")
    const brand = searchParams.get("brand") || "physiotherapy"

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 }
      )
    }

    const supabasePublic = await getSupabasePublic()

    const { data: page, error } = await supabasePublic
      .from("pages")
      .select("page_type")
      .eq("slug", slug)
      .eq("brand", brand)
      .eq("status", "published")
      .single()

    if (error || !page) {
      return NextResponse.json({ isLegalPage: false })
    }

    const isLegalPage = (page as any).page_type === "legal"

    return NextResponse.json({ isLegalPage })
  } catch (error) {
    console.error("Error checking if page is legal:", error)
    return NextResponse.json({ isLegalPage: false })
  }
}
