import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase/server"
import { deleteCustomFont } from "@/lib/fonts/storage.custom"

export async function POST(request: NextRequest) {
  try {
    // Authentifizierung prüfen
    const supabase = await createSupabaseServerClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { fontId } = await request.json()

    if (!fontId) {
      return NextResponse.json(
        { error: "Font ID ist erforderlich" },
        { status: 400 }
      )
    }

    // Admin client für DB/Storage Mutationen
    const admin = await getSupabaseAdmin()

    // Font löschen (Datei + DB entry)
    await deleteCustomFont(admin, fontId)

    return NextResponse.json({
      success: true,
      message: "Font gelöscht",
    })
  } catch (error) {
    console.error("Font delete error:", error)
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    )
  }
}
