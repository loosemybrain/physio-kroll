import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { deleteCustomFont, deleteFontFile } from "@/lib/fonts/storage.custom"

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

    // Font aus Datenbank abrufen
    const { data: font, error: fetchError } = await supabase
      .from("custom_fonts")
      .select("*")
      .eq("id", fontId)
      .single()

    if (fetchError || !font) {
      return NextResponse.json(
        { error: "Font nicht gefunden" },
        { status: 404 }
      )
    }

    // Datei löschen
    await deleteFontFile(font.file_name)

    // Font deaktivieren (nicht wirklich löschen, für Audit-Trail)
    await deleteCustomFont(fontId)

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
