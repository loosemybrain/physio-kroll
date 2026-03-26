import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { getCustomFonts } from "@/lib/fonts/storage.custom"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const authClient = await createSupabaseServerClient()
    const guard = await requireAdminGuard(authClient)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
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
      { error: "Fehler beim Abrufen der Fonts", details: null },
      { status: 500 }
    )
  }
}