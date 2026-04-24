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
      .maybeSingle()

    if (error) {
      return NextResponse.json({ isLegalPage: false })
    }
    if (page) {
      const isLegalPage = (page as Record<string, unknown>).page_type === "legal"
      return NextResponse.json({ isLegalPage })
    }

    // Fallback: Legal-Seiten können brandübergreifend genutzt werden.
    const { data: sharedLegal, error: sharedErr } = await supabasePublic
      .from("pages")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("page_type", "legal")
      .in("brand", ["physiotherapy", "physio-konzept"])
      .limit(1)
      .maybeSingle()
    if (sharedErr) return NextResponse.json({ isLegalPage: false })

    return NextResponse.json({ isLegalPage: Boolean(sharedLegal) })
  } catch (error) {
    console.error("Error checking if page is legal:", error)
    return NextResponse.json({ isLegalPage: false })
  }
}
