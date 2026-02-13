import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase/server"
import { getCustomFonts } from "@/lib/fonts/storage.custom"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    // Auth prüfen (Cookie Client)
    const authClient = await createSupabaseServerClient()
    const { data: userData, error: userError } = await authClient.auth.getUser()

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Optional Filter aus Query
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get("brand") || undefined
    const onlyActive = searchParams.get("onlyActive") === "true"

    // Listing (Service Role)
    const admin = await getSupabaseAdmin()
    const fonts = await getCustomFonts(admin, { brand, onlyActive })

    return NextResponse.json({ success: true, fonts })
  } catch (error) {
    console.error("Error fetching custom fonts:", error)
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Fonts", details: String(error) },
      { status: 500 }
    )
  }
}