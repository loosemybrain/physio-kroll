import { NextResponse } from "next/server"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"

/**
 * GET /api/search?q=query
 * Search published pages by title
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const supabase = await getSupabasePublic()

    const { data, error } = await supabase
      .from("pages")
      .select("id, title, slug")
      .eq("status", "published")
      .ilike("title", `%${query}%`)
      .limit(10)

    if (error) {
      console.error("Error searching pages:", error)
      return NextResponse.json([], { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json([], { status: 500 })
  }
}
